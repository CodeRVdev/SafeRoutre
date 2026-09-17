import pool from '../config/db';
import bcrypt from 'bcryptjs';

export interface GetUsersQueryOptions {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}

export interface CreateUserInput {
  full_name: string;
  email: string;
  password: string;
  role: 'admin' | 'coordinator' | 'student' | 'faculty' | 'staff';
  id_number?: string;
  department?: string;
}

export interface UpdateUserInput {
  full_name?: string;
  email?: string;
  role?: string;
  id_number?: string;
  department?: string;
  is_active?: boolean;
  password?: string;
}

const VALID_ROLES = ['admin', 'coordinator', 'student', 'faculty', 'staff'];

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
   * Helper: Count currently active administrators.
   */
  static async countActiveAdmins(): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin' AND COALESCE(is_active, TRUE) = TRUE`
    );
    return result.rows[0]?.count || 0;
  }

  /**
   * Create a new user (admin only).
   */
  static async createUser(data: CreateUserInput) {
    const { full_name, email, password, role, id_number, department } = data;

    // Validate required fields
    if (!full_name || !email || !password || !role) {
      throw new Error('Missing required fields: full_name, email, password, and role are required.');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('Invalid email address format.');
    }

    // Validate password length
    if (typeof password !== 'string' || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    // Validate role
    const normalizedRole = role.toLowerCase().trim();
    if (!VALID_ROLES.includes(normalizedRole)) {
      throw new Error(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}.`);
    }

    // Check duplicate email
    const existing = await pool.query(
      `SELECT user_id FROM users WHERE LOWER(email) = LOWER($1)`,
      [email.trim()]
    );
    if (existing.rows.length > 0) {
      const err: any = new Error('Email address is already registered.');
      err.statusCode = 409;
      throw err;
    }

    // Hash password with bcryptjs
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const insertResult = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, id_number, department, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING user_id, full_name, email, role, id_number, department, device_token, COALESCE(is_active, TRUE) AS is_active, created_at`,
      [
        full_name.trim(),
        email.trim().toLowerCase(),
        password_hash,
        normalizedRole,
        id_number ? id_number.trim() : null,
        department ? department.trim() : null,
      ]
    );

    return insertResult.rows[0];
  }

  /**
   * Update an existing user with full attribute support and optional password reset.
   */
  static async updateUser(userId: number, data: UpdateUserInput, currentAdminId?: number) {
    // 1. Admin Self-Protection Safeguards
    if (currentAdminId && currentAdminId === userId) {
      if (data.is_active === false) {
        const err: any = new Error('Self-protection error: Administrators cannot deactivate their own account.');
        err.statusCode = 400;
        throw err;
      }
      if (data.role && data.role !== 'admin') {
        const err: any = new Error('Self-protection error: Administrators cannot change their own role away from admin.');
        err.statusCode = 400;
        throw err;
      }
    }

    // 2. Check user existence
    const userResult = await pool.query(
      `SELECT user_id, full_name, email, role, COALESCE(is_active, TRUE) AS is_active FROM users WHERE user_id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return null;
    }

    const currentUser = userResult.rows[0];

    // 3. Last Admin Protection Safeguard
    const isTargetAdmin = currentUser.role === 'admin' && currentUser.is_active;
    const willBeDemoted = data.role && data.role !== 'admin';
    const willBeDeactivated = data.is_active === false;

    if (isTargetAdmin && (willBeDemoted || willBeDeactivated)) {
      const activeAdminCount = await UserService.countActiveAdmins();
      if (activeAdminCount <= 1) {
        const err: any = new Error('Operation blocked: Cannot demote or deactivate the last remaining active administrator.');
        err.statusCode = 400;
        throw err;
      }
    }

    // 4. Validate role if provided
    let normalizedRole: string | undefined = undefined;
    if (data.role !== undefined) {
      normalizedRole = data.role.toLowerCase().trim();
      if (!VALID_ROLES.includes(normalizedRole)) {
        throw new Error(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}.`);
      }
    }

    // 5. Validate and check email if changed
    let normalizedEmail: string | undefined = undefined;
    if (data.email !== undefined) {
      normalizedEmail = data.email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        throw new Error('Invalid email address format.');
      }

      if (normalizedEmail !== currentUser.email.toLowerCase()) {
        const emailCheck = await pool.query(
          `SELECT user_id FROM users WHERE LOWER(email) = LOWER($1) AND user_id != $2`,
          [normalizedEmail, userId]
        );
        if (emailCheck.rows.length > 0) {
          const err: any = new Error('Email address is already registered to another user.');
          err.statusCode = 409;
          throw err;
        }
      }
    }

    // 6. Handle optional password reset
    let newPasswordHash: string | undefined = undefined;
    if (data.password && data.password.trim() !== '') {
      if (data.password.length < 6) {
        throw new Error('New password must be at least 6 characters long.');
      }
      newPasswordHash = await bcrypt.hash(data.password, 10);
    }

    // 7. Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];

    if (data.full_name !== undefined) {
      values.push(data.full_name.trim());
      updates.push(`full_name = $${values.length}`);
    }

    if (normalizedEmail !== undefined) {
      values.push(normalizedEmail);
      updates.push(`email = $${values.length}`);
    }

    if (normalizedRole !== undefined) {
      values.push(normalizedRole);
      updates.push(`role = $${values.length}`);
    }

    if (data.id_number !== undefined) {
      values.push(data.id_number ? data.id_number.trim() : null);
      updates.push(`id_number = $${values.length}`);
    }

    if (data.department !== undefined) {
      values.push(data.department ? data.department.trim() : null);
      updates.push(`department = $${values.length}`);
    }

    if (data.is_active !== undefined) {
      values.push(Boolean(data.is_active));
      updates.push(`is_active = $${values.length}`);
    }

    if (newPasswordHash !== undefined) {
      values.push(newPasswordHash);
      updates.push(`password_hash = $${values.length}`);
    }

    if (updates.length === 0) {
      // Nothing to update, return existing user
      return UserService.getUserById(userId).then(res => res?.user || null);
    }

    values.push(userId);
    const userIdIndex = values.length;

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE user_id = $${userIdIndex}
      RETURNING user_id, full_name, email, role, id_number, department, device_token, COALESCE(is_active, TRUE) AS is_active, created_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Update user role (backwards-compatible admin endpoint).
   */
  static async updateUserRole(userId: number, role: string, currentAdminId?: number) {
    const validRoles = ['admin', 'coordinator', 'student', 'faculty', 'staff'];
    const normalizedRole = role.toLowerCase().trim();
    if (!validRoles.includes(normalizedRole)) {
      throw new Error(`Invalid role. Must be one of [${validRoles.join(', ')}]`);
    }

    return UserService.updateUser(userId, { role: normalizedRole }, currentAdminId);
  }

  /**
   * Deactivate user (soft-delete) with self-protection and last-admin safeguards.
   */
  static async deactivateUser(userId: number, currentAdminId?: number) {
    if (currentAdminId && currentAdminId === userId) {
      const err: any = new Error('Self-protection error: Administrators cannot deactivate their own account.');
      err.statusCode = 400;
      throw err;
    }

    // Check if target user is an active admin
    const userRes = await pool.query(
      `SELECT role, COALESCE(is_active, TRUE) AS is_active FROM users WHERE user_id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      return null;
    }

    const targetUser = userRes.rows[0];
    if (targetUser.role === 'admin' && targetUser.is_active) {
      const activeAdminCount = await UserService.countActiveAdmins();
      if (activeAdminCount <= 1) {
        const err: any = new Error('Operation blocked: Cannot deactivate the last remaining active administrator.');
        err.statusCode = 400;
        throw err;
      }
    }

    const result = await pool.query(
      `UPDATE users
       SET is_active = FALSE
       WHERE user_id = $1
       RETURNING user_id, full_name, email, role, is_active`,
      [userId]
    );

    return result.rows[0] || null;
  }

  /**
   * Reactivate user.
   */
  static async reactivateUser(userId: number) {
    const result = await pool.query(
      `UPDATE users
       SET is_active = TRUE
       WHERE user_id = $1
       RETURNING user_id, full_name, email, role, is_active`,
      [userId]
    );

    return result.rows[0] || null;
  }
}

