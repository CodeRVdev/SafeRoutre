import 'dart:async';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class AudioSirenService extends ChangeNotifier {
  final AudioPlayer _audioPlayer = AudioPlayer();
  final FlutterLocalNotificationsPlugin _notificationsPlugin = FlutterLocalNotificationsPlugin();
  
  static const Duration defaultSirenDelay = Duration(seconds: 10);

  Timer? _sirenDelayTimer;
  bool _isSirenActive = false;
  bool _isPlayingAudio = false;
  String? _activeAlertTitle;
  String? _activeAlertMessage;

  bool get isSirenActive => _isSirenActive;
  bool get isPlayingAudio => _isPlayingAudio;
  bool get isPendingDelay => _sirenDelayTimer != null && _sirenDelayTimer!.isActive;
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

  /// Initiates emergency siren sequence:
  /// - Marks siren active and triggers high-priority notification immediately.
  /// - Waits exactly [delay] (default: 10.0 seconds) before starting siren audio playback.
  /// - If [stopSiren] is called during the 10-second delay (e.g. user checks in safe), playback is cancelled.
  Future<void> startSiren({
    required String title,
    required String message,
    Duration delay = defaultSirenDelay,
  }) async {
    _cancelDelayTimer();
    _isSirenActive = true;
    _isPlayingAudio = false;
    _activeAlertTitle = title;
    _activeAlertMessage = message;
    notifyListeners();

    // Trigger high-priority heads-up notification immediately
    _showEmergencyNotification(title, message);

    if (delay == Duration.zero) {
      await _playAudio();
    } else {
      debugPrint('⏳ [AudioSirenService] Alert received. Waiting ${delay.inSeconds}s before starting siren audio...');
      _sirenDelayTimer = Timer(delay, () async {
        if (_isSirenActive) {
          await _playAudio();
        }
      });
    }
  }

  Future<void> _playAudio() async {
    try {
      debugPrint('🔊 [AudioSirenService] 10.0s delay elapsed. Starting looping siren audio...');
      // Loop audio continuously
      await _audioPlayer.setReleaseMode(ReleaseMode.loop);
      await _audioPlayer.play(AssetSource('audio/siren.mp3'));
      _isPlayingAudio = true;
      notifyListeners();
    } catch (e) {
      debugPrint('Error starting siren audio: $e');
    }
  }

  /// Stops siren audio playback immediately and cancels any pending 10-second delay timer
  Future<void> stopSiren() async {
    _cancelDelayTimer();
    _isSirenActive = false;
    _isPlayingAudio = false;
    notifyListeners();

    try {
      await _audioPlayer.stop();
      await _audioPlayer.release();
      await _notificationsPlugin.cancelAll();
      debugPrint('🔇 [AudioSirenService] Siren stopped / muted.');
    } catch (e) {
      debugPrint('Error stopping siren: $e');
    }
  }

  void _cancelDelayTimer() {
    if (_sirenDelayTimer != null) {
      _sirenDelayTimer!.cancel();
      _sirenDelayTimer = null;
    }
  }

  @override
  void dispose() {
    _cancelDelayTimer();
    _audioPlayer.dispose();
    super.dispose();
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
