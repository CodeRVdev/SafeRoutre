import { Request, Response } from 'express';
import { ActivityLogService } from '../services/activitylog.service';

export class ActivityLogController {
  /**
   * GET /api/activity-logs
   * Returns paginated list of system activity logs (admin/coordinator only).
   */
  static async getActivityLogs(req: Request, res: Response) {
    try {
      const { search, action, userId, from, to, page, limit } = req.query;

      const result = await ActivityLogService.getActivityLogs({
        search: search ? String(search) : undefined,
        action: action ? String(action) : undefined,
        userId: userId ? parseInt(String(userId), 10) : undefined,
        from: from ? String(from) : undefined,
        to: to ? String(to) : undefined,
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 15,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error in getActivityLogs controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve activity audit logs.',
      });
    }
  }
}
