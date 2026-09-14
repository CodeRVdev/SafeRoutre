import 'package:latlong2/latlong.dart';

class ZoneModel {
  final int zoneId;
  final String name;
  final String type; // 'safe_zone' | 'evacuation_point'
  final List<LatLng> polygonPoints;
  final int capacity;
  final int currentOccupancy;
  final int? createdBy;
  final String? createdAt;

  ZoneModel({
    required this.zoneId,
    required this.name,
    required this.type,
    required this.polygonPoints,
    this.capacity = 100,
    this.currentOccupancy = 0,
    this.createdBy,
    this.createdAt,
  });

  bool get isFull => currentOccupancy >= capacity;

  factory ZoneModel.fromFeatureJson(Map<String, dynamic> json) {
    final props = json['properties'] ?? {};
    final geom = json['geometry'] ?? {};
    final coords = (geom['coordinates'] as List? ?? [[]])[0] as List? ?? [];

    List<LatLng> points = [];
    for (var pair in coords) {
      if (pair is List && pair.length >= 2) {
        final lng = (pair[0] as num).toDouble();
        final lat = (pair[1] as num).toDouble();
        points.add(LatLng(lat, lng));
      }
    }

    return ZoneModel(
      zoneId: props['zone_id'] is int ? props['zone_id'] : int.parse(props['zone_id'].toString()),
      name: props['name'] ?? 'Campus Zone',
      type: props['type'] ?? 'evacuation_point',
      polygonPoints: points,
      capacity: props['capacity'] is int ? props['capacity'] : (int.tryParse(props['capacity']?.toString() ?? '100') ?? 100),
      currentOccupancy: props['current_occupancy'] is int ? props['current_occupancy'] : (int.tryParse(props['current_occupancy']?.toString() ?? '0') ?? 0),
      createdBy: props['created_by'],
      createdAt: props['created_at'],
    );
  }

  /// Calculates center point centroid of polygon for distance calculations
  LatLng get centerPoint {
    if (polygonPoints.isEmpty) return const LatLng(6.3615, 124.9502);
    double sumLat = 0;
    double sumLng = 0;
    for (var p in polygonPoints) {
      sumLat += p.latitude;
      sumLng += p.longitude;
    }
    return LatLng(sumLat / polygonPoints.length, sumLng / polygonPoints.length);
  }
}
