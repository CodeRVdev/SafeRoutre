import '../models/zone_model.dart';
import '../models/hazard_model.dart';
import 'api_client.dart';

class MapApi {
  /// Fetches campus zones GeoJSON feature collection (GET /api/zones)
  static Future<List<ZoneModel>> getZones(String token) async {
    final response = await ApiClient.get('/zones', token: token);
    final features = (response['data']?['features'] as List? ?? []);
    return features.map((f) => ZoneModel.fromFeatureJson(f)).toList();
  }

  /// Fetches active hazards GeoJSON feature collection (GET /api/hazards/active)
  static Future<List<HazardModel>> getActiveHazards(String token) async {
    final response = await ApiClient.get('/hazards/active', token: token);
    final features = (response['data']?['features'] as List? ?? []);
    return features.map((f) => HazardModel.fromFeatureJson(f)).toList();
  }
}
