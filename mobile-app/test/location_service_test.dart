import 'package:flutter_test/flutter_test.dart';
import 'package:latlong2/latlong.dart';
import 'package:saferoute_mobile/models/zone_model.dart';
import 'package:saferoute_mobile/services/location_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('LocationService Indoor GPS Fallback Tests', () {
    test('Initializes with authoritative Polonuling NHS campus center coordinates', () {
      final service = LocationService();
      expect(service.currentLocation.latitude, closeTo(6.2882333, 0.000001));
      expect(service.currentLocation.longitude, closeTo(124.9675614, 0.000001));
      expect(service.hasRealGps, isFalse);
      expect(service.isUsingCampusFallback, isTrue);
      expect(service.realGpsLocation, isNull);
    });

    test('updateLocationForTesting updates currentLocation and retains state', () {
      final service = LocationService();
      const testPos = LatLng(6.2890000, 124.9680000);
      service.updateLocationForTesting(testPos);

      expect(service.currentLocation.latitude, closeTo(6.2890000, 0.000001));
      expect(service.currentLocation.longitude, closeTo(124.9680000, 0.000001));
    });

    test('calculateNearestZone picks the closest zone from current campus coordinates', () {
      final service = LocationService();
      // Default location is campus center: 6.2882333, 124.9675614
      final zones = [
        ZoneModel(
          zoneId: 1,
          name: 'Polonuling NHS Main Oval Evacuation Area',
          type: 'evacuation_point',
          capacity: 500,
          currentOccupancy: 10,
          polygonPoints: const [
            LatLng(6.2878, 124.9670),
            LatLng(6.2886, 124.9670),
            LatLng(6.2886, 124.9680),
            LatLng(6.2878, 124.9680),
          ],
        ),
        ZoneModel(
          zoneId: 2,
          name: 'School Gym Safe Zone',
          type: 'safe_zone',
          capacity: 200,
          currentOccupancy: 20,
          polygonPoints: const [
            LatLng(6.2890, 124.9683),
            LatLng(6.2894, 124.9683),
            LatLng(6.2894, 124.9687),
            LatLng(6.2890, 124.9687),
          ],
        ),
      ];

      final nearest = service.calculateNearestZone(zones);
      expect(nearest, isNotNull);
      expect(nearest!.zoneId, equals(1));
      expect(nearest.name, equals('Polonuling NHS Main Oval Evacuation Area'));
    });

    test('getCurrentLiveLocation gracefully falls back to campus coordinates when geolocator is unavailable in headless/indoor test mode', () async {
      final service = LocationService();
      final loc = await service.getCurrentLiveLocation(requestPermissionIfDenied: false);
      expect(loc, isNotNull);
      expect(loc!.latitude, closeTo(6.2882333, 0.000001));
      expect(loc.longitude, closeTo(124.9675614, 0.000001));
    });
  });
}
