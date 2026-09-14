import 'package:latlong2/latlong.dart';
import '../models/checkin_model.dart';
import 'api_client.dart';

class CheckinApi {
  /// Submits safety check-in (POST /api/checkins)
  static Future<CheckinModel> submitCheckin({
    required String token,
    required int alertId,
    int? zoneId,
    LatLng? location,
    String status = 'safe',
    String? message,
  }) async {
    final body = <String, dynamic>{
      'alert_id': alertId,
      'status': status,
      if (message != null && message.trim().isNotEmpty) 'message': message.trim(),
      if (zoneId != null) 'zone_id': zoneId,
      if (location != null)
        'location': {
          'type': 'Point',
          'coordinates': [location.longitude, location.latitude],
        },
    };

    final response = await ApiClient.post('/checkins', body, token: token);
    return CheckinModel.fromJson(response['checkin']);
  }

  /// Fetches personal check-in history (GET /api/checkins/my)
  static Future<List<CheckinModel>> fetchCheckinHistory({
    required String token,
    int? alertId,
    int? meUserId,
  }) async {
    try {
      final response = await ApiClient.get('/checkins/my', token: token);
      final list = (response['data'] as List? ?? []);
      return list.map((item) => CheckinModel.fromJson(item)).toList();
    } catch (_) {
      return [];
    }
  }
}
