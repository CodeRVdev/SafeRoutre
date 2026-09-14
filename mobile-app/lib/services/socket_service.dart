import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../models/alert_model.dart';
import 'audio_siren_service.dart';

class SocketService extends ChangeNotifier {
  io.Socket? _socket;
  bool _isConnected = false;
  AlertModel? _currentActiveAlert;
  String? _lastToken;
  AudioSirenService? _sirenService;

  bool get isConnected => _isConnected;
  AlertModel? get currentActiveAlert => _currentActiveAlert;
  String? get lastToken => _lastToken;
  AudioSirenService? get sirenService => _sirenService;

  static String get defaultSocketUrl {
    const envUrl = String.fromEnvironment('SOCKET_URL');
    if (envUrl.isNotEmpty) return envUrl;
    
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:5001';
    }
    return 'http://localhost:5001';
  }

  static String get fallbackSocketUrl {
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:5000';
    }
    return 'http://localhost:5000';
  }

  void connect(String token, AudioSirenService sirenService, {String? serverUrl}) {
    _lastToken = token;
    _sirenService = sirenService;

    if (_socket != null && _socket!.connected) return;

    final url = serverUrl ?? defaultSocketUrl;

    debugPrint('⚡ Connecting Mobile Socket.IO to $url with token...');

    _socket = io.io(
      url,
      io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .setAuth({'token': token})
          .enableAutoConnect()
          .build(),
    );

    _socket!.onConnect((_) {
      _isConnected = true;
      debugPrint('⚡ Mobile Socket Connected!');
      notifyListeners();
    });

    _socket!.onConnectError((err) {
      debugPrint('⚠️ Mobile Socket Connect Error: $err');
      // Fallback port 5001 retry
      if (_socket != null && !_socket!.connected) {
        _socket!.io.uri = fallbackSocketUrl;
        _socket!.connect();
      }
    });

    _socket!.on('token_expired', (data) {
      debugPrint('⚠️ Mobile Socket Received token_expired: $data');
      _isConnected = false;
      notifyListeners();
    });

    _socket!.onDisconnect((reason) {
      _isConnected = false;
      debugPrint('🔌 Mobile Socket Disconnected: $reason');
      notifyListeners();
    });

    // Real-Time Alert Broadcast Handler
    _socket!.on('alert:broadcast', (data) {
      debugPrint('🚨 Mobile Received alert:broadcast event: $data');
      if (data != null && data is Map<String, dynamic>) {
        final alert = AlertModel.fromJson(data);
        _currentActiveAlert = alert;
        notifyListeners();

        // Trigger Emergency Siren & Notification Loop
        sirenService.startSiren(
          title: alert.title,
          message: alert.message,
        );
      }
    });

    // Real-Time Alert Deactivated / Resolved Handler
    _socket!.on('alert:resolved', (data) {
      debugPrint('ℹ️ Mobile Received alert:resolved event: $data');
      _currentActiveAlert = null;
      _sirenService?.stopSiren();
      notifyListeners();
    });

    // Real-Time Hazard New Handler
    _socket!.on('hazard:new', (data) {
      debugPrint('⚠️ Mobile Received hazard:new event: $data');
      notifyListeners();
    });

    // Real-Time Hazard Resolved Handler
    _socket!.on('hazard:resolved', (data) {
      debugPrint('✅ Mobile Received hazard:resolved event: $data');
      notifyListeners();
    });

    _socket!.connect();
  }

  /// Auto-reconnects mobile socket with a newly refreshed JWT token
  void reconnectWithFreshToken(String newToken, AudioSirenService sirenService, {String? serverUrl}) {
    disconnect();
    connect(newToken, sirenService, serverUrl: serverUrl);
  }

  void setActiveAlert(AlertModel? alert) {
    _currentActiveAlert = alert;
    notifyListeners();
  }

  void disconnect() {
    if (_socket != null) {
      try {
        _socket!.clearListeners();
        _socket!.disconnect();
      } catch (e) {
        debugPrint('⚠️ Error disconnecting socket: $e');
      }
      _socket = null;
    }
    _isConnected = false;
    _lastToken = null;
    notifyListeners();
  }
}
