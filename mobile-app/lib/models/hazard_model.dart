import 'package:latlong2/latlong.dart';

class HazardModel {
  final int hazardId;
  final String type;
  final String description;
  final String severity; // 'low' | 'moderate' | 'high' | 'critical'
  final LatLng location;
  final String status;
  final String? photoUrl;
  final String? createdAt;

  HazardModel({
    required this.hazardId,
    required this.type,
    required this.description,
    required this.severity,
    required this.location,
    required this.status,
    this.photoUrl,
    this.createdAt,
  });

  /// Authoritative hazard radius definition:
  /// Critical = 30m, High = 25m, Moderate = 20m, Low = 15m
  double get radiusMeters {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 30.0;
      case 'high':
        return 25.0;
      case 'moderate':
        return 20.0;
      case 'low':
        return 15.0;
      default:
        return 20.0;
    }
  }

  factory HazardModel.fromFeatureJson(Map<String, dynamic> json) {
    final props = json['properties'] ?? {};
    final geom = json['geometry'] ?? {};
    final coords = geom['coordinates'] as List? ?? [124.9502, 6.3615];

    final lng = (coords[0] as num).toDouble();
    final lat = (coords[1] as num).toDouble();

    return HazardModel(
      hazardId: props['hazard_id'] is int ? props['hazard_id'] : int.parse(props['hazard_id'].toString()),
      type: props['type'] ?? 'Hazard',
      description: props['description'] ?? '',
      severity: props['severity'] ?? 'high',
      location: LatLng(lat, lng),
      status: props['status'] ?? 'active',
      photoUrl: props['photo_url'],
      createdAt: props['created_at'],
    );
  }
}
