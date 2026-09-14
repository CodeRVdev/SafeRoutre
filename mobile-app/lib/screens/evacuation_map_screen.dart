import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../models/zone_model.dart';
import '../models/hazard_model.dart';
import '../models/alert_model.dart';
import '../models/route_guidance_model.dart';
import '../api/map_api.dart';
import '../api/alert_api.dart';
import '../api/routing_api.dart';
import '../api/checkin_api.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import '../services/auth_service.dart';
import '../services/location_service.dart';
import '../services/socket_service.dart';
import '../services/audio_siren_service.dart';
import '../services/language_provider.dart';
import '../theme/app_theme.dart';
import 'emergency_alert_screen.dart';

class EvacuationMapScreen extends StatefulWidget {
  final bool autoStartNavigation;

  const EvacuationMapScreen({
    super.key,
    this.autoStartNavigation = false,
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
  bool _isSatelliteView = true;
  bool _isNavigating = false;
  bool _isLoadingRoute = false;
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

    final nearestZone = locationService.calculateNearestZone(_zones);

    try {
      // 2. Submit check-in to SafeRoute backend
      await CheckinApi.submitCheckin(
        token: auth.token!,
        alertId: alert.alertId,
        zoneId: nearestZone?.zoneId,
        location: locationService.currentLocation,
        status: 'safe',
        message: 'Checked in as safe via SafeRoute Evacuation Map.',
      );

      setState(() {
        _isCheckingIn = false;
        _isCheckedIn = true;
      });

      // 3. Refresh occupancy counts
      _fetchMapData();

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✅ STATUS RECORDED: You have been marked SAFE. Safety coordinators notified.'),
          backgroundColor: AppTheme.safeEmerald,
          duration: Duration(seconds: 5),
        ),
      );
    } catch (e) {
      setState(() {
        _isCheckingIn = false;
      });
      if (!mounted) return;
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
        _startNavigation();
      }
    });
  }

  @override
  void dispose() {
    try {
      final socket = Provider.of<SocketService>(context, listen: false);
      socket.removeListener(_onSocketUpdate);
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
      if (_isNavigating && _activeRoute != null) {
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
          // Route is compromised: invalidate and recalculate from authoritative backend
          debugPrint('⚠️ Newly placed hazard intersects active route. Recalculating safe evacuation path...');
          _startNavigation(isReroute: true);
        } else {
          debugPrint('ℹ️ Hazard update does not affect current route. Retaining current evacuation path.');
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

  Future<void> _startNavigation({bool isReroute = false}) async {
    final auth = Provider.of<AuthService>(context, listen: false);
    final locationService = Provider.of<LocationService>(context, listen: false);
    if (auth.token == null) return;

    setState(() {
      _isLoadingRoute = true;
    });

    try {
      final route = await RoutingApi.getSafePath(
        token: auth.token!,
        userLocation: locationService.currentLocation,
      );

      setState(() {
        _activeRoute = route;
        _isNavigating = true;
        _isLoadingRoute = false;
      });

      if (route.waypoints.isNotEmpty) {
        _mapController.fitCamera(
          CameraFit.coordinates(
            coordinates: route.waypoints,
            padding: const EdgeInsets.all(50),
          ),
        );
      }

      final fullZone = _zones.firstWhere(
        (z) => z.isFull,
        orElse: () => ZoneModel(zoneId: 0, name: '', type: '', polygonPoints: []),
      );

      final isRedirected = fullZone.zoneId != 0 && route.destinationName != fullZone.name;

      if (!mounted) return;

      if (isReroute) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '⚠️ EVACUATION ROUTE UPDATED: Hazard detected along previous path. Rerouting to ${route.destinationName} (${route.distanceMeters}m)',
            ),
            backgroundColor: AppTheme.warningAmber,
            duration: const Duration(seconds: 6),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              isRedirected
                  ? '⚠️ ${fullZone.name} is full (${fullZone.currentOccupancy}/${fullZone.capacity}). Redirecting to ${route.destinationName} (${route.distanceMeters}m)'
                  : '🟢 Evacuation Route calculated to ${route.destinationName} (${route.distanceMeters}m away)',
            ),
            backgroundColor: isRedirected ? AppTheme.warningAmber : AppTheme.safeEmerald,
            duration: const Duration(seconds: 6),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _isLoadingRoute = false;
      });
      debugPrint('Error calculating evacuation route: $e');
      if (mounted) {
        final errStr = e.toString();
        final isAllBlocked = errStr.contains('All accessible pathways') || errStr.contains('blocked by active hazards');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              isAllBlocked
                  ? '🚨 CRITICAL: All pathways to evacuation zones are blocked by active hazards. Please shelter in place and await instructions from SDRRM Coordinators.'
                  : '⚠️ Route calculation error: $e',
            ),
            backgroundColor: AppTheme.emergencyRose,
            duration: const Duration(seconds: 8),
          ),
        );
      }
    }
  }

  void _clearNavigation() {
    setState(() {
      _activeRoute = null;
      _isNavigating = false;
    });
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

              // Hazard Buffer Circles Layer (Authoritative Red Translucent Danger Areas)
              if (_hazards.isNotEmpty)
                CircleLayer(
                  circles: _hazards.map((hazard) {
                    return CircleMarker(
                      point: hazard.location,
                      radius: hazard.radiusMeters,
                      useRadiusInMeter: true,
                      color: AppTheme.emergencyRose.withOpacity(0.25),
                      borderColor: AppTheme.emergencyRose,
                      borderStrokeWidth: 2.0,
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
                            ? AppTheme.primaryCyan.withOpacity(0.4)
                            : AppTheme.safeEmerald.withOpacity(0.4)),
                    borderColor: isFull
                        ? AppTheme.emergencyRose
                        : (isEvacuation ? AppTheme.primaryCyan : AppTheme.safeEmerald),
                    borderStrokeWidth: 3.0,
                  );
                }).toList(),
              ),

              // Zone Capacity Labels & Badges Overlay
              MarkerLayer(
                markers: _zones.map((zone) {
                  final isFull = zone.isFull;
                  return Marker(
                    point: zone.centerPoint,
                    width: 140,
                    height: 32,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: isFull ? AppTheme.emergencyRose : AppTheme.surfaceCard.withOpacity(0.9),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isFull ? Colors.white : AppTheme.primaryCyan,
                          width: 1.5,
                        ),
                        boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 4)],
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
                  );
                }).toList(),
              ),

              // Polyline Layer for Evacuation Route Path (Glowing Cyan / Emerald Line)
              if (_activeRoute != null && _activeRoute!.waypoints.isNotEmpty) ...[
                // Outer Glow Line
                PolylineLayer(
                  polylines: [
                    Polyline(
                      points: _activeRoute!.waypoints,
                      color: AppTheme.primaryCyan.withOpacity(0.6),
                      strokeWidth: 9.0,
                    ),
                  ],
                ),
                // Inner Bright Line
                PolylineLayer(
                  polylines: [
                    Polyline(
                      points: _activeRoute!.waypoints,
                      color: AppTheme.safeEmerald,
                      strokeWidth: 4.5,
                    ),
                  ],
                ),
              ],

              // Active Hazards & Hazard Avoidance Markers Layer
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
                          child: const Icon(Icons.warning,
                              color: Colors.white, size: 22),
                        ),
                      ),
                    );
                  }),
                  if (_activeRoute != null)
                    ..._activeRoute!.hazardsToAvoid.map((hazard) {
                      return Marker(
                        point: hazard.center,
                        width: 60,
                        height: 24,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTheme.emergencyRose,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.white, width: 1.5),
                          ),
                          child: const Center(
                            child: Text(
                              'AVOID ZONE',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 8,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                        ),
                      );
                    }),
                  if (_activeRoute != null)
                    Marker(
                      point: _activeRoute!.destinationCenter,
                      width: 150,
                      height: 44,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppTheme.safeEmerald,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: Colors.white, width: 2),
                          boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 6)],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.check_circle, color: Colors.white, size: 18),
                            const SizedBox(width: 4),
                            Flexible(
                              child: Text(
                                '🟢 SAFE DESTINATION\n${_activeRoute!.destinationName}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w900,
                                ),
                                textAlign: TextAlign.center,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),

              // Current User Location Marker Layer
              MarkerLayer(
                markers: [
                  Marker(
                    point: locationService.currentLocation,
                    width: 44,
                    height: 44,
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppTheme.primaryCyan,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 3),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.primaryCyan.withOpacity(0.6),
                            blurRadius: 10,
                          )
                        ],
                      ),
                      child: const Icon(Icons.my_location,
                          color: Colors.white, size: 24),
                    ),
                  ),
                ],
              ),
            ],
          ),

          // Top Header Banner
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
                                  AppLocalizations.of(context)?.nearestSafeZone ?? 'Nearest Recommended Safe Zone:',
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
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppTheme.primaryCyan.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: AppTheme.primaryCyan.withOpacity(0.3)),
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
                          color: effectiveAlert.isDrill ? AppTheme.primaryCyan : AppTheme.emergencyRose,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: (effectiveAlert.isDrill ? AppTheme.primaryCyan : AppTheme.emergencyRose).withOpacity(0.4),
                              blurRadius: 10,
                            )
                          ],
                        ),
                        child: Row(
                          children: [
                            Icon(
                              effectiveAlert.isDrill ? Icons.directions_run : Icons.campaign,
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

          // Floating Controls Column (NAVIGATE TO SAFETY + Zoom + Layer Toggle)
          Positioned(
            right: 16,
            bottom: _isNavigating ? 140 : 92,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                // Prominent "NAVIGATE TO SAFETY" Floating Action Button
                FloatingActionButton.extended(
                  heroTag: 'navigate_safety_btn',
                  onPressed: _isLoadingRoute
                      ? null
                      : (_isNavigating ? _clearNavigation : _startNavigation),
                  backgroundColor: _isNavigating ? AppTheme.emergencyRose : AppTheme.safeEmerald,
                  icon: _isLoadingRoute
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : Icon(
                          _isNavigating ? Icons.close : Icons.navigation,
                          color: Colors.white,
                        ),
                  label: Text(
                    _isNavigating ? 'CLEAR ROUTE' : 'NAVIGATE TO SAFETY',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 12,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                const SizedBox(height: 12),

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

                // Map Layer Toggle Button (Satellite vs Street Map)
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
            ),
          ),

          // ── Bottom Controls ──
          Positioned(
            left: 16,
            right: 16,
            bottom: 24,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // 1. Navigation Guidance Card (shown when route is active)
                if (_isNavigating && _activeRoute != null) ...[
                  Card(
                    color: AppTheme.surfaceCard,
                    elevation: 16,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                      side: const BorderSide(color: AppTheme.safeEmerald, width: 2),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                      child: Row(
                        children: [
                          Container(
                            width: 40,
                            height: 40,
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppTheme.safeEmerald.withOpacity(0.2),
                              shape: BoxShape.circle,
                              border: Border.all(color: AppTheme.safeEmerald),
                            ),
                            child: const Icon(Icons.directions_walk,
                                color: AppTheme.safeEmerald, size: 22),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  'Head to: ${_activeRoute!.destinationName}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 13,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${_activeRoute!.distanceMeters}m away • ~${_activeRoute!.estimatedDurationMinutes} min walk',
                                  style: const TextStyle(
                                    color: AppTheme.primaryCyan,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.cancel, color: Colors.grey, size: 20),
                            onPressed: _clearNavigation,
                          )
                        ],
                      ),
                    ),
                  ),
                  if (effectiveAlert != null) const SizedBox(height: 8),
                ],

                // 2. "I AM SAFE — CHECK IN NOW" Button (ONLY rendered during ACTIVE EMERGENCY)
                if (effectiveAlert != null) ...[
                  SizedBox(
                    height: 52,
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isCheckingIn || _isCheckedIn
                          ? null
                          : () => _handleDirectSafeCheckin(effectiveAlert),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _isCheckedIn
                            ? AppTheme.safeEmerald.withOpacity(0.6)
                            : (effectiveAlert.isDrill ? AppTheme.primaryCyan : AppTheme.safeEmerald),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 6,
                      ),
                      child: _isCheckingIn
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                            )
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  _isCheckedIn ? Icons.check_circle : Icons.health_and_safety,
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
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showHazardDetailsBottomSheet(HazardModel hazard) {
    final photoUrl = hazard.photoUrl;
    final fullPhotoUrl = photoUrl != null
        ? (photoUrl.startsWith('http') ? photoUrl : 'http://10.0.2.2:5000$photoUrl')
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
                    child: const Icon(Icons.warning_amber_rounded, color: AppTheme.emergencyRose, size: 24),
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
                                : (hazard.severity == 'high' ? AppTheme.warningAmber : AppTheme.primaryCyan),
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
                            Icon(Icons.broken_image_outlined, color: Colors.white38, size: 36),
                            SizedBox(height: 4),
                            Text('Photo Evidence Unavailable', style: TextStyle(color: Colors.white38, fontSize: 11)),
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
                      Icon(Icons.no_photography_outlined, color: Colors.white38, size: 20),
                      SizedBox(width: 8),
                      Text('No photo evidence attached to this hazard', style: TextStyle(color: Colors.white54, fontSize: 12)),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
              ],
              Text(
                hazard.description,
                style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.4),
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }
}
