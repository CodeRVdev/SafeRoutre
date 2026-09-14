import '../models/user_model.dart';
import 'api_client.dart';

class AuthApi {
  /// Calls POST /api/auth/login
  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await ApiClient.post('/auth/login', {
      'email': email,
      'password': password,
    });
    return {
      'token': response['token'],
      'user': UserModel.fromJson(response['user']),
    };
  }

  /// Calls POST /api/auth/register
  /// Restricts roles to 'student', 'faculty', or 'staff'
  static Future<Map<String, dynamic>> register({
    required String fullName,
    required String email,
    required String password,
    required String role,
    String? idNumber,
    String? department,
  }) async {
    final allowedRoles = ['student', 'faculty', 'staff'];
    if (!allowedRoles.contains(role.toLowerCase())) {
      throw ApiException(
          'Invalid role. Registration from the Mobile App is only allowed for Students, Faculty, and Staff.',
          400);
    }

    final response = await ApiClient.post('/auth/register', {
      'full_name': fullName,
      'email': email,
      'password': password,
      'role': role.toLowerCase(),
      'id_number': idNumber,
      'department': department,
    });

    return {
      'token': response['token'],
      'user': UserModel.fromJson(response['user']),
    };
  }
}
