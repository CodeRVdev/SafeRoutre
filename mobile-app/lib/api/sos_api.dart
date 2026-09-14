import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';
import '../models/sos_message_model.dart';

class SosApi {
  static const String baseUrl = 'http://10.0.2.2:5000/api';

  static Future<SosMessageModel> sendSos({
    required String token,
    required int alertId,
    required String content,
    LatLng? location,
    String priority = 'normal',
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/sos'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'alert_id': alertId,
        'content': content.trim(),
        'priority': priority,
        if (location != null)
          'location': {
            'latitude': location.latitude,
            'longitude': location.longitude,
          },
      }),
    );

    if (response.statusCode == 201) {
      final json = jsonDecode(response.body);
      return SosMessageModel.fromJson(json['data']);
    } else {
      final json = jsonDecode(response.body);
      throw Exception(json['message'] ?? 'Failed to send SOS message.');
    }
  }

  static Future<List<SosMessageModel>> getSosMessages({
    required String token,
    required int alertId,
  }) async {
    final response = await http.get(
      Uri.parse('$baseUrl/sos?alertId=$alertId'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      final List list = json['data'] ?? [];
      return list.map((item) => SosMessageModel.fromJson(item)).toList();
    } else {
      throw Exception('Failed to fetch SOS thread history.');
    }
  }
}
