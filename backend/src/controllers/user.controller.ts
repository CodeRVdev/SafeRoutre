import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { ActivityLogService } from '../services/activitylog.service';

export class UserController {
  /**
   * GET /api/users
   * Returns paginated list of users with optional search and role filtering.
   */
  static async getUsers(req: Request, res: Response) {
    try {
      const { search, role, page, limit } = req.query;

      const result = await UserService.getUsers({
        search: search ? String(search) : undefined,
        role: role ? String(role) : undefined,
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 10,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error in getUsers controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve users.',
      });
    }
  }

  /**
   * GET /api/users/stats
   * Returns count of users per role + total registered users.
   */
  static async getUserStats(req: Request, res: Response) {
    try {
      const stats = await UserService.getUserStats();
      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error in getUserStats controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve user statistics.',
      });
    }
  }

  /**
   * GET /api/users/:id
   * Returns single user details + check-in history.
   */
  static async getUserById(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID parameter.',
        });
      }

      const userDetails = await UserService.getUserById(userId);
      if (!userDetails) {
        return res.status(404).json({
          success: false,
          message: `User with ID ${userId} not found.`,
        });
      }

      return res.status(200).json({
        success: true,
        data: userDetails,
      });
    } catch (error: any) {
      console.error('Error in getUserById controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve user details.',
      });
    }
  }

  /**
   * POST /api/users
   * Creates a new user (admin only).
   */
  static async createUser(req: Request, res: Response) {
    try {
      const { full_name, email, password, role, id_number, department } = req.body;

      const newUser = await UserService.createUser({
        full_name,
        email,
        password,
        role,
        id_number,
        department,
      });

      ActivityLogService.logActivity(
        req.user?.user_id || null,
        'USER_CREATED',
        'user',
        newUser.user_id,
        { full_name: newUser.full_name, email: newUser.email, role: newUser.role },
        req.ip
      );

      return res.status(201).json({
        success: true,
        message: 'User created successfully.',
        user: newUser,
      });
    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message && (error.message.includes('Missing required') || error.message.includes('Invalid') || error.message.includes('Password must') || error.message.includes('required'))) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      console.error('Error in createUser controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create user.',
      });
    }
  }

  /**
   * PUT /api/users/:id
   * Updates an existing user's attributes (admin only).
   */
  static async updateUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID parameter.',
        });
      }

      const { full_name, email, role, id_number, department, is_active, password } = req.body;

      const updatedUser = await UserService.updateUser(
        userId,
        { full_name, email, role, id_number, department, is_active, password },
        req.user?.user_id
      );

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: `User with ID ${userId} not found.`,
        });
      }

      ActivityLogService.logActivity(
        req.user?.user_id || null,
        'USER_UPDATED',
        'user',
        userId,
        { full_name: updatedUser.full_name, email: updatedUser.email, role: updatedUser.role, is_active: updatedUser.is_active },
        req.ip
      );

      return res.status(200).json({
        success: true,
        message: 'User updated successfully.',
        user: updatedUser,
      });
    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message && (error.message.includes('Invalid') || error.message.includes('Password must') || error.message.includes('Self-protection') || error.message.includes('blocked'))) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      console.error('Error in updateUser controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update user.',
      });
    }
  }

  /**
   * PATCH /api/users/:id/role
   * Updates user role (admin only).
   */
  static async updateUserRole(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID parameter.',
        });
      }

      const { role } = req.body;
      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'Field "role" is required.',
        });
      }

      const updatedUser = await UserService.updateUserRole(userId, role, req.user?.user_id);
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: `User with ID ${userId} not found.`,
        });
      }

      ActivityLogService.logActivity(
        req.user?.user_id || null,
        'USER_ROLE_CHANGED',
        'user',
        userId,
        { new_role: role, full_name: updatedUser.full_name, email: updatedUser.email },
        req.ip
      );

      return res.status(200).json({
        success: true,
        message: `User role updated to '${role}' successfully.`,
        user: updatedUser,
      });
    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message && (error.message.includes('Invalid role') || error.message.includes('Self-protection') || error.message.includes('blocked'))) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error('Error in updateUserRole controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update user role.',
      });
    }
  }

  /**
   * DELETE /api/users/:id
   * Soft-deactivates user account (admin only).
   */
  static async deactivateUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID parameter.',
        });
      }

      const deactivatedUser = await UserService.deactivateUser(userId, req.user?.user_id);
      if (!deactivatedUser) {
        return res.status(404).json({
          success: false,
          message: `User with ID ${userId} not found.`,
        });
      }

      ActivityLogService.logActivity(
        req.user?.user_id || null,
        'USER_DEACTIVATED',
        'user',
        userId,
        { full_name: deactivatedUser.full_name, email: deactivatedUser.email },
        req.ip
      );

      return res.status(200).json({
        success: true,
        message: 'User account deactivated successfully.',
        user: deactivatedUser,
      });
    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message && (error.message.includes('Self-protection') || error.message.includes('blocked'))) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error('Error in deactivateUser controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to deactivate user account.',
      });
    }
  }

  /**
   * PATCH /api/users/:id/reactivate
   * Reactivates a deactivated user account (admin only).
   */
  static async reactivateUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID parameter.',
        });
      }

      const reactivatedUser = await UserService.reactivateUser(userId);
      if (!reactivatedUser) {
        return res.status(404).json({
          success: false,
          message: `User with ID ${userId} not found.`,
        });
      }

      ActivityLogService.logActivity(
        req.user?.user_id || null,
        'USER_REACTIVATED',
        'user',
        userId,
        { full_name: reactivatedUser.full_name, email: reactivatedUser.email },
        req.ip
      );

      return res.status(200).json({
        success: true,
        message: 'User account reactivated successfully.',
        user: reactivatedUser,
      });
    } catch (error: any) {
      console.error('Error in reactivateUser controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to reactivate user account.',
      });
    }
  }
}
