import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:latlong2/latlong.dart';
import '../api/checkin_api.dart';
import 'auth_service.dart';

class QueuedCheckin {
  final int alertId;
  final int? zoneId;
  final double? latitude;
  final double? longitude;
  final String status;
  final String? message;
  final String queuedAt;

  QueuedCheckin({
    required this.alertId,
    this.zoneId,
    this.latitude,
    this.longitude,
    this.status = 'safe',
    this.message,
    required this.queuedAt,
  });

  Map<String, dynamic> toJson() => {
        'alertId': alertId,
        'zoneId': zoneId,
        'latitude': latitude,
        'longitude': longitude,
        'status': status,
        'message': message,
        'queuedAt': queuedAt,
      };

  factory QueuedCheckin.fromJson(Map<String, dynamic> json) => QueuedCheckin(
        alertId: json['alertId'] is int ? json['alertId'] : int.parse(json['alertId'].toString()),
        zoneId: json['zoneId'] != null
            ? (json['zoneId'] is int ? json['zoneId'] : int.tryParse(json['zoneId'].toString()))
            : null,
        latitude: json['latitude'] != null ? (json['latitude'] as num).toDouble() : null,
        longitude: json['longitude'] != null ? (json['longitude'] as num).toDouble() : null,
        status: json['status']?.toString() ?? 'safe',
        message: json['message']?.toString(),
        queuedAt: json['queuedAt']?.toString() ?? DateTime.now().toIso8601String(),
      );
}

class OfflineCheckinService extends ChangeNotifier {
  static final OfflineCheckinService instance = OfflineCheckinService();

  final SessionStorage _storage;
  static const String _storageKey = 'saferoute_offline_checkins';

  bool _isSyncing = false;
  int _cachedQueueCount = 0;

  bool get isSyncing => _isSyncing;
  int get queuedCount => _cachedQueueCount;

  OfflineCheckinService([SessionStorage? storage])
      : _storage = storage ?? const SecureSessionStorage() {
    _refreshCount();
  }

  Future<void> _refreshCount() async {
    try {
      final queue = await getQueue();
      _cachedQueueCount = queue.length;
      notifyListeners();
    } catch (_) {}
  }

  Future<List<QueuedCheckin>> getQueue() async {
    try {
      final raw = await _storage.read(key: _storageKey);
      if (raw == null || raw.trim().isEmpty) return [];
      final List decoded = jsonDecode(raw);
      return decoded.map((item) => QueuedCheckin.fromJson(item as Map<String, dynamic>)).toList();
    } catch (e) {
      debugPrint('⚠️ Error reading offline check-in queue: $e');
      return [];
    }
  }

  Future<void> enqueueCheckin({
    required int alertId,
    int? zoneId,
    LatLng? location,
    String status = 'safe',
    String? message,
  }) async {
    try {
      final queue = await getQueue();

      // Deduplicate: If a check-in for this alertId is already queued, replace with latest status/coordinates
      queue.removeWhere((item) => item.alertId == alertId);

      queue.add(QueuedCheckin(
        alertId: alertId,
        zoneId: zoneId,
        latitude: location?.latitude,
        longitude: location?.longitude,
        status: status,
        message: message,
        queuedAt: DateTime.now().toIso8601String(),
      ));

      final serialized = jsonEncode(queue.map((q) => q.toJson()).toList());
      await _storage.write(key: _storageKey, value: serialized);
      _cachedQueueCount = queue.length;
      notifyListeners();

      debugPrint('💾 Persisted offline check-in to secure storage for alert $alertId (Total queued: ${queue.length})');
    } catch (e) {
      debugPrint('❌ Failed to persist offline check-in: $e');
    }
  }

  Future<int> syncQueuedCheckins(String token) async {
    if (_isSyncing) {
      debugPrint('ℹ️ Offline sync already in progress, skipping duplicate call.');
      return 0;
    }

    final queue = await getQueue();
    if (queue.isEmpty) {
      _cachedQueueCount = 0;
      return 0;
    }

    _isSyncing = true;
    notifyListeners();

    debugPrint('🔄 Starting sync of ${queue.length} offline check-in(s)...');
    final remainingQueue = <QueuedCheckin>[];
    int syncedSuccessCount = 0;

    for (final item in queue) {
      try {
        final loc = (item.latitude != null && item.longitude != null)
            ? LatLng(item.latitude!, item.longitude!)
            : null;

        await CheckinApi.submitCheckin(
          token: token,
          alertId: item.alertId,
          zoneId: item.zoneId,
          location: loc,
          status: item.status,
          message: item.message,
        );

        syncedSuccessCount++;
        debugPrint('✅ Synced offline check-in for alert ${item.alertId} (${item.status})');
      } catch (e) {
        final errStr = e.toString();
        // If error is a network error or timeout, retain in queue for future retry
        if (errStr.contains('SocketException') ||
            errStr.contains('Network error') ||
            errStr.contains('TimeoutException') ||
            errStr.contains('ClientException') ||
            errStr.contains('Failed host lookup')) {
          debugPrint('📶 Network unavailable during sync of alert ${item.alertId}, keeping in queue.');
          remainingQueue.add(item);
        } else {
          // If error is 4xx (e.g. alert closed/deleted/invalid), drop to avoid infinite retry loop
          debugPrint('⚠️ Discarding non-retriable offline check-in error for alert ${item.alertId}: $errStr');
        }
      }
    }

    try {
      if (remainingQueue.isEmpty) {
        await _storage.delete(key: _storageKey);
      } else {
        final serialized = jsonEncode(remainingQueue.map((q) => q.toJson()).toList());
        await _storage.write(key: _storageKey, value: serialized);
      }
    } catch (e) {
      debugPrint('⚠️ Error updating queue in storage after sync: $e');
    }

    _cachedQueueCount = remainingQueue.length;
    _isSyncing = false;
    notifyListeners();

    if (syncedSuccessCount > 0) {
      debugPrint('🎉 Offline check-in sync complete: $syncedSuccessCount sent, $_cachedQueueCount remaining.');
    }

    return syncedSuccessCount;
  }

  Future<void> clearQueue() async {
    try {
      await _storage.delete(key: _storageKey);
      _cachedQueueCount = 0;
      notifyListeners();
    } catch (_) {}
  }
}
