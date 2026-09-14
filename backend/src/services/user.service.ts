import pool from '../config/db';

export interface GetUsersQueryOptions {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}

export class UserService {
  /**
   * Fetch paginated list of users with optional search and role filters.
   */
  static async getUsers(options: GetUsersQueryOptions) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 10));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];

    if (options.search && options.search.trim()) {
      params.push(`%${options.search.trim()}%`);
      conditions.push(`(full_name ILIKE $${params.length} OR email ILIKE $${params.length})`);
    }

    if (options.role && options.role.trim() && options.role !== 'all') {
      params.push(options.role.trim());
      conditions.push(`role = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total Count
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM users ${whereClause}`,
      params
    );
    const total = countResult.rows[0]?.count || 0;

    // Paginated Data
    const dataParams = [...params, limit, offset];
    const limitIndex = params.length + 1;
    const offsetIndex = params.length + 2;

    const usersResult = await pool.query(
      `SELECT 
        user_id,
        full_name,
        email,
        role,
        id_number,
        department,
        device_token,
        COALESCE(is_active, TRUE) AS is_active,
        created_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
      dataParams
    );

    return {
      users: usersResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Fetch counts of users grouped by role + total users count.
   */
  static async getUserStats() {
    const totalResult = await pool.query(`SELECT COUNT(*)::int AS total FROM users`);
    const roleCountsResult = await pool.query(
      `SELECT role, COUNT(*)::int AS count FROM users GROUP BY role`
    );

    const stats: Record<string, number> = {
      total: totalResult.rows[0]?.total || 0,
      admin: 0,
      coordinator: 0,
      faculty: 0,
      staff: 0,
      student: 0,
    };

    for (const row of roleCountsResult.rows) {
      stats[row.role] = row.count;
    }

    return stats;
  }

  /**
   * Fetch details of a single user along with their check-in history.
   */
  static async getUserById(userId: number) {
    const userResult = await pool.query(
      `SELECT 
        user_id,
        full_name,
        email,
        role,
        id_number,
        department,
        device_token,
        COALESCE(is_active, TRUE) AS is_active,
        created_at
       FROM users
       WHERE user_id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return null;
    }

    const user = userResult.rows[0];

    const checkinsResult = await pool.query(
      `SELECT 
        c.checkin_id,
        c.alert_id,
        a.title AS alert_title,
        c.checked_in_at,
        c.status,
        c.message,
        z.name AS zone_name
       FROM checkins c
       LEFT JOIN alerts a ON c.alert_id = a.alert_id
       LEFT JOIN zones z ON c.zone_id = z.zone_id
       WHERE c.user_id = $1
       ORDER BY c.checked_in_at DESC`,
      [userId]
    );

    return {
      user,
      checkins: checkinsResult.rows,
    };
  }

  /**
   * Update user role.
   */
  static async updateUserRole(userId: number, role: string) {
    const validRoles = ['admin', 'coordinator', 'student', 'faculty', 'staff'];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role. Must be one of [${validRoles.join(', ')}]`);
    }

    const result = await pool.query(
      `UPDATE users
       SET role = $1
       WHERE user_id = $2
       RETURNING user_id, full_name, email, role, id_number, department, COALESCE(is_active, TRUE) AS is_active, created_at`,
      [role, userId]
    );

    return result.rows[0] || null;
  }

  /**
   * Deactivate user (soft-delete).
   */
  static async deactivateUser(userId: number) {
    const result = await pool.query(
      `UPDATE users
       SET is_active = FALSE
       WHERE user_id = $1
       RETURNING user_id, full_name, email, role, is_active`,
      [userId]
    );

    return result.rows[0] || null;
  }
}
