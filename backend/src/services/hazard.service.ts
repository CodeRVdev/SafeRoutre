import pool from '../config/db';

export interface PointGeoJSONGeometry {
  type: 'Point';
  coordinates: [number, number];
}

export interface CreateHazardData {
  type: string;
  description: string;
  location: PointGeoJSONGeometry;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  reported_by: number;
  photo_url?: string | null;
}

export class HazardService {
  /**
   * Validates a GeoJSON Point geometry object.
   * Ensures coordinates form a valid WGS84 point.
   */
  static validatePointGeometry(geometry: any): void {
    if (!geometry || typeof geometry !== 'object') {
      throw new Error('Invalid location input: Location must be a valid GeoJSON object.');
    }

    if (geometry.type !== 'Point') {
      throw new Error(`Invalid location geometry type '${geometry.type}'. Expected 'Point'.`);
    }

    if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2) {
      throw new Error('Invalid Point coordinates: Must contain a [longitude, latitude] pair.');
    }

    const [lng, lat] = geometry.coordinates;
    if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
      throw new Error('Invalid coordinate values: Longitude and latitude must be valid numbers.');
    }

    if (lng < -180 || lng > 180) {
      throw new Error(`Invalid longitude value ${lng}. Must be between -180 and 180 degrees.`);
    }

    if (lat < -90 || lat > 90) {
      throw new Error(`Invalid latitude value ${lat}. Must be between -90 and 90 degrees.`);
    }
  }

  /**
   * Fetches all active hazards formatted as a GeoJSON FeatureCollection.
   */
  static async getActiveHazards() {
    const result = await pool.query(`
      SELECT 
        hazard_id,
        type,
        description,
        ST_AsGeoJSON(location)::json AS location,
        severity,
        reported_by,
        status,
        photo_url,
        created_at,
        resolved_at
      FROM hazards
      WHERE status = 'active'
      ORDER BY hazard_id DESC;
    `);

    const features = result.rows.map((row) => ({
      type: 'Feature',
      id: row.hazard_id,
      geometry: row.location,
      properties: {
        hazard_id: row.hazard_id,
        type: row.type,
        description: row.description,
        severity: row.severity,
        reported_by: row.reported_by,
        status: row.status,
        photo_url: row.photo_url || null,
        created_at: row.created_at,
        resolved_at: row.resolved_at,
      },
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  }

  /**
   * Finds a hazard by ID.
   */
  static async getHazardById(hazardId: number) {
    const result = await pool.query(
      `SELECT hazard_id, type, description, ST_AsGeoJSON(location)::json AS location, severity, reported_by, status, photo_url, created_at, resolved_at
       FROM hazards WHERE hazard_id = $1`,
      [hazardId]
    );

    if (result.rows.length === 0) return null;
    const row = result.rows[0];

    return {
      type: 'Feature',
      id: row.hazard_id,
      geometry: row.location,
      properties: {
        hazard_id: row.hazard_id,
        type: row.type,
        description: row.description,
        severity: row.severity,
        reported_by: row.reported_by,
        status: row.status,
        photo_url: row.photo_url || null,
        created_at: row.created_at,
        resolved_at: row.resolved_at,
      },
    };
  }

  /**
   * Creates a new hazard record in PostGIS.
   */
  static async createHazard(data: CreateHazardData) {
    this.validatePointGeometry(data.location);

    const geojsonStr = JSON.stringify(data.location);
    const photoUrl = data.photo_url || null;

    const result = await pool.query(
      `INSERT INTO hazards (type, description, location, severity, reported_by, status, photo_url)
       VALUES ($1, $2, ST_GeomFromGeoJSON($3), $4, $5, 'active', $6)
       RETURNING hazard_id, type, description, ST_AsGeoJSON(location)::json AS location, severity, reported_by, status, photo_url, created_at, resolved_at`,
      [data.type, data.description, geojsonStr, data.severity, data.reported_by, photoUrl]
    );

    const row = result.rows[0];
    return {
      type: 'Feature',
      id: row.hazard_id,
      geometry: row.location,
      properties: {
        hazard_id: row.hazard_id,
        type: row.type,
        description: row.description,
        severity: row.severity,
        reported_by: row.reported_by,
        status: row.status,
        photo_url: row.photo_url || null,
        created_at: row.created_at,
        resolved_at: row.resolved_at,
      },
    };
  }

  /**
   * Marks a hazard as resolved, setting resolved_at timestamp.
   */
  static async resolveHazard(hazardId: number) {
    const result = await pool.query(
      `UPDATE hazards
       SET status = 'resolved', resolved_at = NOW()
       WHERE hazard_id = $1
       RETURNING hazard_id, type, description, ST_AsGeoJSON(location)::json AS location, severity, reported_by, status, photo_url, created_at, resolved_at`,
      [hazardId]
    );

    if (result.rows.length === 0) return null;
    const row = result.rows[0];

    return {
      type: 'Feature',
      id: row.hazard_id,
      geometry: row.location,
      properties: {
        hazard_id: row.hazard_id,
        type: row.type,
        description: row.description,
        severity: row.severity,
        reported_by: row.reported_by,
        status: row.status,
        photo_url: row.photo_url || null,
        created_at: row.created_at,
        resolved_at: row.resolved_at,
      },
    };
  }
}
