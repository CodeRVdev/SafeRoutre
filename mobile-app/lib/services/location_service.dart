import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import '../models/zone_model.dart';

class LocationService extends ChangeNotifier {
  // Authoritative reference coordinate for Polonuling National High School
  LatLng _currentLocation = const LatLng(6.2882333, 124.9675614);
  bool _hasPermission = false;
  ZoneModel? _nearestZone;
  StreamSubscription<Position>? _positionStreamSub;

  LatLng get currentLocation => _currentLocation;
  bool get hasPermission => _hasPermission;
  ZoneModel? get nearestZone => _nearestZone;

  LocationService() {
    initLocation();
  }

  Future<void> initLocation() async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.whileInUse ||
          permission == LocationPermission.always) {
        _hasPermission = true;
        Position pos = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
        );
        _currentLocation = LatLng(pos.latitude, pos.longitude);
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Location service init info: $e');
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

