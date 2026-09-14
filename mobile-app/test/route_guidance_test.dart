import 'package:flutter_test/flutter_test.dart';
import 'package:saferoute_mobile/models/route_guidance_model.dart';

void main() {
  group('RouteGuidanceModel Parser Tests', () {
    test('parses actual backend response format (top-level route, no data wrapper)', () {
      final backendResponse = <String, dynamic>{
        'success': true,
        'route': {
          'geometry': {
            'type': 'LineString',
            'coordinates': [
              [124.9675614, 6.2882333],
              [124.9675800, 6.2882500],
            ],
          },
          'distanceMeters': 1,
          'estimatedWalkingMinutes': 1,
          'estimatedSeconds': 1,
          'origin': {
            'id': 'gate_1',
            'name': 'Main Gate (Gate 1)',
            'type': 'gate',
            'coordinates': [124.9675614, 6.2882333],
          },
          'destination': {
            'id': 'oval',
            'name': 'School Oval (Main Evacuation Area)',
            'type': 'evacuation_zone',
            'center': [124.9675614, 6.2882333],
          },
          'isHazardRerouted': false,
          'hazardsAvoided': [],
          'hazardsAvoidedCount': 0,
          'pathNodes': [
            {
              'id': 'gate_1',
              'name': 'Main Gate (Gate 1)',
              'type': 'gate',
              'lat': 6.2882333,
              'lng': 124.9675614,
            }
          ],
          'status': 'recommended',
        },
        'destination_zone': {
          'zone_id': 1,
          'name': 'School Oval (Main Evacuation Area)',
          'type': 'evacuation_point',
          'center': [6.2882333, 124.9675614],
        },
        'distance_meters': 1,
        'estimated_duration_minutes': 1,
        'route_waypoints': [
          [6.2882333, 124.9675614],
          [6.2882500, 124.9675800],
        ],
        'hazards_to_avoid': [],
      };

      final model = RouteGuidanceModel.fromJson(backendResponse);

      expect(model.destinationName, 'School Oval (Main Evacuation Area)');
      expect(model.distanceMeters, 1);
      expect(model.estimatedDurationMinutes, 1);
      expect(model.isHazardRerouted, false);
      expect(model.status, 'recommended');

      // GeoJSON coordinates [[lng, lat]] should be parsed into LatLng(lat, lng)
      expect(model.waypoints.length, 2);
      expect(model.waypoints[0].latitude, closeTo(6.2882333, 0.0000001));
      expect(model.waypoints[0].longitude, closeTo(124.9675614, 0.0000001));
      expect(model.waypoints[1].latitude, closeTo(6.2882500, 0.0000001));
      expect(model.waypoints[1].longitude, closeTo(124.9675800, 0.0000001));

      // Destination center GeoJSON [lng, lat] to LatLng(lat, lng)
      expect(model.destinationCenter.latitude, closeTo(6.2882333, 0.0000001));
      expect(model.destinationCenter.longitude, closeTo(124.9675614, 0.0000001));
    });

    test('parses wrapped response (nested under data field)', () {
      final wrappedResponse = <String, dynamic>{
        'success': true,
        'data': {
          'route': {
            'geometry': {
              'type': 'LineString',
              'coordinates': [
                [124.9675614, 6.2882333],
              ],
            },
            'distanceMeters': 45,
            'estimatedWalkingMinutes': 2,
            'destination': {
              'name': 'Covered Court',
              'type': 'evacuation_point',
              'center': [124.9675614, 6.2882333],
            },
            'isHazardRerouted': true,
            'hazardsAvoidedCount': 1,
            'status': 'safest_hazard_aware',
          },
        },
      };

      final model = RouteGuidanceModel.fromJson(wrappedResponse);
      expect(model.destinationName, 'Covered Court');
      expect(model.distanceMeters, 45);
      expect(model.estimatedDurationMinutes, 2);
      expect(model.isHazardRerouted, true);
      expect(model.hazardsAvoidedCount, 1);
      expect(model.status, 'safest_hazard_aware');
      expect(model.waypoints.length, 1);
    });

    test('parses legacy response format (fallback to route_waypoints and destination_zone)', () {
      final legacyResponse = <String, dynamic>{
        'success': true,
        'destination_zone': {
          'zone_id': 1,
          'name': 'Legacy Zone',
          'type': 'evacuation_point',
          'center': [6.2882333, 124.9675614], // [lat, lng]
        },
        'distance_meters': 80,
        'estimated_duration_minutes': 3,
        'route_waypoints': [
          [6.2882333, 124.9675614], // [lat, lng]
          [6.2883000, 124.9676000],
        ],
        'hazards_to_avoid': [
          {
            'hazard_id': 10,
            'type': 'fire',
            'severity': 'critical',
            'radius_meters': 30.0,
            'center': [6.2882500, 124.9675800],
          }
        ],
      };

      final model = RouteGuidanceModel.fromJson(legacyResponse);
      expect(model.destinationName, 'Legacy Zone');
      expect(model.distanceMeters, 80);
      expect(model.estimatedDurationMinutes, 3);
      expect(model.waypoints.length, 2);
      expect(model.waypoints[0].latitude, closeTo(6.2882333, 0.0000001));
      expect(model.waypoints[0].longitude, closeTo(124.9675614, 0.0000001));
      expect(model.hazardsToAvoid.length, 1);
      expect(model.hazardsToAvoid[0].hazardId, 10);
      expect(model.hazardsToAvoid[0].type, 'fire');
      expect(model.hazardsToAvoid[0].severity, 'critical');
      expect(model.hazardsToAvoid[0].radiusMeters, 30.0);
    });

    test('handles hazard items with lat/lng instead of center array', () {
      final hazardJson = {
        'hazard_id': 42,
        'type': 'fallen_tree',
        'severity': 'moderate',
        'radius_meters': 20,
        'lat': 6.2881000,
        'lng': 124.9672000,
      };

      final hazard = HazardAvoidanceModel.fromJson(hazardJson);
      expect(hazard.hazardId, 42);
      expect(hazard.type, 'fallen_tree');
      expect(hazard.severity, 'moderate');
      expect(hazard.radiusMeters, 20.0);
      expect(hazard.center.latitude, closeTo(6.2881000, 0.0000001));
      expect(hazard.center.longitude, closeTo(124.9672000, 0.0000001));
    });
  });
}
