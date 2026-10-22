import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:latlong2/latlong.dart';
import 'package:saferoute_mobile/services/auth_service.dart';
import 'package:saferoute_mobile/services/offline_checkin_service.dart';

class MockTestSessionStorage implements SessionStorage {
  final Map<String, String> _map = {};

  @override
  Future<String?> read({required String key}) async => _map[key];

  @override
  Future<void> write({required String key, required String? value}) async {
    if (value != null) {
      _map[key] = value;
    } else {
      _map.remove(key);
    }
  }

  @override
  Future<void> delete({required String key}) async {
    _map.remove(key);
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('OfflineCheckinService Unit Tests', () {
    late MockTestSessionStorage mockStorage;
    late OfflineCheckinService service;

    setUp(() {
      mockStorage = MockTestSessionStorage();
      service = OfflineCheckinService(mockStorage);
    });

    test('Initializes with empty queue', () async {
      expect(service.queuedCount, equals(0));
      final queue = await service.getQueue();
      expect(queue, isEmpty);
    });

    test('enqueueCheckin saves check-in to storage', () async {
      await service.enqueueCheckin(
        alertId: 101,
        zoneId: 1,
        location: const LatLng(6.2882333, 124.9675614),
        status: 'safe',
        message: 'I am safe at the Oval',
      );

      expect(service.queuedCount, equals(1));
      final queue = await service.getQueue();
      expect(queue.length, equals(1));
      expect(queue.first.alertId, equals(101));
      expect(queue.first.zoneId, equals(1));
      expect(queue.first.status, equals('safe'));
      expect(queue.first.latitude, closeTo(6.2882333, 0.000001));
      expect(queue.first.longitude, closeTo(124.9675614, 0.000001));
      expect(queue.first.message, equals('I am safe at the Oval'));

      // Check that the underlying storage contains valid JSON
      final raw = await mockStorage.read(key: 'saferoute_offline_checkins');
      expect(raw, isNotNull);
      final List decoded = jsonDecode(raw!);
      expect(decoded.length, equals(1));
    });

    test('enqueueCheckin deduplicates by replacing older queued entry for same alertId', () async {
      await service.enqueueCheckin(
        alertId: 101,
        status: 'need_help',
        message: 'First attempt - need help',
      );
      expect(service.queuedCount, equals(1));

      // Second attempt updates the status to 'safe'
      await service.enqueueCheckin(
        alertId: 101,
        status: 'safe',
        message: 'Second attempt - found safe shelter',
      );

      expect(service.queuedCount, equals(1));
      final queue = await service.getQueue();
      expect(queue.length, equals(1));
      expect(queue.first.status, equals('safe'));
      expect(queue.first.message, equals('Second attempt - found safe shelter'));
    });

    test('enqueueCheckin can queue multiple different alerts', () async {
      await service.enqueueCheckin(alertId: 101, status: 'safe');
      await service.enqueueCheckin(alertId: 102, status: 'injured');

      expect(service.queuedCount, equals(2));
      final queue = await service.getQueue();
      expect(queue.length, equals(2));
      expect(queue[0].alertId, equals(101));
      expect(queue[1].alertId, equals(102));
      expect(queue[1].status, equals('injured'));
    });

    test('clearQueue empties storage and resets counter', () async {
      await service.enqueueCheckin(alertId: 101, status: 'safe');
      expect(service.queuedCount, equals(1));

      await service.clearQueue();
      expect(service.queuedCount, equals(0));
      final queue = await service.getQueue();
      expect(queue, isEmpty);

      final raw = await mockStorage.read(key: 'saferoute_offline_checkins');
      expect(raw, isNull);
    });
  });
}
