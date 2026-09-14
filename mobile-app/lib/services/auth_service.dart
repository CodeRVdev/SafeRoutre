import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/user_model.dart';
import '../api/auth_api.dart';
import '../api/api_client.dart';
import 'fcm_service.dart';

abstract class SessionStorage {
  Future<String?> read({required String key});
  Future<void> write({required String key, required String? value});
  Future<void> delete({required String key});
}

class SecureSessionStorage implements SessionStorage {
  final FlutterSecureStorage _storage;
  const SecureSessionStorage([this._storage = const FlutterSecureStorage()]);

  @override
  Future<String?> read({required String key}) => _storage.read(key: key);

  @override
  Future<void> write({required String key, required String? value}) =>
      _storage.write(key: key, value: value);

  @override
  Future<void> delete({required String key}) => _storage.delete(key: key);
}

class AuthService extends ChangeNotifier {
  final SessionStorage _storage;
  
  String? _token;
  UserModel? _user;
  bool _isInitializing = true;
  bool _isLoading = false;
  bool _isLoggingOut = false;

  String? get token => _token;
  UserModel? get user => _user;
  bool get isAuthenticated => _token != null && _user != null;
  bool get isInitializing => _isInitializing;
  bool get isLoading => _isLoading;
  bool get isLoggingOut => _isLoggingOut;
  String get apiBaseUrl => ApiClient.baseUrl;

  AuthService({SessionStorage? storage})
      : _storage = storage ?? const SecureSessionStorage() {
    _loadSavedSession();
  }

  Future<void> _loadSavedSession() async {
    try {
      final savedToken = await _storage.read(key: 'jwt_token');
      final savedUser = await _storage.read(key: 'user_profile');

      if (savedToken != null && savedUser != null) {
        _token = savedToken;
        _user = UserModel.fromJson(jsonDecode(savedUser));
      }
    } catch (e) {
      debugPrint('Error loading saved session: $e');
    } finally {
      _isInitializing = false;
      notifyListeners();
    }
  }

  Future<void> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final result = await AuthApi.login(email: email, password: password);
      _token = result['token'];
      _user = result['user'];

      await _storage.write(key: 'jwt_token', value: _token);
      await _storage.write(key: 'user_profile', value: jsonEncode(_user!.toJson()));
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> register({
    required String fullName,
    required String email,
    required String password,
    required String role,
    String? idNumber,
    String? department,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final result = await AuthApi.register(
        fullName: fullName,
        email: email,
        password: password,
        role: role,
        idNumber: idNumber,
        department: department,
      );

      _token = result['token'];
      _user = result['user'];

      await _storage.write(key: 'jwt_token', value: _token);
      await _storage.write(key: 'user_profile', value: jsonEncode(_user!.toJson()));
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    if (_isLoggingOut) return;
    _isLoggingOut = true;
    notifyListeners();

    try {
      if (_token != null) {
        try {
          await FcmService().unregisterDeviceToken(_token!, apiBaseUrl);
        } catch (e) {
          debugPrint('⚠️ Non-fatal note unregistering device token on logout: $e');
        }
      }
    } finally {
      // Local session MUST always be cleared, even if remote call fails or times out
      _token = null;
      _user = null;
      try {
        await _storage.delete(key: 'jwt_token');
        await _storage.delete(key: 'user_profile');
      } catch (e) {
        debugPrint('⚠️ Error deleting credentials from storage: $e');
      }
      _isLoggingOut = false;
      notifyListeners();
    }
  }

  @visibleForTesting
  void setSessionForTesting(String token, UserModel user) {
    _token = token;
    _user = user;
    _isInitializing = false;
    notifyListeners();
  }
}
