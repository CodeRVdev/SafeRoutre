import pool from '../config/db';

export class ReportService {
  /**
   * Generates and saves an evacuation report for a given alert_id.
   */
  static async generateEvacuationReport(alertId: number) {
    // 1. Calculate total active users
    const totalUsersRes = await pool.query(`SELECT COUNT(*)::int AS total FROM users`);
    const total_users = totalUsersRes.rows[0]?.total || 0;

    // 2. Calculate unique checked-in users count for this alert
    const checkedInRes = await pool.query(
      `SELECT COUNT(DISTINCT user_id)::int AS count FROM checkins WHERE alert_id = $1`,
      [alertId]
    );
    const checked_in_count = checkedInRes.rows[0]?.count || 0;

    // 3. Insert into evacuation_reports table
    const result = await pool.query(
      `INSERT INTO evacuation_reports (alert_id, total_users, checked_in_count)
       VALUES ($1, $2, $3)
       RETURNING report_id, alert_id, total_users, checked_in_count, generated_at`,
      [alertId, total_users, checked_in_count]
    );

    return result.rows[0];
  }

  /**
   * Retrieves generated evacuation report for a given alert_id.
   */
  static async getReportByAlertId(alertId: number) {
    const result = await pool.query(
      `SELECT report_id, alert_id, total_users, checked_in_count, generated_at
       FROM evacuation_reports
       WHERE alert_id = $1
       ORDER BY generated_at DESC
       LIMIT 1`,
      [alertId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }
}
