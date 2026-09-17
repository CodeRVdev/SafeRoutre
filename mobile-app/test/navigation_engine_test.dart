import 'package:flutter_test/flutter_test.dart';
import 'package:latlong2/latlong.dart';
import 'package:saferoute_mobile/models/navigation_step_model.dart';

void main() {
  group('NavigationEngine Unit Tests', () {
    test('calculateBearing calculates accurate forward azimuth bearings', () {
      const p1 = LatLng(6.288000, 124.967000);
      const pNorth = LatLng(6.289000, 124.967000);
      const pEast = LatLng(6.288000, 124.968000);
      const pSouth = LatLng(6.287000, 124.967000);
      const pWest = LatLng(6.288000, 124.966000);

      expect(NavigationEngine.calculateBearing(p1, pNorth), closeTo(0.0, 1.0));
      expect(NavigationEngine.calculateBearing(p1, pEast), closeTo(90.0, 1.0));
      expect(NavigationEngine.calculateBearing(p1, pSouth), closeTo(180.0, 1.0));
      expect(NavigationEngine.calculateBearing(p1, pWest), closeTo(270.0, 1.0));
    });

    test('getCardinalDirection returns correct compass quadrant', () {
      expect(NavigationEngine.getCardinalDirection(0.0), 'north');
      expect(NavigationEngine.getCardinalDirection(45.0), 'northeast');
      expect(NavigationEngine.getCardinalDirection(90.0), 'east');
      expect(NavigationEngine.getCardinalDirection(135.0), 'southeast');
      expect(NavigationEngine.getCardinalDirection(180.0), 'south');
      expect(NavigationEngine.getCardinalDirection(225.0), 'southwest');
      expect(NavigationEngine.getCardinalDirection(270.0), 'west');
      expect(NavigationEngine.getCardinalDirection(315.0), 'northwest');
    });

    test('generateSteps accurately generates turn maneuvers for L-shaped campus path', () {
      // Waypoints: start at Gate, walk North, turn Right (East), arrive at Oval
      final waypoints = [
        const LatLng(6.288000, 124.967000), // wp 0
        const LatLng(6.288250, 124.967000), // wp 1 (straight north)
        const LatLng(6.288500, 124.967000), // wp 2 (corner: turns east)
        const LatLng(6.288500, 124.967300), // wp 3 (walking east)
        const LatLng(6.288500, 124.967600), // wp 4 (destination)
      ];

      final steps = NavigationEngine.generateSteps(waypoints, 'Evacuation Oval');

      expect(steps.length, 3);

      // Step 1: Head north along pathway (consolidates wp 0 to wp 2)
      expect(steps[0].maneuverType, ManeuverType.headDirection);
      expect(steps[0].instruction, contains('north'));
      expect(steps[0].distanceMeters, greaterThan(50));

      // Step 2: Turn right
      expect(steps[1].maneuverType, ManeuverType.turnRight);
      expect(steps[1].instruction, 'Turn right');
      expect(steps[1].distanceMeters, greaterThan(60));

      // Step 3: Arrive at destination
      expect(steps[2].maneuverType, ManeuverType.arrive);
      expect(steps[2].instruction, 'Arrive at Evacuation Oval');
    });

    test('generateSteps does not generate spurious turns for straight pathway coordinates', () {
      // 5 points along a nearly straight line with slight GPS jitter (< 10 degrees)
      final waypoints = [
        const LatLng(6.288000, 124.967000),
        const LatLng(6.288100, 124.967005),
        const LatLng(6.288200, 124.967008),
        const LatLng(6.288300, 124.967010),
        const LatLng(6.288400, 124.967012),
      ];

      final steps = NavigationEngine.generateSteps(waypoints, 'Covered Court');

      // Should only have initial "Head north" and final "Arrive", NO spurious turns
      expect(steps.length, 2);
      expect(steps[0].maneuverType, ManeuverType.headDirection);
      expect(steps[1].maneuverType, ManeuverType.arrive);
    });

    test('updateProgress detects arrival when user is <= 10m from destination', () {
      const dest = LatLng(6.288500, 124.967600);
      const userNear = LatLng(6.288500, 124.967640); // ~4.4m away

      final waypoints = [
        const LatLng(6.288000, 124.967000),
        dest,
      ];
      final steps = NavigationEngine.generateSteps(waypoints, 'Evacuation Oval');

      final progress = NavigationEngine.updateProgress(
        userPos: userNear,
        waypoints: waypoints,
        steps: steps,
        currentStepIndex: 0,
        destinationName: 'Evacuation Oval',
      );

      expect(progress.isArrived, true);
    });

    test('updateProgress detects off-route deviation when user is > 25m from path', () {
      final waypoints = [
        const LatLng(6.288000, 124.967000),
        const LatLng(6.288500, 124.967000),
      ];
      final steps = NavigationEngine.generateSteps(waypoints, 'Evacuation Oval');

      // User is ~55m East of line (longitude 124.967500 vs 124.967000)
      const userOffRoute = LatLng(6.288250, 124.967500);

      final progress = NavigationEngine.updateProgress(
        userPos: userOffRoute,
        waypoints: waypoints,
        steps: steps,
        currentStepIndex: 0,
        destinationName: 'Evacuation Oval',
      );

      expect(progress.isOffRoute, true);
    });

    test('formatDistance formats meters and kilometers accurately', () {
      expect(NavigationEngine.formatDistance(12.3), '12 m');
      expect(NavigationEngine.formatDistance(950), '950 m');
      expect(NavigationEngine.formatDistance(1250), '1.3 km');
      expect(NavigationEngine.formatDistance(2000), '2.0 km');
    });
  });
}
