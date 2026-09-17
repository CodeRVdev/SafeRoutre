import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';

/// Maneuver classifications for turn-by-turn evacuation navigation
enum ManeuverType {
  headDirection,
  continueStraight,
  slightRight,
  turnRight,
  sharpRight,
  slightLeft,
  turnLeft,
  sharpLeft,
  uTurn,
  arrive,
}

/// A discrete navigation step along the evacuation route
class NavigationStep {
  final ManeuverType maneuverType;
  final String instruction;
  final double distanceMeters;
  final LatLng targetLocation;
  final int waypointIndex;

  const NavigationStep({
    required this.maneuverType,
    required this.instruction,
    required this.distanceMeters,
    required this.targetLocation,
    required this.waypointIndex,
  });

  IconData get icon {
    switch (maneuverType) {
      case ManeuverType.headDirection:
      case ManeuverType.continueStraight:
        return Icons.arrow_upward_rounded;
      case ManeuverType.slightRight:
        return Icons.turn_slight_right_rounded;
      case ManeuverType.turnRight:
        return Icons.turn_right_rounded;
      case ManeuverType.sharpRight:
        return Icons.turn_sharp_right_rounded;
      case ManeuverType.slightLeft:
        return Icons.turn_slight_left_rounded;
      case ManeuverType.turnLeft:
        return Icons.turn_left_rounded;
      case ManeuverType.sharpLeft:
        return Icons.turn_sharp_left_rounded;
      case ManeuverType.uTurn:
        return Icons.u_turn_left_rounded;
      case ManeuverType.arrive:
        return Icons.location_on_rounded;
    }
  }

  String get shortAction {
    switch (maneuverType) {
      case ManeuverType.headDirection:
        return 'Head';
      case ManeuverType.continueStraight:
        return 'Continue';
      case ManeuverType.slightRight:
        return 'Slight Right';
      case ManeuverType.turnRight:
        return 'Turn Right';
      case ManeuverType.sharpRight:
        return 'Sharp Right';
      case ManeuverType.slightLeft:
        return 'Slight Left';
      case ManeuverType.turnLeft:
        return 'Turn Left';
      case ManeuverType.sharpLeft:
        return 'Sharp Left';
      case ManeuverType.uTurn:
        return 'U-Turn';
      case ManeuverType.arrive:
        return 'Arrive';
    }
  }
}

/// Encapsulates live navigation progression state
class NavigationProgress {
  final int currentStepIndex;
  final NavigationStep currentStep;
  final NavigationStep? nextStep;
  final double distanceToNextManeuver;
  final double remainingDistanceMeters;
  final int remainingDurationMinutes;
  final bool isApproachingTurn; // <= 12m
  final bool isTurnNow; // <= 5m
  final bool isArrived; // <= 10m to destination
  final bool isOffRoute; // > 25m from route line

  const NavigationProgress({
    required this.currentStepIndex,
    required this.currentStep,
    this.nextStep,
    required this.distanceToNextManeuver,
    required this.remainingDistanceMeters,
    required this.remainingDurationMinutes,
    required this.isApproachingTurn,
    required this.isTurnNow,
    required this.isArrived,
    required this.isOffRoute,
  });
}

/// Navigation engine for maneuver detection, progress tracking, and geometry projection
class NavigationEngine {
  static const Distance _distCalc = Distance();
  static const double _walkingMetersPerMin = 72.0; // ~1.2 m/s average brisk evacuation walk

  /// Computes forward spherical azimuth bearing in degrees (0..360) from start to end
  static double calculateBearing(LatLng start, LatLng end) {
    final double lat1 = start.latitude * (math.pi / 180.0);
    final double lon1 = start.longitude * (math.pi / 180.0);
    final double lat2 = end.latitude * (math.pi / 180.0);
    final double lon2 = end.longitude * (math.pi / 180.0);

    final double dLon = lon2 - lon1;
    final double y = math.sin(dLon) * math.cos(lat2);
    final double x = math.cos(lat1) * math.sin(lat2) -
        math.sin(lat1) * math.cos(lat2) * math.cos(dLon);

    double bearing = math.atan2(y, x) * (180.0 / math.pi);
    return (bearing + 360.0) % 360.0;
  }

  /// Returns cardinal direction from bearing
  static String getCardinalDirection(double bearing) {
    if (bearing >= 337.5 || bearing < 22.5) return 'north';
    if (bearing >= 22.5 && bearing < 67.5) return 'northeast';
    if (bearing >= 67.5 && bearing < 112.5) return 'east';
    if (bearing >= 112.5 && bearing < 157.5) return 'southeast';
    if (bearing >= 157.5 && bearing < 202.5) return 'south';
    if (bearing >= 202.5 && bearing < 247.5) return 'southwest';
    if (bearing >= 247.5 && bearing < 292.5) return 'west';
    return 'northwest';
  }

  /// Generates meaningful turn-by-turn steps from backend pathway waypoints
  static List<NavigationStep> generateSteps(
    List<LatLng> waypoints,
    String destinationName,
  ) {
    if (waypoints.isEmpty) {
      return [
        NavigationStep(
          maneuverType: ManeuverType.arrive,
          instruction: 'Arrive at $destinationName',
          distanceMeters: 0,
          targetLocation: const LatLng(6.2882333, 124.9675614),
          waypointIndex: 0,
        )
      ];
    }

    if (waypoints.length == 1) {
      return [
        NavigationStep(
          maneuverType: ManeuverType.arrive,
          instruction: 'Arrive at $destinationName',
          distanceMeters: 0,
          targetLocation: waypoints.first,
          waypointIndex: 0,
        )
      ];
    }

    final List<NavigationStep> steps = [];
    double accumulatedDistance = 0.0;
    double currentBearing = calculateBearing(waypoints[0], waypoints[1]);

    // Initial step: Head [cardinal]
    final String cardinal = getCardinalDirection(currentBearing);
    accumulatedDistance += _distCalc.as(LengthUnit.Meter, waypoints[0], waypoints[1]);

    ManeuverType currentManeuver = ManeuverType.headDirection;
    String currentInstruction = 'Head $cardinal along pathway';

    for (int i = 1; i < waypoints.length - 1; i++) {
      final double legDist = _distCalc.as(LengthUnit.Meter, waypoints[i], waypoints[i + 1]);
      final double nextBearing = calculateBearing(waypoints[i], waypoints[i + 1]);

      double delta = nextBearing - currentBearing;
      while (delta > 180.0) {
        delta -= 360.0;
      }
      while (delta < -180.0) {
        delta += 360.0;
      }

      // Angular threshold: turns within +/- 25 degrees are considered straight
      if (delta.abs() < 25.0) {
        accumulatedDistance += legDist;
        currentBearing = nextBearing;
      } else {
        // Record current step
        steps.add(NavigationStep(
          maneuverType: currentManeuver,
          instruction: currentInstruction,
          distanceMeters: accumulatedDistance,
          targetLocation: waypoints[i],
          waypointIndex: i,
        ));

        // Determine new maneuver
        ManeuverType newManeuver;
        String newInstruction;

        if (delta >= 25.0 && delta < 50.0) {
          newManeuver = ManeuverType.slightRight;
          newInstruction = 'Turn slight right';
        } else if (delta >= 50.0 && delta < 135.0) {
          newManeuver = ManeuverType.turnRight;
          newInstruction = 'Turn right';
        } else if (delta >= 135.0 && delta <= 170.0) {
          newManeuver = ManeuverType.sharpRight;
          newInstruction = 'Turn sharp right';
        } else if (delta > 170.0 || delta < -170.0) {
          newManeuver = ManeuverType.uTurn;
          newInstruction = 'Make a U-turn';
        } else if (delta <= -25.0 && delta > -50.0) {
          newManeuver = ManeuverType.slightLeft;
          newInstruction = 'Turn slight left';
        } else if (delta <= -50.0 && delta > -135.0) {
          newManeuver = ManeuverType.turnLeft;
          newInstruction = 'Turn left';
        } else {
          newManeuver = ManeuverType.sharpLeft;
          newInstruction = 'Turn sharp left';
        }

        currentManeuver = newManeuver;
        currentInstruction = newInstruction;
        accumulatedDistance = legDist;
        currentBearing = nextBearing;
      }
    }

    // Add final route segment before arrival
    if (accumulatedDistance > 0 || steps.isEmpty) {
      steps.add(NavigationStep(
        maneuverType: currentManeuver,
        instruction: currentInstruction,
        distanceMeters: accumulatedDistance,
        targetLocation: waypoints.last,
        waypointIndex: waypoints.length - 1,
      ));
    }

    // Final step: Arrive at destination
    steps.add(NavigationStep(
      maneuverType: ManeuverType.arrive,
      instruction: 'Arrive at $destinationName',
      distanceMeters: 0,
      targetLocation: waypoints.last,
      waypointIndex: waypoints.length - 1,
    ));

    return steps;
  }

  /// Updates navigation progress along route
  static NavigationProgress updateProgress({
    required LatLng userPos,
    required List<LatLng> waypoints,
    required List<NavigationStep> steps,
    required int currentStepIndex,
    required String destinationName,
  }) {
    if (steps.isEmpty || waypoints.isEmpty) {
      final arrivalStep = NavigationStep(
        maneuverType: ManeuverType.arrive,
        instruction: 'Arrive at $destinationName',
        distanceMeters: 0,
        targetLocation: userPos,
        waypointIndex: 0,
      );
      return NavigationProgress(
        currentStepIndex: 0,
        currentStep: arrivalStep,
        distanceToNextManeuver: 0,
        remainingDistanceMeters: 0,
        remainingDurationMinutes: 0,
        isApproachingTurn: false,
        isTurnNow: false,
        isArrived: true,
        isOffRoute: false,
      );
    }

    // 1. Check distance to final destination
    final LatLng dest = waypoints.last;
    final double distToDest = _distCalc.as(LengthUnit.Meter, userPos, dest);
    if (distToDest <= 10.0) {
      final arrivalStep = steps.last;
      return NavigationProgress(
        currentStepIndex: steps.length - 1,
        currentStep: arrivalStep,
        distanceToNextManeuver: 0,
        remainingDistanceMeters: 0,
        remainingDurationMinutes: 0,
        isApproachingTurn: false,
        isTurnNow: false,
        isArrived: true,
        isOffRoute: false,
      );
    }

    // 2. Calculate minimum perpendicular distance from user to route polyline
    double minPerpDist = double.infinity;
    int closestSegIdx = 0;

    for (int i = 0; i < waypoints.length - 1; i++) {
      final d = _distanceToSegment(userPos, waypoints[i], waypoints[i + 1]);
      if (d < minPerpDist) {
        minPerpDist = d;
        closestSegIdx = i;
      }
    }

    // Off-route tolerance: 25 meters
    final bool isOffRoute = minPerpDist > 25.0;

    // 3. Determine active step based on closest segment index
    int activeStepIdx = currentStepIndex;
    while (activeStepIdx < steps.length - 1 &&
        closestSegIdx >= steps[activeStepIdx].waypointIndex) {
      activeStepIdx++;
    }
    if (activeStepIdx >= steps.length) {
      activeStepIdx = steps.length - 1;
    }

    final NavigationStep currentStep = steps[activeStepIdx];
    final NavigationStep? nextStep =
        (activeStepIdx + 1 < steps.length) ? steps[activeStepIdx + 1] : null;

    // 4. Distance to next maneuver
    final double distToManeuver =
        _distCalc.as(LengthUnit.Meter, userPos, currentStep.targetLocation);

    // 5. Total remaining distance from user along remaining segments to destination
    double remDist = _distCalc.as(
      LengthUnit.Meter,
      userPos,
      waypoints[math.min(closestSegIdx + 1, waypoints.length - 1)],
    );
    for (int i = closestSegIdx + 1; i < waypoints.length - 1; i++) {
      remDist += _distCalc.as(LengthUnit.Meter, waypoints[i], waypoints[i + 1]);
    }

    final int remMinutes = math.max(1, (remDist / _walkingMetersPerMin).ceil());

    return NavigationProgress(
      currentStepIndex: activeStepIdx,
      currentStep: currentStep,
      nextStep: nextStep,
      distanceToNextManeuver: distToManeuver,
      remainingDistanceMeters: remDist,
      remainingDurationMinutes: remMinutes,
      isApproachingTurn: distToManeuver <= 14.0 && distToManeuver > 5.0,
      isTurnNow: distToManeuver <= 5.0,
      isArrived: distToDest <= 10.0,
      isOffRoute: isOffRoute,
    );
  }

  /// Calculates perpendicular distance from point P to line segment AB in meters
  static double _distanceToSegment(LatLng p, LatLng a, LatLng b) {
    final double l2 = (b.latitude - a.latitude) * (b.latitude - a.latitude) +
        (b.longitude - a.longitude) * (b.longitude - a.longitude);
    if (l2 == 0) return _distCalc.as(LengthUnit.Meter, p, a);

    double t = ((p.latitude - a.latitude) * (b.latitude - a.latitude) +
            (p.longitude - a.longitude) * (b.longitude - a.longitude)) /
        l2;
    t = t.clamp(0.0, 1.0);

    final LatLng proj = LatLng(
      a.latitude + t * (b.latitude - a.latitude),
      a.longitude + t * (b.longitude - a.longitude),
    );
    return _distCalc.as(LengthUnit.Meter, p, proj);
  }

  /// Formats meters into human-readable string (e.g., "23 m" or "1.2 km")
  static String formatDistance(double meters) {
    if (meters < 1000) {
      return '${meters.round()} m';
    }
    return '${(meters / 1000).toStringAsFixed(1)} km';
  }
}
