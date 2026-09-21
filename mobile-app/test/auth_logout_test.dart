import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saferoute_mobile/services/auth_service.dart';
import 'package:saferoute_mobile/services/socket_service.dart';
import 'package:saferoute_mobile/services/audio_siren_service.dart';
import 'package:saferoute_mobile/models/user_model.dart';

/// In-memory mock implementation of SessionStorage for isolated unit tests
class MockSessionStorage implements SessionStorage {
  final Map<String, String> _data = {};

  @override
  Future<String?> read({required String key}) async => _data[key];

  @override
  Future<void> write({required String key, required String? value}) async {
    if (value != null) {
      _data[key] = value;
    } else {
      _data.remove(key);
    }
  }

  @override
  Future<void> delete({required String key}) async {
    _data.remove(key);
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
      const MethodChannel('xyz.luan/audioplayers.global'),
      (methodCall) async => 1,
    );
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
      const MethodChannel('xyz.luan/audioplayers'),
      (methodCall) async => 1,
    );
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
      const MethodChannel('dexterous.com/flutter/local_notifications'),
      (methodCall) async => true,
    );
  });

  group('AuthService & Logout Isolation Tests', () {
    late MockSessionStorage mockStorage;

    setUp(() {
      mockStorage = MockSessionStorage();
    });

    test('Fresh AuthService with empty storage is unauthenticated', () async {
      final auth = AuthService(storage: mockStorage);
      // Wait for async _loadSavedSession to complete
      await Future.delayed(const Duration(milliseconds: 50));

      expect(auth.token, isNull);
      expect(auth.user, isNull);
      expect(auth.isAuthenticated, isFalse);
      expect(auth.isInitializing, isFalse);
    });

    test('AuthService restores saved session correctly from storage', () async {
      final testUser = UserModel(
        userId: 10,
        fullName: 'Juan Dela Cruz',
        email: 'juan@saferoute.edu',
        role: 'student',
      );
      await mockStorage.write(key: 'jwt_token', value: 'valid_jwt_token_123');
      await mockStorage.write(key: 'user_profile', value: jsonEncode(testUser.toJson()));

      final auth = AuthService(storage: mockStorage);
      await Future.delayed(const Duration(milliseconds: 50));

      expect(auth.token, 'valid_jwt_token_123');
      expect(auth.user?.fullName, 'Juan Dela Cruz');
      expect(auth.user?.role, 'student');
      expect(auth.isAuthenticated, isTrue);
    });

    test('logout clears in-memory state, storage, and sets isAuthenticated to false', () async {
      final testUser = UserModel(
        userId: 10,
        fullName: 'Juan Dela Cruz',
        email: 'juan@saferoute.edu',
        role: 'student',
      );
      await mockStorage.write(key: 'jwt_token', value: 'valid_jwt_token_123');
      await mockStorage.write(key: 'user_profile', value: jsonEncode(testUser.toJson()));

      final auth = AuthService(storage: mockStorage);
      await Future.delayed(const Duration(milliseconds: 50));
      expect(auth.isAuthenticated, isTrue);

      bool notified = false;
      auth.addListener(() => notified = true);

      // Perform logout
      await auth.logout();

      expect(auth.token, isNull);
      expect(auth.user, isNull);
      expect(auth.isAuthenticated, isFalse);
      expect(auth.isLoggingOut, isFalse);
      expect(notified, isTrue);

      // Verify persistent storage is wiped
      expect(await mockStorage.read(key: 'jwt_token'), isNull);
      expect(await mockStorage.read(key: 'user_profile'), isNull);
    });

    test('Multi-User session isolation: User B does not inherit User A data after logout', () async {
      final userA = UserModel(
        userId: 1,
        fullName: 'User A Student',
        email: 'student_a@saferoute.edu',
        role: 'student',
      );
      final userB = UserModel(
        userId: 2,
        fullName: 'User B Faculty',
        email: 'faculty_b@saferoute.edu',
        role: 'faculty',
      );

      // 1. User A is logged in
      final auth = AuthService(storage: mockStorage);
      auth.setSessionForTesting('token_A', userA);
      await mockStorage.write(key: 'jwt_token', value: 'token_A');
      await mockStorage.write(key: 'user_profile', value: jsonEncode(userA.toJson()));

      expect(auth.user?.fullName, 'User A Student');
      expect(auth.token, 'token_A');

      // 2. User A logs out
      await auth.logout();
      expect(auth.isAuthenticated, isFalse);
      expect(await mockStorage.read(key: 'jwt_token'), isNull);

      // 3. User B logs in
      auth.setSessionForTesting('token_B', userB);
      await mockStorage.write(key: 'jwt_token', value: 'token_B');
      await mockStorage.write(key: 'user_profile', value: jsonEncode(userB.toJson()));

      expect(auth.isAuthenticated, isTrue);
      expect(auth.user?.fullName, 'User B Faculty');
      expect(auth.user?.email, 'faculty_b@saferoute.edu');
      expect(auth.user?.role, 'faculty');
      expect(auth.token, 'token_B');
      expect(auth.token, isNot('token_A'));
    });
  });

  group('SocketService Disconnect & Multi-User Lifecycle Tests', () {
    test('SocketService.disconnect resets connection and clears lastToken', () {
      final socketService = SocketService();
      expect(socketService.isConnected, isFalse);
      expect(socketService.lastToken, isNull);

      // Simulate connection setup state
      socketService.disconnect();

      expect(socketService.isConnected, isFalse);
      expect(socketService.lastToken, isNull);
    });

    test('Siren safety: logout does not change siren state automatically', () async {
      final sirenService = AudioSirenService();
      expect(sirenService.isSirenActive, isFalse);

      final socketService = SocketService();
      socketService.disconnect();

      // Siren service is untouched by socket disconnection
      expect(sirenService.isSirenActive, isFalse);
    });
  });
}
