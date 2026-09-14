import 'package:flutter/foundation.dart';
import 'package:latlong2/latlong.dart';
import '../models/route_guidance_model.dart';
import 'api_client.dart';

class RoutingApi {
  /// Fetches safe evacuation route guidance from backend API
  static Future<RouteGuidanceModel> getSafePath({
    required String token,
    required LatLng userLocation,
    LatLng? destinationLocation,
  }) async {
    final queryParams = <String, String>{
      'fromLat': userLocation.latitude.toString(),
      'fromLng': userLocation.longitude.toString(),
      if (destinationLocation != null) ...{
        'toLat': destinationLocation.latitude.toString(),
        'toLng': destinationLocation.longitude.toString(),
      }
    };

    final queryString = Uri(queryParameters: queryParams).query;
    final path = '/routing/safe-path?$queryString';

    final response = await ApiClient.getResponse(path, token: token);
    final statusCode = response.statusCode;
    final requestUrl = response.requestUrl;
    final rawData = response.data;

    if (rawData is! Map) {
      debugPrint('🗺️ [RoutingApi] Request URL: $requestUrl');
      debugPrint('🗺️ [RoutingApi] HTTP Status Code: $statusCode');
      debugPrint('🗺️ [RoutingApi] Invalid response payload type: ${rawData.runtimeType}');
      throw FormatException('Expected JSON map in routing response, got: ${rawData.runtimeType}');
    }

    final json = Map<String, dynamic>.from(rawData);
    final responseKeys = json.keys.toList();
    final successVal = json['success'];
    final hasData = json.containsKey('data') && json['data'] != null;

    // Temporary debug logging required by specification (no tokens, passwords, or secrets logged)
    debugPrint('🗺️ [RoutingApi] Request URL: $requestUrl');
    debugPrint('🗺️ [RoutingApi] HTTP Status Code: $statusCode');
    debugPrint('🗺️ [RoutingApi] Response JSON Keys: $responseKeys');
    debugPrint('🗺️ [RoutingApi] Success Value: $successVal');
    debugPrint('🗺️ [RoutingApi] Data Exists: $hasData');
    debugPrint('🗺️ [RoutingApi] Response Body: $json');

    if (successVal == false) {
      final errorMsg = json['message']?.toString() ??
          'Routing service reported failure without a specific message.';
      throw Exception(errorMsg);
    }

    if (successVal != true) {
      throw const FormatException(
          'Malformed routing response: missing or invalid "success" field.');
    }

    try {
      return RouteGuidanceModel.fromJson(json);
    } catch (e, stack) {
      debugPrint('❌ [RoutingApi] Error parsing RouteGuidanceModel: $e\n$stack');
      throw FormatException('Failed to parse route guidance model: $e');
    }
  }
}
