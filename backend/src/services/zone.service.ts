import pool from '../config/db';

export interface ZoneGeoJSONGeometry {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface CreateZoneData {
  name: string;
  type: 'safe_zone' | 'evacuation_point';
  geometry: ZoneGeoJSONGeometry;
  created_by: number;
}

export interface UpdateZoneData {
  name?: string;
  type?: 'safe_zone' | 'evacuation_point';
  geometry?: ZoneGeoJSONGeometry;
}

export class ZoneService {
  /**
   * Validates a GeoJSON Polygon geometry object.
   * Ensures coordinates form a valid closed loop WGS84 polygon.
   */
  static validatePolygonGeometry(geometry: any): void {
    if (!geometry || typeof geometry !== 'object') {
      throw new Error('Invalid geometry input: Geometry must be a valid GeoJSON object.');
    }

    if (geometry.type !== 'Polygon') {
      throw new Error(`Invalid geometry type '${geometry.type}'. Expected 'Polygon'.`);
    }

    if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
      throw new Error('Invalid Polygon coordinates: Must contain at least one linear ring array.');
    }

    const outerRing = geometry.coordinates[0];
    if (!Array.isArray(outerRing) || outerRing.length < 4) {
      throw new Error('Invalid Polygon outer ring: Must contain at least 4 coordinate pairs.');
    }

    // Verify WGS84 bounds & ring closure
    for (const point of outerRing) {
      if (!Array.isArray(point) || point.length < 2) {
        throw new Error('Invalid coordinate point: Each coordinate must be a [longitude, latitude] array.');
      }
      const [lng, lat] = point;
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

    const firstPoint = outerRing[0];
    const lastPoint = outerRing[outerRing.length - 1];
    if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
      throw new Error('Invalid Polygon geometry: The first and last coordinates of the linear ring must be identical to close the polygon.');
    }
  }

  /**
   * Fetches all zones formatted as a GeoJSON FeatureCollection.
   */
  static async getAllZones() {
    const result = await pool.query(`
      SELECT 
        zone_id,
        name,
        type,
        ST_AsGeoJSON(geom)::json AS geometry,
        created_by,
        created_at
      FROM zones
      ORDER BY zone_id ASC;
    `);

    const features = result.rows.map((row) => ({
      type: 'Feature',
      id: row.zone_id,
      geometry: row.geometry,
      properties: {
        zone_id: row.zone_id,
        name: row.name,
        type: row.type,
        created_by: row.created_by,
        created_at: row.created_at,
      },
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  }

  /**
   * Finds a zone by ID.
   */
  static async getZoneById(zoneId: number) {
    const result = await pool.query(
      `SELECT zone_id, name, type, ST_AsGeoJSON(geom)::json AS geometry, created_by, created_at
       FROM zones WHERE zone_id = $1`,
      [zoneId]
    );

    if (result.rows.length === 0) return null;
    const row = result.rows[0];

    return {
      type: 'Feature',
      id: row.zone_id,
      geometry: row.geometry,
      properties: {
        zone_id: row.zone_id,
        name: row.name,
        type: row.type,
        created_by: row.created_by,
        created_at: row.created_at,
      },
    };
  }

  /**
   * Creates a new zone in PostGIS.
   */
  static async createZone(data: CreateZoneData) {
    this.validatePolygonGeometry(data.geometry);

    const geojsonStr = JSON.stringify(data.geometry);

    const result = await pool.query(
      `INSERT INTO zones (name, type, geom, created_by)
       VALUES ($1, $2, ST_GeomFromGeoJSON($3), $4)
       RETURNING zone_id, name, type, ST_AsGeoJSON(geom)::json AS geometry, created_by, created_at`,
      [data.name, data.type, geojsonStr, data.created_by]
    );

    const row = result.rows[0];
    return {
      type: 'Feature',
      id: row.zone_id,
      geometry: row.geometry,
      properties: {
        zone_id: row.zone_id,
        name: row.name,
        type: row.type,
        created_by: row.created_by,
        created_at: row.created_at,
      },
    };
  }

  /**
   * Updates an existing zone.
   */
  static async updateZone(zoneId: number, data: UpdateZoneData) {
    const existing = await this.getZoneById(zoneId);
    if (!existing) return null;

    if (data.geometry) {
      this.validatePolygonGeometry(data.geometry);
    }

    const name = data.name !== undefined ? data.name : existing.properties.name;
    const type = data.type !== undefined ? data.type : existing.properties.type;
    const geojsonStr = data.geometry ? JSON.stringify(data.geometry) : JSON.stringify(existing.geometry);

    const result = await pool.query(
      `UPDATE zones
       SET name = $1, type = $2, geom = ST_GeomFromGeoJSON($3)
       WHERE zone_id = $4
       RETURNING zone_id, name, type, ST_AsGeoJSON(geom)::json AS geometry, created_by, created_at`,
      [name, type, geojsonStr, zoneId]
    );

    const row = result.rows[0];
    return {
      type: 'Feature',
      id: row.zone_id,
      geometry: row.geometry,
      properties: {
        zone_id: row.zone_id,
        name: row.name,
        type: row.type,
        created_by: row.created_by,
        created_at: row.created_at,
      },
    };
  }

  /**
   * Deletes a zone by ID.
   */
  static async deleteZone(zoneId: number): Promise<boolean> {
    const result = await pool.query(`DELETE FROM zones WHERE zone_id = $1 RETURNING zone_id`, [zoneId]);
    return (result.rowCount ?? 0) > 0;
  }
}
