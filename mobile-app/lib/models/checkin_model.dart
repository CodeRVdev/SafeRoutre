import 'package:latlong2/latlong.dart';

class CheckinModel {
  final int checkinId;
  final int alertId;
  final int userId;
  final int? zoneId;
  final String? zoneName;
  final String checkedInAt;
  final LatLng? location;
  final String status;
  final String? message;

  CheckinModel({
    required this.checkinId,
    required this.alertId,
    required this.userId,
    this.zoneId,
    this.zoneName,
    required this.checkedInAt,
    this.location,
    this.status = 'safe',
    this.message,
  });

  factory CheckinModel.fromJson(Map<String, dynamic> json) {
    LatLng? loc;
    if (json['location'] != null && json['location']['coordinates'] != null) {
      final coords = json['location']['coordinates'] as List;
      if (coords.length >= 2) {
        loc = LatLng((coords[1] as num).toDouble(), (coords[0] as num).toDouble());
      }
    }

    return CheckinModel(
      checkinId: json['checkin_id'] is int ? json['checkin_id'] : int.parse(json['checkin_id'].toString()),
      alertId: json['alert_id'] is int ? json['alert_id'] : int.parse(json['alert_id'].toString()),
      userId: json['user_id'] is int ? json['user_id'] : int.parse(json['user_id'].toString()),
      zoneId: json['zone_id'] != null ? (json['zone_id'] is int ? json['zone_id'] : int.parse(json['zone_id'].toString())) : null,
      zoneName: json['zone_name'],
      checkedInAt: json['checked_in_at'] ?? DateTime.now().toIso8601String(),
      location: loc,
      status: json['status'] ?? 'safe',
      message: json['message'],
    );
  }
}
