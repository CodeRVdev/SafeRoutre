import '../models/alert_model.dart';
import 'api_client.dart';

class AlertApi {
  /// Fetches active emergency alerts (GET /api/alerts/active)
  static Future<List<AlertModel>> getActiveAlerts(String token) async {
    final response = await ApiClient.get('/alerts/active', token: token);
    final alertsList = (response['data'] as List? ?? []);
    return alertsList.map((a) => AlertModel.fromJson(a)).toList();
  }
}
