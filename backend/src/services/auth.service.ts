import pool from '../config/db';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export interface CreateUserData {
  full_name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'coordinator' | 'student' | 'faculty' | 'staff';
  id_number?: string;
  department?: string;
  device_token?: string;
}

export interface UserRecord {
  user_id: number;
  full_name: string;
  email: string;
  password_hash?: string;
  role: string;
  id_number: string | null;
  department: string | null;
  device_token: string | null;
  created_at: Date;
}

const JWT_SECRET = process.env.JWT_SECRET || 'saferoute_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export class AuthService {
  static async findUserByEmail(email: string): Promise<UserRecord | null> {
    const result = await pool.query(
      `SELECT user_id, full_name, email, password_hash, role, id_number, department, device_token, created_at
       FROM users WHERE LOWER(email) = LOWER($1)`,
      [email]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async findUserById(userId: number): Promise<UserRecord | null> {
    const result = await pool.query(
      `SELECT user_id, full_name, email, role, id_number, department, device_token, created_at
       FROM users WHERE user_id = $1`,
      [userId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async createUser(userData: CreateUserData): Promise<UserRecord> {
    const { full_name, email, password_hash, role, id_number, department, device_token } = userData;
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, id_number, department, device_token)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING user_id, full_name, email, role, id_number, department, device_token, created_at`,
      [full_name, email.toLowerCase(), password_hash, role, id_number || null, department || null, device_token || null]
    );
    return result.rows[0];
  }

  static generateToken(userId: number, role: string): string {
    return jwt.sign(
      { user_id: userId, role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );
  }

  static verifyToken(token: string): { user_id: number; role: string } {
    return jwt.verify(token, JWT_SECRET) as { user_id: number; role: string };
  }

  static async updateDeviceToken(userId: number, deviceToken: string, platform = 'android'): Promise<boolean> {
    const trimmedToken = deviceToken.trim();
    if (!trimmedToken) return false;

    // 1. Maintain backwards-compatible legacy column on users table
    await pool.query(
      `UPDATE users SET device_token = $1 WHERE user_id = $2`,
      [trimmedToken, userId]
    );

    // 2. Upsert into user_device_tokens table to support multiple devices per user
    const result = await pool.query(
      `INSERT INTO user_device_tokens (user_id, device_token, platform, last_used_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (device_token)
       DO UPDATE SET user_id = EXCLUDED.user_id, platform = EXCLUDED.platform, last_used_at = NOW()
       RETURNING token_id`,
      [userId, trimmedToken, platform]
    );

    return (result.rowCount ?? 0) > 0;
  }

  static async removeDeviceToken(userId: number, deviceToken?: string): Promise<boolean> {
    if (deviceToken && deviceToken.trim() !== '') {
      const trimmedToken = deviceToken.trim();
      await pool.query(
        `DELETE FROM user_device_tokens WHERE device_token = $1 AND user_id = $2`,
        [trimmedToken, userId]
      );
      await pool.query(
        `UPDATE users SET device_token = NULL WHERE user_id = $1 AND device_token = $2`,
        [userId, trimmedToken]
      );
    } else {
      await pool.query(`DELETE FROM user_device_tokens WHERE user_id = $1`, [userId]);
      await pool.query(`UPDATE users SET device_token = NULL WHERE user_id = $1`, [userId]);
    }
    return true;
  }

  static async removeInvalidTokens(invalidTokens: string[]): Promise<void> {
    if (!invalidTokens || invalidTokens.length === 0) return;
    try {
      await pool.query(
        `DELETE FROM user_device_tokens WHERE device_token = ANY($1::text[])`,
        [invalidTokens]
      );
      await pool.query(
        `UPDATE users SET device_token = NULL WHERE device_token = ANY($1::text[])`,
        [invalidTokens]
      );
    } catch (err) {
      console.error('Error removing invalid device tokens:', err);
    }
  }
}
