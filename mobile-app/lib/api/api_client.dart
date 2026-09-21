import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class ApiException implements Exception {
  final String message;
  final int statusCode;

  ApiException(this.message, this.statusCode);

  @override
  String toString() => 'ApiException ($statusCode): $message';
}

class ApiResponse {
  final int statusCode;
  final String requestUrl;
  final dynamic data;

  ApiResponse({
    required this.statusCode,
    required this.requestUrl,
    required this.data,
  });
}

class ApiClient {
  static String get defaultBaseUrl {
    const envUrl = String.fromEnvironment('API_BASE_URL');
    if (envUrl.isNotEmpty) return envUrl;
    
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:5002/api';
    }
    return 'http://localhost:5002/api';
  }

  static String get fallbackBaseUrl {
    const envUrl = String.fromEnvironment('API_BASE_URL');
    if (envUrl.isNotEmpty) {
      if (envUrl.contains(':5002')) {
        return envUrl.replaceAll(':5002', ':5001');
      }
      return envUrl;
    }

    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:5001/api';
    }
    return 'http://localhost:5001/api';
  }

  static String baseUrl = defaultBaseUrl;

  static Map<String, String> _buildHeaders(String? token) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  static Uri _buildUri(String hostUrl, String path) {
    if (path.startsWith('http')) return Uri.parse(path);
    final fullUrl = path.startsWith('/') ? '$hostUrl$path' : '$hostUrl/$path';
    return Uri.parse(fullUrl);
  }

  static Future<ApiResponse> getResponse(String path, {String? token}) async {
    try {
      final uri = _buildUri(baseUrl, path);
      final response = await http
          .get(uri, headers: _buildHeaders(token))
          .timeout(const Duration(seconds: 5));

      final data = jsonDecode(response.body);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResponse(
          statusCode: response.statusCode,
          requestUrl: uri.toString(),
          data: data,
        );
      } else {
        throw ApiException(
            data is Map && data['message'] != null
                ? data['message']
                : 'GET request failed',
            response.statusCode);
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      // Try fallback port
      try {
        final fallbackUri = _buildUri(fallbackBaseUrl, path);
        final response = await http
            .get(fallbackUri, headers: _buildHeaders(token))
            .timeout(const Duration(seconds: 5));
        final data = jsonDecode(response.body);
        if (response.statusCode >= 200 && response.statusCode < 300) {
          baseUrl = fallbackBaseUrl;
          return ApiResponse(
            statusCode: response.statusCode,
            requestUrl: fallbackUri.toString(),
            data: data,
          );
        }
      } catch (_) {}
      throw ApiException('Network error connecting to backend: $e', 500);
    }
  }

  static Future<dynamic> get(String path, {String? token}) async {
    final res = await getResponse(path, token: token);
    return res.data;
  }

  static Future<dynamic> post(String path, Map<String, dynamic> body,
      {String? token}) async {
    try {
      final response = await http
          .post(_buildUri(baseUrl, path),
              headers: _buildHeaders(token), body: jsonEncode(body))
          .timeout(const Duration(seconds: 5));

      final data = jsonDecode(response.body);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return data;
      } else {
        throw ApiException(
            data['message'] ?? 'POST request failed', response.statusCode);
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      // Try fallback port 5001
      try {
        final response = await http
            .post(_buildUri(fallbackBaseUrl, path),
                headers: _buildHeaders(token), body: jsonEncode(body))
            .timeout(const Duration(seconds: 5));
        final data = jsonDecode(response.body);
        if (response.statusCode >= 200 && response.statusCode < 300) {
          baseUrl = fallbackBaseUrl;
          return data;
        }
      } catch (_) {}
      throw ApiException('Network error connecting to backend: $e', 500);
    }
  }
}
