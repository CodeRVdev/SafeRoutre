import { Request, Response } from 'express';
import { CheckinService } from '../services/checkin.service';
import { AlertService } from '../services/alert.service';
import { emitCheckinNew } from '../socket';

export class CheckinController {
  /**
   * POST /api/checkins
   * Submits a safety check-in ("I Am Safe") for an active alert.
   * Emits `checkin:new` over Socket.IO to connected clients.
   */
  static async createCheckin(req: Request, res: Response) {
    try {
      const { alert_id, zone_id, location, status, message } = req.body;

      if (!alert_id) {
        return res.status(400).json({
          success: false,
          message: 'Field "alert_id" is required.',
        });
      }

      const parsedAlertId = parseInt(alert_id, 10);
      if (isNaN(parsedAlertId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid alert_id parameter.',
        });
      }

      const allowedStatuses = ['safe', 'need_help', 'injured'];
      const checkinStatus = status && allowedStatuses.includes(status) ? (status as 'safe' | 'need_help' | 'injured') : 'safe';

      // Verify alert exists
      const existingAlert = await AlertService.getAlertById(parsedAlertId);
      if (!existingAlert) {
        return res.status(404).json({
          success: false,
          message: `Alert with ID ${parsedAlertId} not found.`,
        });
      }

      const userId = req.user?.user_id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
      }

      const parsedZoneId = zone_id ? parseInt(zone_id, 10) : undefined;
      const capacityWarning = parsedZoneId
        ? await CheckinService.checkZoneCapacityWarning(parsedZoneId, parsedAlertId)
        : null;

      const checkin = await CheckinService.createCheckin({
        alert_id: parsedAlertId,
        user_id: userId,
        zone_id: parsedZoneId,
        location,
        status: checkinStatus,
        message: message ? String(message) : undefined,
      });

      // Real-time Socket.IO emission
      emitCheckinNew(checkin);

      return res.status(201).json({
        success: true,
        message: capacityWarning?.warning_message || 'Safety check-in recorded successfully.',
        is_capacity_warning: !!capacityWarning,
        capacity_warning: capacityWarning,
        checkin,
      });
    } catch (error: any) {
      if (error.message && (error.message.includes('Invalid') || error.message.includes('location') || error.message.includes('Point'))) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error('Error in createCheckin controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while processing check-in.',
      });
    }
  }

  /**
   * GET /api/checkins/my
   * Retrieves all past safety check-ins for the currently authenticated user.
   */
  static async getMyCheckins(req: Request, res: Response) {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
      }

      const checkins = await CheckinService.getMyCheckins(userId);
      return res.status(200).json({
        success: true,
        data: checkins,
      });
    } catch (error) {
      console.error('Error in getMyCheckins controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch personal check-in history.',
      });
    }
  }
}
