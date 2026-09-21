import { Request, Response } from 'express';
import { SosService } from '../services/sos.service';
import { ActivityLogService } from '../services/activitylog.service';
import { emitSosNew, emitSosReply, emitSosAcknowledged } from '../socket';

export class SosController {
  /**
   * POST /api/sos
   * Any authenticated user sends an SOS message with location and content.
   */
  static async sendSos(req: Request, res: Response) {
    try {
      const { alert_id, content, location, priority } = req.body;

      if (!alert_id) {
        return res.status(400).json({ success: false, message: 'Field "alert_id" is required.' });
      }

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Field "content" is required and must be non-empty.' });
      }

      const senderId = req.user?.user_id;
      if (!senderId) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      console.log(`[SOS] Emergency SOS received: user_id=${senderId}, alert_id=${alert_id}, priority=${priority || 'normal'}, location=${JSON.stringify(location)}`);

      const sosRecord = await SosService.sendSosMessage({
        senderId,
        alertId: parseInt(alert_id, 10),
        content: content.trim(),
        location,
        priority: priority || 'normal',
      });

      console.log(`[SOS] Saved to database: message_id=${sosRecord.message_id}, lat=${sosRecord.latitude}, lng=${sosRecord.longitude}. Emitting "sos:new" event.`);

      // Emits real-time Socket.IO event to all active coordinators
      emitSosNew(sosRecord);

      // Audit activity log
      ActivityLogService.logActivity(
        senderId,
        'SOS_SENT',
        'sos_message',
        sosRecord.message_id,
        { alert_id: sosRecord.alert_id, priority: sosRecord.priority, content: sosRecord.content },
        req.ip
      );

      return res.status(201).json({
        success: true,
        message: 'SOS alert sent successfully. Responders have been notified.',
        data: sosRecord,
      });
    } catch (error: any) {
      console.error('Error in sendSos controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while dispatching SOS message.',
      });
    }
  }

  /**
   * GET /api/sos?alertId=
   * Gets SOS messages for an alert or recent SOS messages across campus (coordinators only).
   */
  static async getSosForAlert(req: Request, res: Response) {
    try {
      if (req.query.alertId) {
        const alertId = parseInt(req.query.alertId as string, 10);
        if (isNaN(alertId)) {
          return res.status(400).json({ success: false, message: 'Query parameter "alertId" must be a number.' });
        }
        const messages = await SosService.getSosMessagesByAlert(alertId);
        return res.status(200).json({
          success: true,
          data: messages,
        });
      }

      // If no alertId specified, return recent SOS messages
      const recentMessages = await SosService.getRecentSosMessages(50);
      return res.status(200).json({
        success: true,
        data: recentMessages,
      });
    } catch (error) {
      console.error('Error in getSosForAlert controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch SOS messages.',
      });
    }
  }

  /**
   * POST /api/sos/:id/reply
   * Coordinator replies to a user's SOS message.
   */
  static async replySos(req: Request, res: Response) {
    try {
      const parentSosId = parseInt(req.params.id, 10);
      const { content } = req.body;

      if (isNaN(parentSosId)) {
        return res.status(400).json({ success: false, message: 'Invalid SOS message ID parameter.' });
      }

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Field "content" is required and must be non-empty.' });
      }

      const coordinatorId = req.user?.user_id;
      if (!coordinatorId) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      const replyRecord = await SosService.replySosMessage(coordinatorId, parentSosId, content);

      // Emits real-time Socket.IO reply event
      emitSosReply(replyRecord);

      // Audit activity log
      ActivityLogService.logActivity(
        coordinatorId,
        'SOS_REPLIED',
        'sos_message',
        replyRecord.message_id,
        { parent_sos_id: parentSosId, recipient_id: replyRecord.receiver_id },
        req.ip
      );

      return res.status(201).json({
        success: true,
        message: 'Coordinator response sent successfully.',
        data: replyRecord,
      });
    } catch (error: any) {
      console.error('Error in replySos controller:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to send coordinator SOS reply.',
      });
    }
  }

  /**
   * PATCH /api/sos/:id/read
   * Marks an SOS message as read.
   */
  static async markRead(req: Request, res: Response) {
    try {
      const sosId = parseInt(req.params.id, 10);
      if (isNaN(sosId)) {
        return res.status(400).json({ success: false, message: 'Invalid SOS message ID parameter.' });
      }

      await SosService.markAsRead(sosId);
      emitSosAcknowledged({ message_id: sosId });

      return res.status(200).json({
        success: true,
        message: 'SOS message marked as read.',
      });
    } catch (error) {
      console.error('Error in markRead controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update SOS read status.',
      });
    }
  }
}
