import { Request, Response } from 'express';
import { CheckinService } from '../services/checkin.service';
import { AlertService } from '../services/alert.service';

export class DashboardController {
  /**
   * GET /api/dashboard/checkins/:alertId
   * Returns real-time live dashboard safety statistics, checked-in users, and missing users.
   * Restricted to admin and coordinator roles.
   */
  static async getCheckinsByAlert(req: Request, res: Response) {
    try {
      const alertId = parseInt(req.params.alertId, 10);
      if (isNaN(alertId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid alertId parameter.',
        });
      }

      const alert = await AlertService.getAlertById(alertId);
      if (!alert) {
        return res.status(404).json({
          success: false,
          message: `Alert with ID ${alertId} not found.`,
        });
      }

      const dashboardData = await CheckinService.getDashboardCheckinStatus(alertId);

      return res.status(200).json({
        success: true,
        data: {
          alert,
          ...dashboardData,
        },
      });
    } catch (error) {
      console.error('Error in getCheckinsByAlert controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while fetching dashboard check-in data.',
      });
    }
  }

  /**
   * GET /api/dashboard/capacity/:alertId
   * Returns real-time capacity and occupancy metrics for each evacuation center.
   */
  static async getCapacityByAlert(req: Request, res: Response) {
    try {
      const alertId = parseInt(req.params.alertId, 10);
      if (isNaN(alertId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid alertId parameter.',
        });
      }

      const capacities = await CheckinService.getEvacuationCapacity(alertId);

      return res.status(200).json({
        success: true,
        data: capacities,
      });
    } catch (error) {
      console.error('Error in getCapacityByAlert controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while fetching evacuation capacity data.',
      });
    }
  }
}
