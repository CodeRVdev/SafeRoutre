import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class AudioSirenService extends ChangeNotifier {
  final AudioPlayer _audioPlayer = AudioPlayer();
  final FlutterLocalNotificationsPlugin _notificationsPlugin = FlutterLocalNotificationsPlugin();
  
  bool _isSirenActive = false;
  String? _activeAlertTitle;
  String? _activeAlertMessage;

  bool get isSirenActive => _isSirenActive;
  String? get activeAlertTitle => _activeAlertTitle;
  String? get activeAlertMessage => _activeAlertMessage;

  AudioSirenService() {
    _initNotifications();
  }

  Future<void> _initNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings();
    const settings = InitializationSettings(android: androidSettings, iOS: iosSettings);

    try {
      await _notificationsPlugin.initialize(settings);
    } catch (e) {
      debugPrint('Local Notification Init Error: $e');
    }
  }

  /// Plays looping emergency siren audio and fires high-priority notification
  Future<void> startSiren({required String title, required String message}) async {
    _isSirenActive = true;
    _activeAlertTitle = title;
    _activeAlertMessage = message;
    notifyListeners();

    try {
      // Loop audio continuously
      await _audioPlayer.setReleaseMode(ReleaseMode.loop);
      await _audioPlayer.play(AssetSource('audio/siren.mp3'));
    } catch (e) {
      debugPrint('Error starting siren audio: $e');
    }

    _showEmergencyNotification(title, message);
  }

  /// Stops siren audio playback immediately
  Future<void> stopSiren() async {
    _isSirenActive = false;
    notifyListeners();

    try {
      await _audioPlayer.stop();
      await _audioPlayer.release();
      await _notificationsPlugin.cancelAll();
    } catch (e) {
      debugPrint('Error stopping siren: $e');
    }
  }

  Future<void> _showEmergencyNotification(String title, String message) async {
    const androidDetails = AndroidNotificationDetails(
      'saferoute_emergency_channel',
      'Emergency Evacuation Alerts',
      channelDescription: 'High priority siren alerts during campus evacuation',
      importance: Importance.max,
      priority: Priority.high,
      ongoing: true,
      playSound: true,
    );

    const details = NotificationDetails(android: androidDetails);

    try {
      await _notificationsPlugin.show(
        999,
        '🚨 $title',
        message,
        details,
      );
    } catch (e) {
      debugPrint('Error displaying heads-up notification: $e');
    }
  }
}
