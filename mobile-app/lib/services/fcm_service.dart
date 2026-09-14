import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;
import '../screens/evacuation_map_screen.dart';

// Top-level background message entrypoint (must be static or top-level with @pragma)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  if (kIsWeb) return;
  try {
    await Firebase.initializeApp();
    debugPrint('🔥 FCM Background Message received: ${message.messageId}');
  } catch (e) {
    debugPrint('⚠️ FCM Background handler init error: $e');
  }
}

class FcmService {
  static final FcmService _instance = FcmService._internal();
  factory FcmService() => _instance;
  FcmService._internal();

  /// Global navigator key allowing direct navigation on notification taps from any state
  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  FirebaseMessaging get _messaging => FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  bool _isInitialized = false;
  String? _currentToken;
  Map<String, dynamic>? _pendingPayload;

  /// Initializes FCM, requests permissions, registers device token with backend,
  /// and attaches foreground, background, and terminated notification handlers.
  Future<void> initialize({
    required BuildContext context,
    required String userToken,
    required String apiBaseUrl,
  }) async {
    if (kIsWeb) {
      debugPrint('ℹ️ FCM Push Notifications bypassed on Web platform (Socket.IO handles real-time alerts).');
      return;
    }

    try {
      if (!_isInitialized) {
        // 1. Initialize Firebase Core
        await Firebase.initializeApp();
        _isInitialized = true;

        // 2. Request Notification Permissions
        NotificationSettings settings = await _messaging.requestPermission(
          alert: true,
          badge: true,
          sound: true,
          provisional: false,
        );

        debugPrint('🔔 FCM Notification Permission Status: ${settings.authorizationStatus}');

        // 3. Initialize Local Notifications Plugin for Foreground Display
        const AndroidInitializationSettings androidSettings =
            AndroidInitializationSettings('@mipmap/ic_launcher');
        const DarwinInitializationSettings iosSettings = DarwinInitializationSettings();
        const InitializationSettings initSettings = InitializationSettings(
          android: androidSettings,
          iOS: iosSettings,
        );

        await _localNotifications.initialize(
          initSettings,
          onDidReceiveNotificationResponse: (NotificationResponse response) {
            Map<String, dynamic>? payload;
            if (response.payload != null && response.payload!.isNotEmpty) {
              try {
                payload = jsonDecode(response.payload!) as Map<String, dynamic>;
              } catch (_) {}
            }
            navigateToEmergencyMap(payload);
          },
        );

        // 4. Listen to Token Refresh events
        _messaging.onTokenRefresh.listen((newToken) {
          _registerDeviceToken(newToken, userToken, apiBaseUrl);
        });

        // 5. Handle Foreground Messages (App Open & Active)
        FirebaseMessaging.onMessage.listen((RemoteMessage message) {
          debugPrint('🔔 FCM Foreground Message: ${message.notification?.title}');
          _showForegroundNotification(message);
        });

        // 6. Handle Background Notification Taps (App in Background)
        FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
          debugPrint('📲 FCM Notification Tapped from Background');
          navigateToEmergencyMap(message.data);
        });

        // 7. Handle Terminated App Notification Launch
        RemoteMessage? initialMessage = await _messaging.getInitialMessage();
        if (initialMessage != null) {
          debugPrint('🚀 FCM Notification Launched App from Terminated State: ${initialMessage.data}');
          _pendingPayload = initialMessage.data;
          // Post-frame callback ensures Flutter and navigator are completely mounted
          WidgetsBinding.instance.addPostFrameCallback((_) {
            consumePendingNavigation();
          });
        }
      }

      // 8. Retrieve FCM Token & Register with SafeRoute Backend API
      String? fcmToken = await _messaging.getToken();
      if (fcmToken != null && userToken.isNotEmpty) {
        await _registerDeviceToken(fcmToken, userToken, apiBaseUrl);
      }

      // If there was a pending emergency payload from terminated app launch, consume now
      if (_pendingPayload != null) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          consumePendingNavigation();
        });
      }
    } catch (e) {
      debugPrint('⚠️ FcmService initialization notice: $e');
    }
  }

  /// Sends the device token to POST /api/auth/device-token with platform metadata
  Future<void> _registerDeviceToken(String fcmToken, String userToken, String apiBaseUrl) async {
    _currentToken = fcmToken;
    try {
      String platform = 'android';
      if (kIsWeb) {
        platform = 'web';
      } else if (defaultTargetPlatform == TargetPlatform.iOS) {
        platform = 'ios';
      }

      final url = Uri.parse('$apiBaseUrl/auth/device-token');
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $userToken',
        },
        body: jsonEncode({
          'device_token': fcmToken,
          'platform': platform,
        }),
      );

      if (response.statusCode == 200) {
        debugPrint('✅ Registered FCM device token ($platform) with SafeRoute backend.');
      } else {
        debugPrint('⚠️ Failed to register FCM token (${response.statusCode}): ${response.body}');
      }
    } catch (e) {
      debugPrint('❌ Error registering FCM token with backend: $e');
    }
  }

  /// Unregisters the current device token on user logout: DELETE /api/auth/device-token
  Future<void> unregisterDeviceToken(String userToken, String apiBaseUrl) async {
    if (_currentToken == null || _currentToken!.isEmpty) return;
    try {
      final url = Uri.parse('$apiBaseUrl/auth/device-token');
      final response = await http.delete(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $userToken',
        },
        body: jsonEncode({
          'device_token': _currentToken,
        }),
      );
      if (response.statusCode == 200) {
        debugPrint('✅ Unregistered FCM device token from SafeRoute backend on logout.');
      }
      _currentToken = null;
    } catch (e) {
      debugPrint('⚠️ Error unregistering device token from backend: $e');
    }
  }

  /// Consumes any pending emergency notification navigation payload after app finishes loading
  void consumePendingNavigation() {
    if (_pendingPayload != null && navigatorKey.currentState != null) {
      final payload = _pendingPayload;
      _pendingPayload = null;
      navigateToEmergencyMap(payload);
    }
  }

  /// Directly navigates user to the EvacuationMapScreen with immediate safe-route guidance
  void navigateToEmergencyMap([Map<String, dynamic>? data]) {
    if (navigatorKey.currentState != null) {
      navigatorKey.currentState!.push(
        MaterialPageRoute(
          builder: (_) => const EvacuationMapScreen(autoStartNavigation: true),
        ),
      );
    } else {
      _pendingPayload = data ?? {};
    }
  }

  /// Shows a high-priority local notification when an alert arrives while app is in foreground
  Future<void> _showForegroundNotification(RemoteMessage message) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'saferoute_emergency_channel',
      'SafeRoute Emergency Alerts',
      channelDescription: 'High-priority notifications for SafeRoute campus emergency alerts',
      importance: Importance.max,
      priority: Priority.high,
      color: Colors.red,
      playSound: true,
      enableVibration: true,
    );

    const NotificationDetails platformDetails = NotificationDetails(android: androidDetails);

    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      message.notification?.title ?? '🚨 EMERGENCY ALERT BROADCAST',
      message.notification?.body ?? 'An emergency alert has been issued for Polonoling NHS campus.',
      platformDetails,
      payload: jsonEncode(message.data),
    );
  }
}
