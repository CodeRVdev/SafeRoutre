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
      type: 'Feature' as const,
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
   * Updates an existing hazard record.
   */
  static async updateHazard(
    hazardId: number,
    data: {
      type?: string;
      description?: string;
      location?: PointGeoJSONGeometry;
      severity?: 'low' | 'moderate' | 'high' | 'critical';
      photo_url?: string | null;
      status?: 'active' | 'resolved';
    }
  ) {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.type !== undefined) {
      if (typeof data.type !== 'string' || data.type.trim().length === 0) {
        throw new Error('Field "type" must be a non-empty string.');
      }
      fields.push(`type = $${paramIndex++}`);
      values.push(data.type.trim());
    }

    if (data.description !== undefined) {
      if (typeof data.description !== 'string' || data.description.trim().length === 0) {
        throw new Error('Field "description" must be a non-empty string.');
      }
      fields.push(`description = $${paramIndex++}`);
      values.push(data.description.trim());
    }

    if (data.location !== undefined) {
      this.validatePointGeometry(data.location);
      fields.push(`location = ST_GeomFromGeoJSON($${paramIndex++})`);
      values.push(JSON.stringify(data.location));
    }

    if (data.severity !== undefined) {
      const valid = ['low', 'moderate', 'high', 'critical'];
      if (!valid.includes(data.severity.toLowerCase())) {
        throw new Error(`Field "severity" must be one of: ${valid.join(', ')}.`);
      }
      fields.push(`severity = $${paramIndex++}`);
      values.push(data.severity.toLowerCase());
    }

    if (data.photo_url !== undefined) {
      fields.push(`photo_url = $${paramIndex++}`);
      values.push(data.photo_url);
    }

    if (data.status !== undefined) {
      const validStatus = ['active', 'resolved'];
      if (!validStatus.includes(data.status.toLowerCase())) {
        throw new Error(`Field "status" must be one of: ${validStatus.join(', ')}.`);
      }
      fields.push(`status = $${paramIndex++}`);
      values.push(data.status.toLowerCase());
      if (data.status.toLowerCase() === 'resolved') {
        fields.push(`resolved_at = NOW()`);
      } else if (data.status.toLowerCase() === 'active') {
        fields.push(`resolved_at = NULL`);
      }
    }

    if (fields.length === 0) {
      return await this.getHazardById(hazardId);
    }

    values.push(hazardId);
    const query = `
      UPDATE hazards
      SET ${fields.join(', ')}
      WHERE hazard_id = $${paramIndex}
      RETURNING hazard_id, type, description, ST_AsGeoJSON(location)::json AS location, severity, reported_by, status, photo_url, created_at, resolved_at
    `;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      type: 'Feature' as const,
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
   * Deactivates an active hazard (status = 'resolved'), preserving foreign key references and history.
   */
  static async deleteHazard(hazardId: number) {
    return this.resolveHazard(hazardId);
  }
}

