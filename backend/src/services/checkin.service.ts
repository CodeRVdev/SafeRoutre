import pool from '../config/db';
import { HazardService } from './hazard.service';

export interface CreateCheckinData {
  alert_id: number;
  user_id: number;
  zone_id?: number;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  status?: 'safe' | 'need_help' | 'injured';
  message?: string;
}

export class CheckinService {
  /**
   * Creates a safety check-in for a user during an emergency alert.
   */
  static async createCheckin(data: CreateCheckinData) {
    if (data.location) {
      HazardService.validatePointGeometry(data.location);
    }

    const geojsonLocation = data.location ? JSON.stringify(data.location) : null;
    const status = data.status || 'safe';
    const message = data.message || null;

    const result = await pool.query(
      `INSERT INTO checkins (alert_id, user_id, zone_id, location, status, message)
       VALUES ($1, $2, $3, CASE WHEN $4::text IS NOT NULL THEN ST_GeomFromGeoJSON($4) ELSE NULL END, $5, $6)
       RETURNING checkin_id, alert_id, user_id, zone_id, checked_in_at, ST_AsGeoJSON(location)::json AS location, status, message`,
      [data.alert_id, data.user_id, data.zone_id || null, geojsonLocation, status, message]
    );

    const row = result.rows[0];

    // Fetch user and zone details to enrich checkin object for socket emission
    const details = await pool.query(
      `SELECT u.full_name, u.email, u.role, u.department, z.name AS zone_name
       FROM users u
       LEFT JOIN zones z ON z.zone_id = $2
       WHERE u.user_id = $1`,
      [data.user_id, data.zone_id || null]
    );

    const userDetails = details.rows[0] || {};

    return {
      checkin_id: row.checkin_id,
      alert_id: row.alert_id,
      user_id: row.user_id,
      full_name: userDetails.full_name,
      user_name: userDetails.full_name,
      user_email: userDetails.email,
      role: userDetails.role,
      department: userDetails.department,
      zone_id: row.zone_id,
      zone_name: userDetails.zone_name || null,
      checked_in_at: row.checked_in_at,
      location: row.location,
      latitude: row.location?.coordinates?.[1] ?? null,
      longitude: row.location?.coordinates?.[0] ?? null,
      status: row.status,
      message: row.message,
    };
  }

  /**
   * Retrieves all check-ins submitted by a specific user across all alerts/drills.
   */
  static async getMyCheckins(userId: number) {
    const result = await pool.query(
      `SELECT 
        c.checkin_id,
        c.alert_id,
        c.user_id,
        u.full_name,
        u.email,
        u.role,
        u.id_number,
        u.department,
        c.zone_id,
        COALESCE(z.name, a.title, 'Campus Evacuation Point') AS zone_name,
        c.checked_in_at,
        c.status,
        c.message,
        a.title AS alert_title,
        ST_AsGeoJSON(c.location)::json AS location
       FROM checkins c
       JOIN users u ON c.user_id = u.user_id
       LEFT JOIN zones z ON c.zone_id = z.zone_id
       LEFT JOIN alerts a ON c.alert_id = a.alert_id
       WHERE c.user_id = $1
       ORDER BY c.checked_in_at DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Fetches real-time check-in status for live coordinator dashboard.
   */
  static async getDashboardCheckinStatus(alertId: number) {
    // Total users registered in system
    const totalUsersResult = await pool.query(`SELECT COUNT(*)::int AS count FROM users`);
    const total_expected_users = totalUsersResult.rows[0]?.count || 0;

    // Checked in users list
    const checkedInResult = await pool.query(
      `SELECT 
        c.checkin_id,
        c.alert_id,
        c.user_id,
        u.full_name,
        u.email,
        u.role,
        u.id_number,
        u.department,
        c.zone_id,
        z.name AS zone_name,
        c.checked_in_at,
        c.status,
        c.message,
        ST_AsGeoJSON(c.location)::json AS location
       FROM checkins c
       JOIN users u ON c.user_id = u.user_id
       LEFT JOIN zones z ON c.zone_id = z.zone_id
       WHERE c.alert_id = $1
       ORDER BY c.checked_in_at DESC`,
      [alertId]
    );

    const checked_in_users = checkedInResult.rows;
    const checked_in_count = checked_in_users.length;

    // Missing (not yet checked in) users
    const missingUsersResult = await pool.query(
      `SELECT user_id, full_name, email, role, id_number, department
       FROM users
       WHERE user_id NOT IN (
         SELECT user_id FROM checkins WHERE alert_id = $1
       )
       ORDER BY full_name ASC`,
      [alertId]
    );

    const missing_users = missingUsersResult.rows;

    return {
      alert_id: alertId,
      total_expected_users,
      checked_in_count,
      missing_count: missing_users.length,
      checked_in_users,
      missing_users,
    };
  }

  /**
   * Fetches real-time capacity and occupancy metrics for evacuation centers for a specific alert.
   */
  static async getEvacuationCapacity(alertId: number) {
    const result = await pool.query(
      `SELECT 
        z.zone_id,
        z.name AS zone_name,
        z.type AS zone_type,
        COALESCE(z.capacity, 100)::int AS max_capacity,
        COUNT(c.checkin_id)::int AS current_occupancy,
        ROUND((COUNT(c.checkin_id)::decimal / GREATEST(COALESCE(z.capacity, 100), 1)) * 100, 1)::float AS percentage_full,
        (COUNT(c.checkin_id) >= COALESCE(z.capacity, 100)) AS is_full
       FROM zones z
       LEFT JOIN checkins c ON z.zone_id = c.zone_id AND c.alert_id = $1
       GROUP BY z.zone_id, z.name, z.type, z.capacity
       ORDER BY z.zone_id ASC`,
      [alertId]
    );

    return result.rows;
  }

  /**
   * Checks if a zone is at full capacity and finds an alternative zone with available space.
   */
  static async checkZoneCapacityWarning(zoneId: number, alertId: number) {
    const capacities = await this.getEvacuationCapacity(alertId);
    const targetZone = capacities.find((c) => c.zone_id === zoneId);

    if (!targetZone) return null;

    if (targetZone.is_full) {
      const alternative = capacities.find((c) => !c.is_full && c.zone_id !== zoneId);
      return {
        is_full: true,
        zone_name: targetZone.zone_name,
        current_occupancy: targetZone.current_occupancy,
        max_capacity: targetZone.max_capacity,
        warning_message: `⚠️ ${targetZone.zone_name} is at full capacity (${targetZone.current_occupancy}/${targetZone.max_capacity}).`,
        suggested_alternative_zone: alternative
          ? {
              zone_id: alternative.zone_id,
              zone_name: alternative.zone_name,
              max_capacity: alternative.max_capacity,
              current_occupancy: alternative.current_occupancy,
            }
          : null,
      };
    }

    return null;
  }
}
