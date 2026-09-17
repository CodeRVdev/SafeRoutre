import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthService } from '../services/auth.service';

// Allowed roles for public self-registration per SafeRoute security policy
const PUBLIC_SELF_REGISTER_ROLES = ['student', 'faculty', 'staff'];
const ALL_VALID_ROLES = ['admin', 'coordinator', 'student', 'faculty', 'staff'];

export class AuthController {
  /**
   * POST /api/auth/register
   * Registers a new user account (student, faculty, or staff).
   */
  static async register(req: Request, res: Response) {
    try {
      const { full_name, email, password, role, id_number, department, device_token } = req.body;

      // 1. Basic field validation
      if (!full_name || !email || !password || !role) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: full_name, email, password, and role are required.',
        });
      }

      // 2. Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email address format.',
        });
      }

      // 3. Password length check
      if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long.',
        });
      }

      // 4. Role validation & Self-registration restriction enforcement
      const normalizedRole = role.toLowerCase().trim();
      if (!ALL_VALID_ROLES.includes(normalizedRole)) {
        return res.status(400).json({
          success: false,
          message: `Invalid role specified. Role must be one of: ${ALL_VALID_ROLES.join(', ')}.`,
        });
      }

      // RESTRICTION ENFORCEMENT:
      // Only 'student', 'faculty', and 'staff' are permitted to self-register via this public endpoint.
      // 'admin' and 'coordinator' accounts cannot self-register and must be seeded manually or created by an existing administrator.
      if (!PUBLIC_SELF_REGISTER_ROLES.includes(normalizedRole)) {
        return res.status(400).json({
          success: false,
          message: `Self-registration for '${normalizedRole}' is prohibited. Public registration is restricted to: ${PUBLIC_SELF_REGISTER_ROLES.join(', ')}. Administrative and coordinator accounts must be seeded or created by an admin.`,
        });
      }

      // 5. Check duplicate email
      const existingUser = await AuthService.findUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email address is already registered.',
        });
      }

      // 6. Hash password with bcrypt
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // 7. Store user in database
      const newUser = await AuthService.createUser({
        full_name: full_name.trim(),
        email: email.trim(),
        password_hash,
        role: normalizedRole as any,
        id_number: id_number ? id_number.trim() : undefined,
        department: department ? department.trim() : undefined,
        device_token: device_token ? device_token.trim() : undefined,
      });

      return res.status(201).json({
        success: true,
        message: 'User registered successfully.',
        user: newUser,
      });
    } catch (error) {
      console.error('Error in register controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during registration.',
      });
    }
  }

  /**
   * POST /api/auth/login
   * Authenticates user credentials and returns JWT token + basic user profile.
   */
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required.',
        });
      }

      // 1. Fetch user from database
      const user = await AuthService.findUserByEmail(email);
      if (!user || !user.password_hash) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      // 2. Compare password with stored hash
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      // 3. Verify account is active (not deactivated)
      if (user.is_active === false) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated. Please contact an administrator.',
        });
      }

      // 4. Generate JWT containing user_id and role
      const token = AuthService.generateToken(user.user_id, user.role);

      // 4. Return response without password_hash
      const { password_hash, ...userProfile } = user;

      return res.status(200).json({
        success: true,
        message: 'Login successful.',
        token,
        user: userProfile,
      });
    } catch (error) {
      console.error('Error in login controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during login.',
      });
    }
  }

  /**
   * GET /api/auth/me
   * Fetches currently authenticated user's profile.
   */
  static async getMe(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated.' });
      }

      const user = await AuthService.findUserById(req.user.user_id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User profile not found.' });
      }

      return res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      console.error('Error in getMe controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error fetching user profile.',
      });
    }
  }

  /**
   * POST /api/auth/device-token
   * Registers or updates authenticated user's FCM device token across devices.
   */
  static async updateDeviceToken(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated.' });
      }

      const { device_token, platform } = req.body;
      if (!device_token || typeof device_token !== 'string' || device_token.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'device_token is required.',
        });
      }

      await AuthService.updateDeviceToken(
        req.user.user_id,
        device_token.trim(),
        typeof platform === 'string' ? platform.trim() : 'android'
      );

      return res.status(200).json({
        success: true,
        message: 'FCM device token registered successfully.',
      });
    } catch (error) {
      console.error('Error in updateDeviceToken controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error updating FCM device token.',
      });
    }
  }

  /**
   * DELETE /api/auth/device-token
   * Unregisters FCM device token upon user logout or app uninstall.
   */
  static async removeDeviceToken(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated.' });
      }

      const { device_token } = req.body;
      await AuthService.removeDeviceToken(
        req.user.user_id,
        typeof device_token === 'string' ? device_token.trim() : undefined
      );

      return res.status(200).json({
        success: true,
        message: 'FCM device token unregistered successfully.',
      });
    } catch (error) {
      console.error('Error in removeDeviceToken controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error removing FCM device token.',
      });
    }
  }
}
