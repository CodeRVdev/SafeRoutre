import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

import '../models/zone_model.dart';
import '../models/hazard_model.dart';
import '../models/alert_model.dart';
import '../models/route_guidance_model.dart';
import '../models/navigation_step_model.dart';
import '../api/map_api.dart';
import '../api/alert_api.dart';
import '../api/routing_api.dart';
import '../api/checkin_api.dart';
import '../api/api_client.dart';
import '../services/auth_service.dart';
import '../services/location_service.dart';
import '../services/socket_service.dart';
import '../services/audio_siren_service.dart';
import '../services/language_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/navigation_top_card.dart';
import '../widgets/navigation_bottom_bar.dart';
import '../widgets/route_preview_sheet.dart';
import '../widgets/arrival_dialog.dart';
import 'emergency_alert_screen.dart';

class EvacuationMapScreen extends StatefulWidget {
  final bool autoStartNavigation;
  final ValueChanged<bool>? onNavigationStateChanged;

  const EvacuationMapScreen({
    super.key,
    this.autoStartNavigation = false,
    this.onNavigationStateChanged,
  });

  @override
  State<EvacuationMapScreen> createState() => _EvacuationMapScreenState();
}

class _EvacuationMapScreenState extends State<EvacuationMapScreen> {
  final MapController _mapController = MapController();

  List<ZoneModel> _zones = [];
  List<HazardModel> _hazards = [];
  AlertModel? _activeAlert;
  RouteGuidanceModel? _activeRoute;

  // Navigation State
  List<NavigationStep> _navigationSteps = [];
  NavigationProgress? _navigationProgress;
  bool _isLiveNavigation = false;
  bool _showRoutePreview = false;
  bool _isLoadingRoute = false;
  bool _isRecalculating = false;
  bool _isHazardAhead = false;
  bool _isRouteUpdated = false;
  bool _hasShownArrival = false;

  Timer? _routeUpdatedTimer;
  Timer? _rerouteDebounceTimer;

  bool _isSatelliteView = true;
  bool _isCheckingIn = false;
  bool _isCheckedIn = false;

  // Authoritative Polonuling National High School Reference Coordinates
  final LatLng _polonolingCenter = const LatLng(6.2882333, 124.9675614);

  /// Submits "I AM SAFE" check-in immediately to SafeRoute backend and stops siren
  Future<void> _handleDirectSafeCheckin(AlertModel alert) async {
    final auth = Provider.of<AuthService>(context, listen: false);
    final locationService = Provider.of<LocationService>(context, listen: false);
    final sirenService = Provider.of<AudioSirenService>(context, listen: false);

    if (auth.token == null) return;

    setState(() {
      _isCheckingIn = true;
    });

    // 1. Immediately stop the siren audio
    await sirenService.stopSiren();

    // Actively attempt real GPS fix (returns null if disabled or unavailable; never fake)
    LatLng? liveGps;
    try {
      liveGps = await locationService.getCurrentLiveLocation(requestPermissionIfDenied: false);
    } catch (_) {}

    final nearestZone = locationService.calculateNearestZone(_zones);

    try {
      // 2. Submit check-in to SafeRoute backend
      await CheckinApi.submitCheckin(
        token: auth.token!,
        alertId: alert.alertId,
        zoneId: nearestZone?.zoneId,
        location: liveGps,
        status: 'safe',
        message: 'Checked in as safe via SafeRoute Evacuation Navigation.',
      );

      if (!mounted) return;
      setState(() {
        _isCheckingIn = false;
        _isCheckedIn = true;
      });

      // 3. Refresh occupancy counts
      _fetchMapData();

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✅ STATUS RECORDED: You have been marked SAFE. Safety coordinators notified.'),
          backgroundColor: AppTheme.safeEmerald,
          duration: Duration(seconds: 5),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isCheckingIn = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('⚠️ Check-in error: $e'),
          backgroundColor: AppTheme.emergencyRose,
        ),
      );
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final socket = Provider.of<SocketService>(context, listen: false);
      socket.addListener(_onSocketUpdate);
    });
    _fetchMapData().then((_) {
      if (widget.autoStartNavigation) {
        _calculateSafeRoute(isReroute: false, autoStart: true);
      }
    });
  }

  @override
  void dispose() {
    _routeUpdatedTimer?.cancel();
    _rerouteDebounceTimer?.cancel();
    try {
      final socket = Provider.of<SocketService>(context, listen: false);
      socket.removeListener(_onSocketUpdate);
    } catch (_) {}
    try {
      final loc = Provider.of<LocationService>(context, listen: false);
      loc.stopLocationStream();
    } catch (_) {}
    super.dispose();
  }

  /// Checks whether an active hazard intersects the user's current recommended route
  bool _hazardAffectsActiveRoute(HazardModel hazard) {
    if (_activeRoute == null || _activeRoute!.waypoints.isEmpty) return false;

    const Distance distance = Distance();
    final hazardRadius = hazard.radiusMeters;

    for (int i = 0; i < _activeRoute!.waypoints.length; i++) {
      final pt = _activeRoute!.waypoints[i];
      final distToPt = distance.as(LengthUnit.Meter, hazard.location, pt);
      if (distToPt <= hazardRadius) {
        return true;
      }

      // Check perpendicular distance to line segment between waypoints[i] and waypoints[i+1]
      if (i < _activeRoute!.waypoints.length - 1) {
        final nextPt = _activeRoute!.waypoints[i + 1];
        final distToSeg = _distanceToSegment(hazard.location, pt, nextPt);
        if (distToSeg <= hazardRadius) {
          return true;
        }
      }
    }
    return false;
  }

  /// Calculates perpendicular distance from point P to line segment AB in meters
  double _distanceToSegment(LatLng p, LatLng a, LatLng b) {
    const Distance distance = Distance();
    final double l2 = (b.latitude - a.latitude) * (b.latitude - a.latitude) +
        (b.longitude - a.longitude) * (b.longitude - a.longitude);
    if (l2 == 0) return distance.as(LengthUnit.Meter, p, a);

    double t = ((p.latitude - a.latitude) * (b.latitude - a.latitude) +
            (p.longitude - a.longitude) * (b.longitude - a.longitude)) /
        l2;
    t = t.clamp(0.0, 1.0);

    final LatLng proj = LatLng(
      a.latitude + t * (b.latitude - a.latitude),
      a.longitude + t * (b.longitude - a.longitude),
    );
    return distance.as(LengthUnit.Meter, p, proj);
  }

  Future<void> _onSocketUpdate() async {
    if (!mounted) return;
    final auth = Provider.of<AuthService>(context, listen: false);
    if (auth.token == null) return;

    try {
      final previousHazards = List<HazardModel>.from(_hazards);
      List<ZoneModel> zones = _zones;
      List<HazardModel> newHazards = _hazards;
      AlertModel? alert = _activeAlert;

      try {
        zones = await MapApi.getZones(auth.token!);
      } catch (e) {
        debugPrint('ℹ️ Zones fetch note on socket update: $e');
      }

      try {
        newHazards = await MapApi.getActiveHazards(auth.token!);
      } catch (e) {
        debugPrint('ℹ️ Hazards fetch note on socket update: $e');
      }

      try {
        final activeAlerts = await AlertApi.getActiveAlerts(auth.token!);
        alert = activeAlerts.isNotEmpty ? activeAlerts.first : null;
      } catch (e) {
        debugPrint('ℹ️ Alerts fetch note on socket update: $e');
      }

      if (!mounted) return;

      setState(() {
        _zones = zones;
        _hazards = newHazards;
        _activeAlert = alert;
      });

      // If user is currently navigating, check if newly created or updated hazards affect active route
      if ((_isLiveNavigation || _showRoutePreview) && _activeRoute != null) {
        final previousIds = previousHazards.map((h) => h.hazardId).toSet();
        final newlyAddedHazards = newHazards.where((h) => !previousIds.contains(h.hazardId)).toList();

        bool routeIntersectsHazard = false;
        for (final h in newlyAddedHazards) {
          if (_hazardAffectsActiveRoute(h)) {
            routeIntersectsHazard = true;
            break;
          }
        }

        if (routeIntersectsHazard) {
          debugPrint('⚠️ Active hazard intersects route. Initiating live auto-rerouting...');
          setState(() {
            _isHazardAhead = true;
            _isRecalculating = true;
          });
          _calculateSafeRoute(isReroute: true);
        }
      }
    } catch (e) {
      debugPrint('Error updating map data on socket event: $e');
    }
  }

  Future<void> _fetchMapData() async {
    final auth = Provider.of<AuthService>(context, listen: false);
    if (auth.token == null) return;

    List<ZoneModel> zones = _zones;
    List<HazardModel> hazards = _hazards;
    AlertModel? alert = _activeAlert;

    try {
      zones = await MapApi.getZones(auth.token!);
    } catch (e) {
      debugPrint('ℹ️ Zones fetch note: $e');
    }

    try {
      hazards = await MapApi.getActiveHazards(auth.token!);
    } catch (e) {
      debugPrint('ℹ️ Hazards fetch note: $e');
    }

    try {
      final activeAlerts = await AlertApi.getActiveAlerts(auth.token!);
      alert = activeAlerts.isNotEmpty ? activeAlerts.first : null;
    } catch (e) {
      debugPrint('ℹ️ Active alerts fetch note: $e');
    }

    if (mounted) {
      setState(() {
        _zones = zones;
        _hazards = hazards;
        _activeAlert = alert;
      });
    }
  }

  /// Calculates safe evacuation route from backend and either opens Route Preview Sheet or continues live navigation
  Future<void> _calculateSafeRoute({
    LatLng? destinationLocation,
    bool isReroute = false,
    bool autoStart = false,
  }) async {
    final auth = Provider.of<AuthService>(context, listen: false);
    final locationService = Provider.of<LocationService>(context, listen: false);
    if (auth.token == null) return;

    setState(() {
      _isLoadingRoute = true;
      if (isReroute) {
        _isRecalculating = true;
      }
    });

    try {
      final route = await RoutingApi.getSafePath(
        token: auth.token!,
        userLocation: locationService.currentLocation,
        destinationLocation: destinationLocation,
      );

      // Generate turn-by-turn navigation steps from pathway geometry
      final steps = NavigationEngine.generateSteps(
        route.waypoints,
        route.destinationName,
      );

      // Compute initial navigation progress
      final progress = NavigationEngine.updateProgress(
        userPos: locationService.currentLocation,
        waypoints: route.waypoints,
        steps: steps,
        currentStepIndex: 0,
        destinationName: route.destinationName,
      );

      if (!mounted) return;

      setState(() {
        _activeRoute = route;
        _navigationSteps = steps;
        _navigationProgress = progress;
        _isLoadingRoute = false;
        _isRecalculating = false;
        _isHazardAhead = false;

        if (isReroute) {
          _isRouteUpdated = true;
        } else if (autoStart) {
          _startLiveNavigation();
        } else {
          _showRoutePreview = true;
        }
      });

      // Fit map camera to show route
      if (route.waypoints.isNotEmpty) {
        if (_isLiveNavigation) {
          _mapController.move(locationService.currentLocation, 18.5);
        } else {
          _mapController.fitCamera(
            CameraFit.coordinates(
              coordinates: route.waypoints,
              padding: const EdgeInsets.fromLTRB(40, 40, 40, 240),
            ),
          );
        }
      }

      // If this was a reroute, dismiss the success banner after 5 seconds
      if (isReroute) {
        _routeUpdatedTimer?.cancel();
        _routeUpdatedTimer = Timer(const Duration(seconds: 5), () {
          if (mounted) {
            setState(() {
              _isRouteUpdated = false;
            });
          }
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoadingRoute = false;
        _isRecalculating = false;
        _isHazardAhead = false;
      });
      debugPrint('Error calculating safe evacuation route: $e');

      final errStr = e.toString();
      final isAllBlocked = errStr.contains('All accessible pathways') ||
          errStr.contains('blocked by active hazards');

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isAllBlocked
                ? '🚨 CRITICAL: All pathways to evacuation zones are blocked by active hazards. Please shelter in place and await instructions from SDRRM Coordinators.'
                : '⚠️ Unable to calculate a safe route: $e',
          ),
          backgroundColor: AppTheme.emergencyRose,
          duration: const Duration(seconds: 7),
          action: SnackBarAction(
            label: 'RETRY',
            textColor: Colors.white,
            onPressed: () => _calculateSafeRoute(
              destinationLocation: destinationLocation,
              isReroute: isReroute,
            ),
          ),
        ),
      );
    }
  }

  /// Starts live turn-by-turn navigation mode
  void _startLiveNavigation() {
    final locationService = Provider.of<LocationService>(context, listen: false);

    setState(() {
      _showRoutePreview = false;
      _isLiveNavigation = true;
      _hasShownArrival = false;
    });

    widget.onNavigationStateChanged?.call(true);

    // Zoom camera in on walking user
    _mapController.move(locationService.currentLocation, 18.5);

    // Start continuous high-accuracy GPS position updates
    locationService.startLocationStream(
      onLocationChanged: _onLiveLocationUpdate,
    );
  }

  /// Live GPS update handler during active navigation
  void _onLiveLocationUpdate(LatLng newPos) {
    if (!_isLiveNavigation || _activeRoute == null || _navigationSteps.isEmpty) {
      return;
    }

    final currentIdx = _navigationProgress?.currentStepIndex ?? 0;
    final updatedProgress = NavigationEngine.updateProgress(
      userPos: newPos,
      waypoints: _activeRoute!.waypoints,
      steps: _navigationSteps,
      currentStepIndex: currentIdx,
      destinationName: _activeRoute!.destinationName,
    );

    setState(() {
      _navigationProgress = updatedProgress;
    });

    // Auto-center map on user marker
    _mapController.move(newPos, _mapController.camera.zoom);

    // 1. Arrival Check (<= 10m to destination)
    if (updatedProgress.isArrived && !_hasShownArrival) {
      _hasShownArrival = true;
      _showArrivalDialog();
      return;
    }

    // 2. Off-Route Check (> 25m from campus route line)
    if (updatedProgress.isOffRoute && !_isRecalculating) {
      _triggerOffRouteReroute();
    }
  }

  /// Debounces off-route detection before triggering backend reroute
  void _triggerOffRouteReroute() {
    if (_rerouteDebounceTimer?.isActive ?? false) return;

    _rerouteDebounceTimer = Timer(const Duration(seconds: 3), () {
      if (!mounted || !_isLiveNavigation) return;
      debugPrint('📍 User off-route confirmed (>25m). Recalculating safest route...');
      setState(() {
        _isRecalculating = true;
      });
      _calculateSafeRoute(isReroute: true);
    });
  }

  /// Displays safe arrival dialog
  void _showArrivalDialog() {
    final socketService = Provider.of<SocketService>(context, listen: false);
    final effectiveAlert = _activeAlert ?? socketService.currentActiveAlert;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => ArrivalDialog(
        destinationName: _activeRoute?.destinationName ?? 'Evacuation Zone',
        isEmergencyActive: effectiveAlert != null,
        isCheckedIn: _isCheckedIn,
        onSafeCheckin: effectiveAlert != null
            ? () {
                Navigator.of(ctx).pop();
                _handleDirectSafeCheckin(effectiveAlert);
              }
            : null,
        onDone: () {
          Navigator.of(ctx).pop();
          _exitLiveNavigation();
        },
      ),
    );
  }

  /// Safely terminates navigation mode and restores normal map view
  void _exitLiveNavigation() {
    final locationService = Provider.of<LocationService>(context, listen: false);
    locationService.stopLocationStream();

    _routeUpdatedTimer?.cancel();
    _rerouteDebounceTimer?.cancel();

    setState(() {
      _isLiveNavigation = false;
      _showRoutePreview = false;
      _activeRoute = null;
      _navigationProgress = null;
      _navigationSteps = [];
      _isHazardAhead = false;
      _isRecalculating = false;
      _isRouteUpdated = false;
      _hasShownArrival = false;
    });

    widget.onNavigationStateChanged?.call(false);

    // Reset camera to campus center overview
    _mapController.move(_polonolingCenter, 16.0);
  }

  void _zoomIn() {
    final currentZoom = _mapController.camera.zoom;
    if (currentZoom < 21.0) {
      _mapController.move(_mapController.camera.center, currentZoom + 0.8);
    }
  }

  void _zoomOut() {
    final currentZoom = _mapController.camera.zoom;
    if (currentZoom > 13.0) {
      _mapController.move(_mapController.camera.center, currentZoom - 0.8);
    }
  }

  @override
  Widget build(BuildContext context) {
    final locationService = Provider.of<LocationService>(context);
    final socketService = Provider.of<SocketService>(context);
    final effectiveAlert = _activeAlert ?? socketService.currentActiveAlert;
    final nearestZone = locationService.calculateNearestZone(_zones);

    return Scaffold(
      body: Stack(
        children: [
          // Flutter Map Canvas
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _polonolingCenter,
              initialZoom: 16.0,
              minZoom: 13.0,
              maxZoom: 21.0,
            ),
            children: [
              // Tile Layer: Esri World Imagery Satellite vs OpenStreetMap
              TileLayer(
                urlTemplate: _isSatelliteView
                    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                    : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                maxNativeZoom: 19,
                maxZoom: 21,
                userAgentPackageName: 'com.saferoute.mobile',
              ),

              // Attribution Overlay
              RichAttributionWidget(
                attributions: [
                  TextSourceAttribution(
                    _isSatelliteView
                        ? 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and GIS Community'
                        : 'OpenStreetMap contributors',
                  ),
                ],
              ),

              // Hazard Buffer Circles Layer (Authoritative Danger Areas)
              if (_hazards.isNotEmpty)
                CircleLayer(
                  circles: _hazards.map((hazard) {
                    return CircleMarker(
                      point: hazard.location,
                      radius: hazard.radiusMeters,
                      useRadiusInMeter: true,
                      color: AppTheme.emergencyRose.withOpacity(0.28),
                      borderColor: AppTheme.emergencyRose,
                      borderStrokeWidth: 2.5,
                    );
                  }).toList(),
                ),

              // Polygon Zones Layer
              PolygonLayer(
                polygons: _zones.map((zone) {
                  final isEvacuation = zone.type == 'evacuation_point';
                  final isFull = zone.isFull;
                  return Polygon(
                    points: zone.polygonPoints,
                    color: isFull
                        ? AppTheme.emergencyRose.withOpacity(0.4)
                        : (isEvacuation
                            ? AppTheme.primaryCyan.withOpacity(0.35)
                            : AppTheme.safeEmerald.withOpacity(0.35)),
                    borderColor: isFull
                        ? AppTheme.emergencyRose
                        : (isEvacuation ? AppTheme.primaryCyan : AppTheme.safeEmerald),
                    borderStrokeWidth: 2.5,
                  );
                }).toList(),
              ),

              // Zone Capacity Labels & Tappable Destination Markers
              MarkerLayer(
                markers: _zones.map((zone) {
                  final isFull = zone.isFull;
                  return Marker(
                    point: zone.centerPoint,
                    width: 140,
                    height: 34,
                    child: GestureDetector(
                      onTap: () {
                        if (!_isLiveNavigation) {
                          _calculateSafeRoute(
                            destinationLocation: zone.centerPoint,
                          );
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: isFull
                              ? AppTheme.emergencyRose
                              : AppTheme.surfaceCard.withOpacity(0.92),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isFull ? Colors.white : AppTheme.primaryCyan,
                            width: 1.5,
                          ),
                          boxShadow: const [
                            BoxShadow(color: Colors.black45, blurRadius: 4),
                          ],
                        ),
                        child: Center(
                          child: Text(
                            isFull
                                ? '🔴 ${zone.name} (FULL)'
                                : '📊 ${zone.name}: ${zone.currentOccupancy}/${zone.capacity}',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: isFull ? FontWeight.w900 : FontWeight.bold,
                            ),
                            textAlign: TextAlign.center,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),

              // Polyline Layer for Evacuation Route Path (Inspired by Reference Image 1)
              if (_activeRoute != null && _activeRoute!.waypoints.isNotEmpty) ...[
                // Outer Glow Route Line
                PolylineLayer(
                  polylines: [
                    Polyline(
                      points: _activeRoute!.waypoints,
                      color: const Color(0xFF0284C7).withOpacity(0.45),
                      strokeWidth: 9.0,
                    ),
                  ],
                ),
                // Inner Vivid Pathway Route Line
                PolylineLayer(
                  polylines: [
                    Polyline(
                      points: _activeRoute!.waypoints,
                      color: const Color(0xFF0284C7), // Blue pathway line from Reference 1
                      strokeWidth: 4.5,
                    ),
                  ],
                ),
              ],

              // Active Hazard Warning Markers Layer
              MarkerLayer(
                markers: [
                  ..._hazards.map((hazard) {
                    return Marker(
                      point: hazard.location,
                      width: 40,
                      height: 40,
                      child: GestureDetector(
                        onTap: () => _showHazardDetailsBottomSheet(hazard),
                        child: Container(
                          decoration: BoxDecoration(
                            color: AppTheme.emergencyRose,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.emergencyRose.withOpacity(0.5),
                                blurRadius: 8,
                              )
                            ],
                          ),
                          child: const Icon(
                            Icons.warning_rounded,
                            color: Colors.white,
                            size: 22,
                          ),
                        ),
                      ),
                    );
                  }),

                  // Destination Pin Marker (Reference Image 1 & 2)
                  if (_activeRoute != null)
                    Marker(
                      point: _activeRoute!.destinationCenter,
                      width: 44,
                      height: 44,
                      child: const Stack(
                        alignment: Alignment.center,
                        children: [
                          Icon(
                            Icons.location_on,
                            color: Color(0xFFDC2626), // Ruby red pin
                            size: 42,
                            shadows: [
                              Shadow(
                                color: Colors.black54,
                                blurRadius: 8,
                                offset: Offset(0, 3),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                ],
              ),

              // Walking Pedestrian User Marker (Matching Reference Image 1)
              MarkerLayer(
                markers: [
                  Marker(
                    point: locationService.currentLocation,
                    width: 48,
                    height: 48,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Soft pulsing translucent halo
                        Container(
                          width: 46,
                          height: 46,
                          decoration: BoxDecoration(
                            color: const Color(0xFF0284C7).withOpacity(0.28),
                            shape: BoxShape.circle,
                          ),
                        ),
                        // White circle with blue walking pedestrian icon
                        Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: const Color(0xFF0284C7),
                              width: 2.2,
                            ),
                            boxShadow: const [
                              BoxShadow(
                                color: Colors.black26,
                                blurRadius: 5,
                                offset: Offset(0, 2),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.directions_walk_rounded,
                            color: Color(0xFF0284C7),
                            size: 19,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),

          // ── TOP NAVIGATION CARD (Reference Image 1) ──
          if (_isLiveNavigation && _navigationProgress != null)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: NavigationTopCard(
                progress: _navigationProgress!,
                totalSteps: _navigationSteps.length,
                destinationName: _activeRoute?.destinationName ?? 'Evacuation Zone',
                isRecalculating: _isRecalculating,
                isHazardAhead: _isHazardAhead,
                isRouteUpdated: _isRouteUpdated,
              ),
            )
          else if (!_showRoutePreview)
            // Normal Top Header Banner
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    // Nearest Safe Zone Banner
                    Card(
                      color: AppTheme.surfaceCard.withOpacity(0.92),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 12),
                        child: Row(
                          children: [
                            const Icon(Icons.near_me,
                                color: AppTheme.primaryCyan, size: 24),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    AppLocalizations.of(context)?.nearestSafeZone ??
                                        'Nearest Recommended Safe Zone:',
                                    style: const TextStyle(
                                        fontSize: 10, color: Colors.grey),
                                  ),
                                  Text(
                                    nearestZone != null
                                        ? nearestZone.name
                                        : 'Polonoling NHS Evacuation Oval',
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Consumer<LanguageProvider>(
                              builder: (ctx, lang, _) {
                                return InkWell(
                                  onTap: () => lang.toggleLanguage(),
                                  borderRadius: BorderRadius.circular(12),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: AppTheme.primaryCyan.withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                          color: AppTheme.primaryCyan.withOpacity(0.3)),
                                    ),
                                    child: Text(
                                      lang.isFilipino ? '🇵🇭 FIL' : '🇺🇸 ENG',
                                      style: const TextStyle(
                                        color: AppTheme.primaryCyan,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w900,
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
                            const SizedBox(width: 4),
                            IconButton(
                              icon: const Icon(Icons.refresh, size: 20),
                              onPressed: _fetchMapData,
                            )
                          ],
                        ),
                      ),
                    ),

                    if (effectiveAlert != null) ...[
                      const SizedBox(height: 8),
                      // Active Emergency or Drill Banner Alert Button
                      GestureDetector(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => EmergencyAlertScreen(
                                alert: effectiveAlert,
                                zones: _zones,
                                onCheckinComplete: _fetchMapData,
                              ),
                            ),
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: effectiveAlert.isDrill
                                ? AppTheme.primaryCyan
                                : AppTheme.emergencyRose,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: (effectiveAlert.isDrill
                                        ? AppTheme.primaryCyan
                                        : AppTheme.emergencyRose)
                                    .withOpacity(0.4),
                                blurRadius: 10,
                              )
                            ],
                          ),
                          child: Row(
                            children: [
                              Icon(
                                effectiveAlert.isDrill
                                    ? Icons.directions_run
                                    : Icons.campaign,
                                color: Colors.white,
                                size: 24,
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      effectiveAlert.title,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w800,
                                        fontSize: 12,
                                      ),
                                    ),
                                    Text(
                                      effectiveAlert.isDrill
                                          ? '🔵 EVACUATION DRILL IN PROGRESS — TAP TO CHECK IN'
                                          : 'TAP HERE TO VIEW SIREN & CHECK IN SAFE',
                                      style: const TextStyle(
                                        color: Colors.white70,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w900,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const Icon(Icons.chevron_right, color: Colors.white),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),

          // ── FLOATING MAP CONTROLS (Zoom, Layers, Navigate FAB) ──
          Positioned(
            right: 16,
            bottom: _isLiveNavigation
                ? 110
                : (_showRoutePreview ? 260 : 80),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                // "NAVIGATE TO SAFETY" Floating Action Button (when not in live navigation)
                if (!_isLiveNavigation && !_showRoutePreview) ...[
                  FloatingActionButton.extended(
                    heroTag: 'navigate_safety_btn',
                    onPressed: _isLoadingRoute ? null : () => _calculateSafeRoute(),
                    backgroundColor: AppTheme.safeEmerald,
                    icon: _isLoadingRoute
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Icon(Icons.navigation, color: Colors.white),
                    label: const Text(
                      'NAVIGATE TO SAFETY',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 12,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],

                // Zoom In (+) Floating Button
                FloatingActionButton.small(
                  heroTag: 'zoom_in_btn',
                  onPressed: _zoomIn,
                  backgroundColor: AppTheme.surfaceCard,
                  child: const Icon(Icons.add, color: AppTheme.primaryCyan),
                ),
                const SizedBox(height: 8),

                // Zoom Out (−) Floating Button
                FloatingActionButton.small(
                  heroTag: 'zoom_out_btn',
                  onPressed: _zoomOut,
                  backgroundColor: AppTheme.surfaceCard,
                  child: const Icon(Icons.remove, color: AppTheme.primaryCyan),
                ),
                const SizedBox(height: 12),

                // Map Layer Toggle (Satellite vs Street Map)
                if (!_isLiveNavigation) ...[
                  FloatingActionButton.extended(
                    heroTag: 'map_layer_toggle',
                    onPressed: () {
                      setState(() {
                        _isSatelliteView = !_isSatelliteView;
                      });
                    },
                    backgroundColor: AppTheme.surfaceCard,
                    icon: Icon(
                      _isSatelliteView ? Icons.map_outlined : Icons.satellite_alt,
                      color: AppTheme.primaryCyan,
                    ),
                    label: Text(
                      _isSatelliteView ? 'Street View' : 'Satellite View',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),

          // ── ROUTE PREVIEW SHEET (Reference Image 2) ──
          if (_showRoutePreview && _activeRoute != null)
            Align(
              alignment: Alignment.bottomCenter,
              child: RoutePreviewSheet(
                route: _activeRoute!,
                steps: _navigationSteps,
                onStartNavigation: _startLiveNavigation,
                onClose: () {
                  setState(() {
                    _showRoutePreview = false;
                    _activeRoute = null;
                    _navigationSteps = [];
                  });
                  _mapController.move(_polonolingCenter, 16.0);
                },
              ),
            ),

          // ── BOTTOM NAVIGATION CARD (Reference Image 1) ──
          if (_isLiveNavigation && _navigationProgress != null && _activeRoute != null)
            Align(
              alignment: Alignment.bottomCenter,
              child: NavigationBottomBar(
                progress: _navigationProgress!,
                destinationName: _activeRoute!.destinationName,
                onExit: _exitLiveNavigation,
                isEmergencyActive: effectiveAlert != null,
                isCheckedIn: _isCheckedIn,
                onSafeCheckin: effectiveAlert != null
                    ? () => _handleDirectSafeCheckin(effectiveAlert)
                    : null,
              ),
            ),

          // ── BOTTOM SAFE CHECK-IN BUTTON (Normal Map View during Emergency) ──
          if (!_isLiveNavigation && !_showRoutePreview && effectiveAlert != null)
            Positioned(
              left: 16,
              right: 16,
              bottom: 16,
              child: SizedBox(
                height: 52,
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isCheckingIn || _isCheckedIn
                      ? null
                      : () => _handleDirectSafeCheckin(effectiveAlert),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _isCheckedIn
                        ? AppTheme.safeEmerald.withOpacity(0.6)
                        : (effectiveAlert.isDrill
                            ? AppTheme.primaryCyan
                            : AppTheme.safeEmerald),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 6,
                  ),
                  child: _isCheckingIn
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2.5,
                          ),
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              _isCheckedIn
                                  ? Icons.check_circle
                                  : Icons.health_and_safety,
                              size: 24,
                              color: Colors.white,
                            ),
                            const SizedBox(width: 10),
                            Text(
                              _isCheckedIn
                                  ? '✅ STATUS RECORDED — YOU ARE SAFE'
                                  : (effectiveAlert.isDrill
                                      ? '🔵 DRILL CHECK-IN — I AM AT THE ASSEMBLY AREA'
                                      : 'I AM SAFE — CHECK IN NOW'),
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.5,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _showHazardDetailsBottomSheet(HazardModel hazard) {
    final photoUrl = hazard.photoUrl;
    final serverBase = ApiClient.baseUrl.replaceAll(RegExp(r'/api/?$'), '');
    final fullPhotoUrl = photoUrl != null
        ? (photoUrl.startsWith('http') ? photoUrl : '$serverBase$photoUrl')
        : null;

    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.surfaceCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.emergencyRose.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.warning_amber_rounded,
                      color: AppTheme.emergencyRose,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          hazard.type,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'SEVERITY: ${hazard.severity.toUpperCase()}',
                          style: TextStyle(
                            color: hazard.severity == 'critical'
                                ? AppTheme.emergencyRose
                                : (hazard.severity == 'high'
                                    ? AppTheme.warningAmber
                                    : AppTheme.primaryCyan),
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white54),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (fullPhotoUrl != null) ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Image.network(
                    fullPhotoUrl,
                    height: 180,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        height: 120,
                        width: double.infinity,
                        color: Colors.black26,
                        child: const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.broken_image_outlined,
                                color: Colors.white38, size: 36),
                            SizedBox(height: 4),
                            Text(
                              'Photo Evidence Unavailable',
                              style: TextStyle(
                                  color: Colors.white38, fontSize: 11),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 14),
              ] else ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.no_photography_outlined,
                          color: Colors.white38, size: 20),
                      SizedBox(width: 8),
                      Text(
                        'No photo evidence attached to this hazard',
                        style: TextStyle(color: Colors.white54, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
              ],
              Text(
                hazard.description,
                style: const TextStyle(
                    color: Colors.white70, fontSize: 13, height: 1.4),
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }
}
