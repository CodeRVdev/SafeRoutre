import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import '../constants/campus_constants.dart';
import '../models/zone_model.dart';

class LocationService extends ChangeNotifier {
  // Authoritative reference coordinate for Polonuling National High School campus center
  static const LatLng campusDefaultLocation = CampusConstants.campusCenter;
  LatLng _currentLocation = campusDefaultLocation;
  bool _hasPermission = false;
  bool _hasRealGps = false;
  ZoneModel? _nearestZone;
  StreamSubscription<Position>? _positionStreamSub;

  LatLng get currentLocation => _currentLocation;
  bool get hasPermission => _hasPermission;
  bool get hasRealGps => _hasRealGps;
  bool get isUsingCampusFallback => !_hasRealGps;
  LatLng? get realGpsLocation => _hasRealGps ? _currentLocation : null;
  ZoneModel? get nearestZone => _nearestZone;

  LocationService() {
    initLocation();
  }

  Future<void> initLocation() async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return;

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.whileInUse ||
          permission == LocationPermission.always) {
        _hasPermission = true;
        Position pos = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            timeLimit: Duration(seconds: 4),
          ),
        );
        _currentLocation = LatLng(pos.latitude, pos.longitude);
        _hasRealGps = true;
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Location service init info: $e');
    }
  }

  /// Explicitly captures current device GPS position at the moment of emergency submission (check-in or SOS).
  /// Attempts high-accuracy GPS with a 4-second timeout (3–5s threshold).
  /// If GPS is unavailable, disabled, permission is denied, or times out indoors,
  /// it automatically falls back to a valid campus reference coordinate (Polonuling National High School)
  /// instead of sending null, ensuring demo and defense presentation reliability.
  Future<LatLng?> getCurrentLiveLocation({
    bool requestPermissionIfDenied = true,
    bool fallbackToCampusIfUnavailable = true,
  }) async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        debugPrint('⚠️ Location services (GPS) are disabled on device.');
        if (fallbackToCampusIfUnavailable) {
          debugPrint('📍 Campus Simulation Fallback: Using Polonuling NHS campus coordinates for demo/indoor reliability.');
          return _currentLocation;
        }
        return null;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied && requestPermissionIfDenied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        _hasPermission = false;
        notifyListeners();
        debugPrint('⚠️ Location permission denied.');
        if (fallbackToCampusIfUnavailable) {
          debugPrint('📍 Campus Simulation Fallback: Permission denied; using Polonuling NHS campus coordinates.');
          return _currentLocation;
        }
        return null;
      }

      _hasPermission = true;

      // 1. Try to get current high-accuracy position with 4s timeout (3-5s requirement)
      Position? pos;
      try {
        pos = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            timeLimit: Duration(seconds: 4),
          ),
        );
      } catch (e) {
        debugPrint('Note: High-accuracy position timeout indoors, trying last known position: $e');
      }

      // 2. Fallback to last known position if current timed out
      if (pos == null) {
        try {
          pos = await Geolocator.getLastKnownPosition();
        } catch (_) {}
      }

      if (pos != null) {
        _currentLocation = LatLng(pos.latitude, pos.longitude);
        _hasRealGps = true;
        notifyListeners();
        return _currentLocation;
      }

      if (fallbackToCampusIfUnavailable) {
        debugPrint('📍 Campus Simulation Fallback: GPS timed out indoors; using Polonuling NHS campus coordinates: $_currentLocation');
        return _currentLocation;
      }

      return null;
    } catch (e) {
      debugPrint('Error getting live GPS position: $e');
      if (fallbackToCampusIfUnavailable) {
        debugPrint('📍 Campus Simulation Fallback: GPS error; using Polonuling NHS campus coordinates: $_currentLocation');
        return _currentLocation;
      }
      return null;
    }
  }

  /// Starts listening to continuous live GPS position updates
  void startLocationStream({Function(LatLng)? onLocationChanged}) {
    _positionStreamSub?.cancel();
    try {
      _positionStreamSub = Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 2, // notify every 2 meters
        ),
      ).listen(
        (Position pos) {
          _currentLocation = LatLng(pos.latitude, pos.longitude);
          notifyListeners();
          onLocationChanged?.call(_currentLocation);
        },
        onError: (err) {
          debugPrint('Location stream error: $err');
        },
      );
    } catch (e) {
      debugPrint('Unable to start location stream: $e');
    }
  }

  /// Stops listening to live GPS updates
  void stopLocationStream() {
    _positionStreamSub?.cancel();
    _positionStreamSub = null;
  }

  /// Programmatically set location for deterministic route simulation or testing
  void updateLocationForTesting(LatLng pos) {
    _currentLocation = pos;
    notifyListeners();
  }

  /// Calculates the nearest evacuation zone / safe zone from current user position, preferring available zones
  ZoneModel? calculateNearestZone(List<ZoneModel> zones) {
    if (zones.isEmpty) return null;

    const distance = Distance();

    // Prefer zones that are not at full capacity
    final availableZones = zones.where((z) => !z.isFull).toList();
    final candidates = availableZones.isNotEmpty ? availableZones : zones;

    ZoneModel? closest;
    double minMeters = double.infinity;

    for (var zone in candidates) {
      final center = zone.centerPoint;
      final meters = distance(
        LatLng(_currentLocation.latitude, _currentLocation.longitude),
        LatLng(center.latitude, center.longitude),
      );

      if (meters < minMeters) {
        minMeters = meters;
        closest = zone;
      }
    }

    _nearestZone = closest;
    return closest;
  }

  @override
  void dispose() {
    _positionStreamSub?.cancel();
    super.dispose();
  }
}

