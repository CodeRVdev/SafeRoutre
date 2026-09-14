import '../models/emergency_contact_model.dart';
import 'api_client.dart';

class ContactApi {
  /// Fetches all active emergency contacts.
  static Future<List<EmergencyContactModel>> getEmergencyContacts(String token) async {
    final response = await ApiClient.get('/emergency-contacts', token: token);
    final List data = response is Map ? (response['data'] ?? []) : [];
    return data.map((json) => EmergencyContactModel.fromJson(json)).toList();
  }
}
