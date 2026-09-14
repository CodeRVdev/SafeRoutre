import pool from '../config/db';
import { AlertService } from './alert.service';
import { ActivityLogService } from './activitylog.service';
import { emitAlertBroadcast } from '../socket';

export interface CreateDrillData {
  title: string;
  description?: string;
  scheduled_date: string | Date;
  created_by?: number;
}

export class DrillService {
  /**
   * Fetches drills scheduled in the next 30 days.
   */
  static async getUpcomingDrills() {
    const result = await pool.query(
      `SELECT d.drill_id, d.title, d.description, d.scheduled_date, d.status, d.created_by, d.alert_id, d.created_at,
              u.full_name as creator_name
       FROM scheduled_drills d
       LEFT JOIN users u ON d.created_by = u.user_id
       WHERE d.scheduled_date >= NOW() - INTERVAL '1 day'
         AND d.scheduled_date <= NOW() + INTERVAL '30 days'
       ORDER BY d.scheduled_date ASC`
    );

    return result.rows;
  }

  /**
   * Fetches all scheduled drills with creator details.
   */
  static async getAllDrills() {
    const result = await pool.query(
      `SELECT d.drill_id, d.title, d.description, d.scheduled_date, d.status, d.created_by, d.alert_id, d.created_at,
              u.full_name as creator_name,
              a.is_active as is_alert_active
       FROM scheduled_drills d
       LEFT JOIN users u ON d.created_by = u.user_id
       LEFT JOIN alerts a ON d.alert_id = a.alert_id
       ORDER BY d.scheduled_date DESC`
    );

    return result.rows;
  }

  /**
   * Gets a specific drill by ID with performance metrics if completed.
   */
  static async getDrillById(drillId: number) {
    const drillRes = await pool.query(
      `SELECT d.drill_id, d.title, d.description, d.scheduled_date, d.status, d.created_by, d.alert_id, d.created_at,
              u.full_name as creator_name,
              a.sent_at as alert_started_at, a.is_active as is_alert_active
       FROM scheduled_drills d
       LEFT JOIN users u ON d.created_by = u.user_id
       LEFT JOIN alerts a ON d.alert_id = a.alert_id
       WHERE d.drill_id = $1`,
      [drillId]
    );

    const drill = drillRes.rows[0];
    if (!drill) return null;

    let metrics = null;

    if (drill.alert_id) {
      // Calculate drill performance statistics
      const totalUsersRes = await pool.query(`SELECT COUNT(*) FROM users WHERE is_active = TRUE AND role IN ('student', 'faculty', 'staff')`);
      const totalUsers = parseInt(totalUsersRes.rows[0]?.count || '0', 10);

      const checkinsRes = await pool.query(
        `SELECT COUNT(DISTINCT user_id) as count,
                MIN(checked_in_at) as first_checkin,
                MAX(checked_in_at) as last_checkin
         FROM checkins WHERE alert_id = $1`,
        [drill.alert_id]
      );

      const checkedInCount = parseInt(checkinsRes.rows[0]?.count || '0', 10);
      const completionRate = totalUsers > 0 ? Math.round((checkedInCount / totalUsers) * 100) : 0;
      const missingCount = Math.max(0, totalUsers - checkedInCount);

      let durationMinutes = 0;
      if (drill.alert_started_at) {
        const startTime = new Date(drill.alert_started_at).getTime();
        const endTime = checkinsRes.rows[0]?.last_checkin ? new Date(checkinsRes.rows[0].last_checkin).getTime() : Date.now();
        durationMinutes = Math.max(1, Math.round((endTime - startTime) / 60000));
      }

      metrics = {
        total_expected: totalUsers,
        checked_in_count: checkedInCount,
        missing_count: missingCount,
        completion_rate_percent: completionRate,
        duration_minutes: durationMinutes,
      };
    }

    return {
      ...drill,
      metrics,
    };
  }

  /**
   * Creates a new scheduled evacuation drill.
   */
  static async createDrill(data: CreateDrillData) {
    const result = await pool.query(
      `INSERT INTO scheduled_drills (title, description, scheduled_date, status, created_by)
       VALUES ($1, $2, $3, 'scheduled', $4)
       RETURNING drill_id, title, description, scheduled_date, status, created_by, created_at`,
      [data.title, data.description || null, data.scheduled_date, data.created_by || null]
    );

    return result.rows[0];
  }

  /**
   * Updates an existing scheduled drill.
   */
  static async updateDrill(drillId: number, data: Partial<CreateDrillData & { status?: string }>) {
    const existing = await this.getDrillById(drillId);
    if (!existing) return null;

    const title = data.title !== undefined ? data.title : existing.title;
    const description = data.description !== undefined ? data.description : existing.description;
    const scheduled_date = data.scheduled_date !== undefined ? data.scheduled_date : existing.scheduled_date;
    const status = data.status !== undefined ? data.status : existing.status;

    const result = await pool.query(
      `UPDATE scheduled_drills
       SET title = $1, description = $2, scheduled_date = $3, status = $4
       WHERE drill_id = $5
       RETURNING drill_id, title, description, scheduled_date, status, created_by, alert_id, created_at`,
      [title, description, scheduled_date, status, drillId]
    );

    return result.rows[0];
  }

  /**
   * Deletes a scheduled drill.
   */
  static async deleteDrill(drillId: number): Promise<boolean> {
    const result = await pool.query(`DELETE FROM scheduled_drills WHERE drill_id = $1 RETURNING drill_id`, [drillId]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Starts a drill live exercise now:
   * 1. Creates a drill alert (`is_drill: true`)
   * 2. Links alert_id to scheduled drill and sets status to 'in_progress'
   * 3. Broadcasts over Socket.IO & logs audit trail
   */
  static async startDrillNow(drillId: number, userId: number) {
    const drill = await this.getDrillById(drillId);
    if (!drill) throw new Error('Scheduled drill not found.');

    // 1. Create drill alert
    const alert = await AlertService.createAlert({
      title: `[DRILL] ${drill.title}`,
      message: drill.description || 'PRACTICE DRILL: All campus personnel please practice immediate safe evacuation to your assigned assembly points.',
      sent_by: userId,
      is_drill: true,
    });

    // 2. Link alert and update status
    const updated = await pool.query(
      `UPDATE scheduled_drills
       SET alert_id = $1, status = 'in_progress'
       WHERE drill_id = $2
       RETURNING drill_id, title, description, scheduled_date, status, created_by, alert_id, created_at`,
      [alert.alert_id, drillId]
    );

    // 3. Socket broadcast & activity log
    emitAlertBroadcast(alert);
    ActivityLogService.logActivity(userId, 'DRILL_STARTED', 'drill', drillId, { title: drill.title, alert_id: alert.alert_id });

    return {
      drill: updated.rows[0],
      alert,
    };
  }

  /**
   * Marks a drill exercise as completed and calculates final metrics.
   */
  static async completeDrill(drillId: number) {
    const drill = await this.getDrillById(drillId);
    if (!drill) throw new Error('Scheduled drill not found.');

    if (drill.alert_id) {
      await AlertService.deactivateAlert(drill.alert_id);
    }

    const updated = await pool.query(
      `UPDATE scheduled_drills
       SET status = 'completed'
       WHERE drill_id = $1
       RETURNING drill_id, title, description, scheduled_date, status, created_by, alert_id, created_at`,
      [drillId]
    );

    const fullDrillDetails = await this.getDrillById(drillId);
    return fullDrillDetails;
  }
}
