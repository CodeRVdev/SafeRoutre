import { Request, Response } from 'express';
import { AlertService } from '../services/alert.service';
import { FcmService } from '../services/fcm.service';
import { ActivityLogService } from '../services/activitylog.service';
import { emitAlertBroadcast, emitAlertResolved } from '../socket';

export class AlertController {
  /**
   * POST /api/alerts
   * Creates an emergency alert and broadcasts it over Socket.IO (alert:broadcast) and FCM Push.
   */
  static async createAlert(req: Request, res: Response) {
    try {
      const { hazard_id, title, message, is_drill } = req.body;

      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Field "title" is required and must be a non-empty string.',
        });
      }

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Field "message" is required and must be a non-empty string.',
        });
      }

      const userId = req.user?.user_id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      const alert = await AlertService.createAlert({
        hazard_id: hazard_id ? parseInt(hazard_id, 10) : undefined,
        title: title.trim(),
        message: message.trim(),
        sent_by: userId,
        is_drill: Boolean(is_drill),
      });

      // 1. Broadcast alert to all connected real-time socket clients
      emitAlertBroadcast(alert);

      // 2. Log activity audit trail
      ActivityLogService.logActivity(
        userId,
        alert.is_drill ? 'DRILL_BROADCAST' : 'ALERT_BROADCAST',
        'alert',
        alert.alert_id,
        { title: alert.title, message: alert.message, hazard_id: alert.hazard_id, is_drill: alert.is_drill },
        req.ip
      );

      // 3. Dispatch high-priority FCM Push Notifications to registered device tokens
      try {
        const tokens = await AlertService.getActiveUserDeviceTokens();
        if (tokens.length > 0) {
          const pushTitle = alert.is_drill
            ? `🔵 EVACUATION DRILL: ${alert.title}`
            : `🚨 EMERGENCY ALERT: ${alert.title}`;
          FcmService.sendToMultipleDevices(
            tokens,
            pushTitle,
            alert.message,
            {
              alert_id: String(alert.alert_id),
              title: alert.title,
              message: alert.message,
              sent_at: String(alert.sent_at),
              is_drill: String(alert.is_drill),
              type: alert.is_drill ? 'evacuation_drill' : 'emergency_alert',
              action: 'open_emergency_map',
            }
          );
        }
      } catch (fcmErr) {
        console.error('Error dispatching FCM push notifications for alert:', fcmErr);
      }

      return res.status(201).json({
        success: true,
        message: 'Emergency alert created and broadcasted successfully.',
        alert,
      });
    } catch (error) {
      console.error('Error in createAlert controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while creating emergency alert.',
      });
    }
  }

  /**
   * GET /api/alerts/active
   * Retrieves active emergency alerts (for mobile/client polling or state sync).
   */
  static async getActiveAlerts(req: Request, res: Response) {
    try {
      const alerts = await AlertService.getActiveAlerts();
      return res.status(200).json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      console.error('Error in getActiveAlerts controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while fetching active alerts.',
      });
    }
  }

  /**
   * PATCH /api/alerts/:id/deactivate
   * Deactivates an active emergency alert.
   */
  static async deactivateAlert(req: Request, res: Response) {
    try {
      const alertId = parseInt(req.params.id, 10);
      if (isNaN(alertId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid alert ID parameter.',
        });
      }

      const alert = await AlertService.deactivateAlert(alertId);
      if (!alert) {
        return res.status(404).json({
          success: false,
          message: `Alert with ID ${alertId} not found.`,
        });
      }

      ActivityLogService.logActivity(
        req.user?.user_id || null,
        'ALERT_DEACTIVATED',
        'alert',
        alertId,
        { title: alert.title },
        req.ip
      );

      emitAlertResolved({ alert_id: alertId });

      return res.status(200).json({
        success: true,
        message: 'Emergency alert deactivated successfully.',
        alert,
      });
    } catch (error) {
      console.error('Error in deactivateAlert controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while deactivating alert.',
      });
    }
  }
}
