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

      const updatedUser = await UserService.updateUserRole(userId, role);
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
      if (error.message && error.message.includes('Invalid role')) {
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

      const deactivatedUser = await UserService.deactivateUser(userId);
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
      console.error('Error in deactivateUser controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to deactivate user account.',
      });
    }
  }
}
