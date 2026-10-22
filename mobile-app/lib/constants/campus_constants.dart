import 'package:latlong2/latlong.dart';

/// Authoritative Geographic Constants for Polonuling National High School (PNHS)
/// Strictly aligned with Web Admin Campus GIS & Backend PostGIS Schemas.
class CampusConstants {
  /// Overall Campus Geographic Centroid Datum (for initial camera bounding & campus extent)
  static const LatLng campusCenter = LatLng(6.2882333, 124.9675614);

  /// Authoritative School Ground / Central Evacuation Assembly Oval Datum
  /// Exactly matches Web Admin `SCHOOL_GROUND_CENTER` & Backend `SCHOOL_GROUND_OVAL_CENTER`
  static const LatLng evacuationOvalCenter = LatLng(6.2879084, 124.9676961);

  /// Official Evacuation Assembly Area Name
  static const String evacuationOvalName = 'School Ground (Central Evacuation Oval)';

  /// Campus Radius Boundary in Meters (Guard threshold for off-campus coordinates)
  static const double campusRadiusMeters = 350.0;

  /// Arrival Proximity Threshold in Meters (Within Oval or Assembly Perimeter)
  static const double arrivalProximityMeters = 15.0;

  /// Authoritative Polygon Boundary Coordinates for School Ground (Evacuation Oval)
  /// Matches `assembly_oval` in campusGeoData.ts
  static const List<LatLng> evacuationOvalPolygon = [
    LatLng(6.2878880, 124.9675419),
    LatLng(6.2877691, 124.9677654),
    LatLng(6.2879288, 124.9678502),
    LatLng(6.2880477, 124.9676268),
    LatLng(6.2878880, 124.9675419),
  ];
}
