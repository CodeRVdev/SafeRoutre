import pool from '../config/db';

export interface CreateAlertData {
  hazard_id?: number;
  title: string;
  message: string;
  sent_by: number;
  is_drill?: boolean;
}

export class AlertService {
  /**
   * Creates a new emergency alert or drill.
   */
  static async createAlert(data: CreateAlertData) {
    const result = await pool.query(
      `INSERT INTO alerts (hazard_id, title, message, sent_by, is_active, is_drill)
       VALUES ($1, $2, $3, $4, TRUE, $5)
       RETURNING alert_id, hazard_id, title, message, sent_by, sent_at, is_active, is_drill`,
      [data.hazard_id || null, data.title, data.message, data.sent_by, data.is_drill ?? false]
    );
    return result.rows[0];
  }

  /**
   * Fetches all active alerts (`is_active = TRUE`).
   */
  static async getActiveAlerts() {
    const result = await pool.query(`
      SELECT 
        a.alert_id,
        a.hazard_id,
        a.title,
        a.message,
        a.sent_by,
        u.full_name AS sent_by_name,
        a.sent_at,
        a.is_active,
        a.is_drill,
        ST_AsGeoJSON(h.location)::json AS hazard_location
      FROM alerts a
      LEFT JOIN users u ON a.sent_by = u.user_id
      LEFT JOIN hazards h ON a.hazard_id = h.hazard_id
      WHERE a.is_active = TRUE
      ORDER BY a.sent_at DESC;
    `);
    return result.rows;
  }

  /**
   * Finds an alert by ID.
   */
  static async getAlertById(alertId: number) {
    const result = await pool.query(
      `SELECT alert_id, hazard_id, title, message, sent_by, sent_at, is_active, is_drill
       FROM alerts WHERE alert_id = $1`,
      [alertId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Deactivates an emergency alert.
   */
  static async deactivateAlert(alertId: number) {
    const result = await pool.query(
      `UPDATE alerts
       SET is_active = FALSE
       WHERE alert_id = $1
       RETURNING alert_id, hazard_id, title, message, sent_by, sent_at, is_active, is_drill`,
      [alertId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Fetches all registered device tokens for active users across all their devices.
   */
  static async getActiveUserDeviceTokens(): Promise<string[]> {
    const result = await pool.query(`
      SELECT DISTINCT device_token FROM (
        SELECT udt.device_token 
        FROM user_device_tokens udt
        JOIN users u ON udt.user_id = u.user_id
        WHERE udt.device_token IS NOT NULL AND udt.device_token != '' AND u.is_active = TRUE
        UNION
        SELECT u.device_token 
        FROM users u 
        WHERE u.device_token IS NOT NULL AND u.device_token != '' AND u.is_active = TRUE
      ) AS all_tokens;
    `);
    return result.rows.map((row) => row.device_token);
  }
}
