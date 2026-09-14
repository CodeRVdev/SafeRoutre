import pool from '../config/db';

export interface ActivityLogRecord {
  log_id: number;
  user_id: number | null;
  user_full_name: string | null;
  user_email: string | null;
  user_role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  details: any;
  ip_address: string | null;
  created_at: Date;
}

export interface ActivityLogFilters {
  search?: string;
  action?: string;
  userId?: number;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export class ActivityLogService {
  /**
   * Records a new activity log entry in database.
   */
  static async logActivity(
    userId: number | null,
    action: string,
    entityType?: string,
    entityId?: number,
    details?: Record<string, any>,
    ipAddress?: string
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          action,
          entityType || null,
          entityId || null,
          details ? JSON.stringify(details) : null,
          ipAddress || null,
        ]
      );
    } catch (error) {
      console.error('❌ Failed to log activity to database:', error);
    }
  }

  /**
   * Retrieves paginated activity logs with optional filtering.
   */
  static async getActivityLogs(filters: ActivityLogFilters) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 15));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.action && filters.action.trim() !== '' && filters.action !== 'all') {
      conditions.push(`al.action = $${paramIndex++}`);
      values.push(filters.action.trim());
    }

    if (filters.userId && !isNaN(filters.userId)) {
      conditions.push(`al.user_id = $${paramIndex++}`);
      values.push(filters.userId);
    }

    if (filters.search && filters.search.trim() !== '') {
      conditions.push(
        `(u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR al.action ILIKE $${paramIndex} OR al.entity_type ILIKE $${paramIndex})`
      );
      values.push(`%${filters.search.trim()}%`);
      paramIndex++;
    }

    if (filters.from && filters.from.trim() !== '') {
      conditions.push(`al.created_at >= $${paramIndex++}`);
      values.push(filters.from.trim());
    }

    if (filters.to && filters.to.trim() !== '') {
      conditions.push(`al.created_at <= $${paramIndex++}`);
      values.push(filters.to.trim());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query Total Count
    const countSql = `
      SELECT COUNT(*) AS total
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      ${whereClause};
    `;
    const countResult = await pool.query(countSql, values);
    const total = parseInt(countResult.rows[0].total, 10);

    // Query Log Records
    const dataSql = `
      SELECT 
        al.log_id,
        al.user_id,
        u.full_name AS user_full_name,
        u.email AS user_email,
        u.role AS user_role,
        al.action,
        al.entity_type,
        al.entity_id,
        al.details,
        al.ip_address,
        al.created_at
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++};
    `;

    const dataResult = await pool.query(dataSql, [...values, limit, offset]);

    return {
      logs: dataResult.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
