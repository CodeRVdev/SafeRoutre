import 'package:latlong2/latlong.dart';

class HazardAvoidanceModel {
  final int hazardId;
  final String type;
  final String severity;
  final double radiusMeters;
  final LatLng center;

  HazardAvoidanceModel({
    required this.hazardId,
    required this.type,
    required this.severity,
    required this.radiusMeters,
    required this.center,
  });

  factory HazardAvoidanceModel.fromJson(Map<String, dynamic> json) {
    LatLng center = const LatLng(6.2882333, 124.9675614);
    if (json['center'] is List && (json['center'] as List).length >= 2) {
      final centerArr = json['center'] as List;
      center = LatLng(
        (centerArr[0] as num).toDouble(),
        (centerArr[1] as num).toDouble(),
      );
    } else if (json['lat'] != null && json['lng'] != null) {
      center = LatLng(
        (json['lat'] as num).toDouble(),
        (json['lng'] as num).toDouble(),
      );
    }

    final sev = json['severity']?.toString().toLowerCase();
    double defaultRadius = 20.0;
    if (sev == 'critical') {
      defaultRadius = 30.0;
    } else if (sev == 'high') {
      defaultRadius = 25.0;
    } else if (sev == 'moderate') {
      defaultRadius = 20.0;
    } else if (sev == 'low') {
      defaultRadius = 15.0;
    }

    return HazardAvoidanceModel(
      hazardId: (json['hazard_id'] as num?)?.toInt() ?? 0,
      type: json['type']?.toString() ?? 'Hazard',
      severity: json['severity']?.toString() ?? 'high',
      radiusMeters: (json['radius_meters'] as num?)?.toDouble() ?? defaultRadius,
      center: center,
    );
  }
}

class RouteGuidanceModel {
  final String destinationName;
  final String destinationType;
  final LatLng destinationCenter;
  final int distanceMeters;
  final int estimatedDurationMinutes;
  final List<LatLng> waypoints;
  final List<HazardAvoidanceModel> hazardsToAvoid;
  final bool isHazardRerouted;
  final int hazardsAvoidedCount;
  final String status;

  RouteGuidanceModel({
    required this.destinationName,
    required this.destinationType,
    required this.destinationCenter,
    required this.distanceMeters,
    required this.estimatedDurationMinutes,
    required this.waypoints,
    required this.hazardsToAvoid,
    this.isHazardRerouted = false,
    this.hazardsAvoidedCount = 0,
    this.status = 'recommended',
  });

  factory RouteGuidanceModel.fromJson(Map<String, dynamic> rawJson) {
    // 1. Support payload at root or inside "data"
    final Map<String, dynamic> json = (rawJson['data'] is Map)
        ? Map<String, dynamic>.from(rawJson['data'] as Map)
        : rawJson;

    // 2. Locate route object (either under "route" or if json itself is the route object)
    final routeObj = (json['route'] is Map)
        ? Map<String, dynamic>.from(json['route'] as Map)
        : (json['geometry'] != null ? json : null);

    final destObj = routeObj?['destination'] is Map
        ? Map<String, dynamic>.from(routeObj!['destination'] as Map)
        : null;
    final legacyDest = json['destination_zone'] is Map
        ? Map<String, dynamic>.from(json['destination_zone'] as Map)
        : <String, dynamic>{};

    String destName = destObj?['name']?.toString() ??
        legacyDest['name']?.toString() ??
        'Evacuation Zone';
    String destType = destObj?['type']?.toString() ??
        legacyDest['type']?.toString() ??
        'evacuation_point';

    // GeoJSON center in route.destination is [lng, lat]
    // Legacy center in destination_zone is [lat, lng]
    LatLng destCenter = const LatLng(6.2882333, 124.9675614);
    if (destObj?['center'] is List && (destObj!['center'] as List).length >= 2) {
      final arr = destObj['center'] as List;
      destCenter = LatLng((arr[1] as num).toDouble(), (arr[0] as num).toDouble());
    } else if (legacyDest['center'] is List && (legacyDest['center'] as List).length >= 2) {
      final arr = legacyDest['center'] as List;
      destCenter = LatLng((arr[0] as num).toDouble(), (arr[1] as num).toDouble());
    }

    // 3. Parse waypoints: prefer route.geometry.coordinates GeoJSON [[lng, lat], ...]
    // Fallback to legacy route_waypoints [[lat, lng], ...]
    List<LatLng> waypointsList = [];
    final geom = routeObj?['geometry'] is Map
        ? Map<String, dynamic>.from(routeObj!['geometry'] as Map)
        : null;

    if (geom != null && geom['coordinates'] is List) {
      final coordsList = geom['coordinates'] as List;
      for (final pt in coordsList) {
        if (pt is List && pt.length >= 2) {
          waypointsList.add(LatLng(
            (pt[1] as num).toDouble(), // latitude
            (pt[0] as num).toDouble(), // longitude
          ));
        }
      }
    } else if (json['route_waypoints'] is List) {
      final waypointsRaw = json['route_waypoints'] as List;
      for (final pt in waypointsRaw) {
        if (pt is List && pt.length >= 2) {
          waypointsList.add(LatLng(
            (pt[0] as num).toDouble(), // latitude
            (pt[1] as num).toDouble(), // longitude
          ));
        }
      }
    }

    // 4. Parse hazards to avoid (legacy or modern)
    final hazardsRaw = (json['hazards_to_avoid'] as List<dynamic>?) ??
        (routeObj?['hazardsAvoided'] as List<dynamic>?) ??
        [];
    final hazardsList = <HazardAvoidanceModel>[];
    for (final h in hazardsRaw) {
      if (h is Map) {
        hazardsList.add(HazardAvoidanceModel.fromJson(Map<String, dynamic>.from(h)));
      }
    }

    final distanceMeters = (routeObj?['distanceMeters'] as num?)?.toInt() ??
        (json['distance_meters'] as num?)?.toInt() ??
        0;

    final estimatedDurationMinutes = (routeObj?['estimatedWalkingMinutes'] as num?)?.toInt() ??
        (json['estimated_duration_minutes'] as num?)?.toInt() ??
        1;

    final isHazardRerouted = routeObj?['isHazardRerouted'] == true;
    final hazardsAvoidedCount = (routeObj?['hazardsAvoidedCount'] as num?)?.toInt() ??
        hazardsList.length;
    final status = routeObj?['status']?.toString() ?? 'recommended';

    return RouteGuidanceModel(
      destinationName: destName,
      destinationType: destType,
      destinationCenter: destCenter,
      distanceMeters: distanceMeters,
      estimatedDurationMinutes: estimatedDurationMinutes,
      waypoints: waypointsList,
      hazardsToAvoid: hazardsList,
      isHazardRerouted: isHazardRerouted,
      hazardsAvoidedCount: hazardsAvoidedCount,
      status: status,
    );
  }
}
