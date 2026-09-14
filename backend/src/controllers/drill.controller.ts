import { Request, Response } from 'express';
import { DrillService } from '../services/drill.service';

const VALID_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'];

export class DrillController {
  /**
   * GET /api/drills/upcoming
   * Fetches drills scheduled within the next 30 days.
   */
  static async getUpcomingDrills(req: Request, res: Response) {
    try {
      const drills = await DrillService.getUpcomingDrills();
      return res.status(200).json({
        success: true,
        data: drills,
      });
    } catch (error) {
      console.error('Error in getUpcomingDrills controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch upcoming scheduled drills.',
      });
    }
  }

  /**
   * GET /api/drills
   * Lists all scheduled drills.
   */
  static async getDrills(req: Request, res: Response) {
    try {
      const drills = await DrillService.getAllDrills();
      return res.status(200).json({
        success: true,
        data: drills,
      });
    } catch (error) {
      console.error('Error in getDrills controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch scheduled drills.',
      });
    }
  }

  /**
   * GET /api/drills/:id
   * Gets specific drill details and response metrics.
   */
  static async getDrillById(req: Request, res: Response) {
    try {
      const drillId = parseInt(req.params.id, 10);
      if (isNaN(drillId)) {
        return res.status(400).json({ success: false, message: 'Invalid drill ID.' });
      }

      const drill = await DrillService.getDrillById(drillId);
      if (!drill) {
        return res.status(404).json({ success: false, message: `Scheduled drill ${drillId} not found.` });
      }

      return res.status(200).json({
        success: true,
        data: drill,
      });
    } catch (error) {
      console.error('Error in getDrillById controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch drill details.',
      });
    }
  }

  /**
   * POST /api/drills
   * Schedules a new evacuation drill (admin/coordinator only).
   */
  static async createDrill(req: Request, res: Response) {
    try {
      const { title, description, scheduled_date } = req.body;

      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Field "title" is required and must be a non-empty string.',
        });
      }

      if (!scheduled_date || isNaN(new Date(scheduled_date).getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Field "scheduled_date" is required and must be a valid date/time.',
        });
      }

      const userId = req.user?.user_id;

      const drill = await DrillService.createDrill({
        title: title.trim(),
        description: description ? String(description).trim() : undefined,
        scheduled_date: new Date(scheduled_date),
        created_by: userId,
      });

      return res.status(201).json({
        success: true,
        message: 'Evacuation drill scheduled successfully.',
        data: drill,
      });
    } catch (error) {
      console.error('Error in createDrill controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while scheduling drill.',
      });
    }
  }

  /**
   * PATCH /api/drills/:id
   * Updates an existing scheduled drill.
   */
  static async updateDrill(req: Request, res: Response) {
    try {
      const drillId = parseInt(req.params.id, 10);
      if (isNaN(drillId)) {
        return res.status(400).json({ success: false, message: 'Invalid drill ID.' });
      }

      const { title, description, scheduled_date, status } = req.body;

      if (status && !VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Field "status" must be one of: ${VALID_STATUSES.join(', ')}.`,
        });
      }

      const updated = await DrillService.updateDrill(drillId, {
        title: title ? String(title).trim() : undefined,
        description: description !== undefined ? String(description).trim() : undefined,
        scheduled_date: scheduled_date ? new Date(scheduled_date) : undefined,
        status: status || undefined,
      });

      if (!updated) {
        return res.status(404).json({ success: false, message: `Drill ${drillId} not found.` });
      }

      return res.status(200).json({
        success: true,
        message: 'Scheduled drill updated successfully.',
        data: updated,
      });
    } catch (error) {
      console.error('Error in updateDrill controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while updating drill.',
      });
    }
  }

  /**
   * DELETE /api/drills/:id
   * Deletes a scheduled drill.
   */
  static async deleteDrill(req: Request, res: Response) {
    try {
      const drillId = parseInt(req.params.id, 10);
      if (isNaN(drillId)) {
        return res.status(400).json({ success: false, message: 'Invalid drill ID.' });
      }

      const deleted = await DrillService.deleteDrill(drillId);
      if (!deleted) {
        return res.status(404).json({ success: false, message: `Drill ${drillId} not found.` });
      }

      return res.status(200).json({
        success: true,
        message: 'Scheduled drill deleted successfully.',
      });
    } catch (error) {
      console.error('Error in deleteDrill controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while deleting drill.',
      });
    }
  }

  /**
   * POST /api/drills/:id/start
   * Triggers a live drill exercise now.
   */
  static async startDrill(req: Request, res: Response) {
    try {
      const drillId = parseInt(req.params.id, 10);
      if (isNaN(drillId)) {
        return res.status(400).json({ success: false, message: 'Invalid drill ID.' });
      }

      const userId = req.user?.user_id || 1;
      const result = await DrillService.startDrillNow(drillId, userId);

      return res.status(200).json({
        success: true,
        message: 'Practice drill started! Drill-mode alert broadcasted to all users.',
        data: result,
      });
    } catch (error: any) {
      console.error('Error in startDrill controller:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error while starting drill.',
      });
    }
  }

  /**
   * POST /api/drills/:id/complete
   * Marks drill as completed and returns metrics.
   */
  static async completeDrill(req: Request, res: Response) {
    try {
      const drillId = parseInt(req.params.id, 10);
      if (isNaN(drillId)) {
        return res.status(400).json({ success: false, message: 'Invalid drill ID.' });
      }

      const result = await DrillService.completeDrill(drillId);

      return res.status(200).json({
        success: true,
        message: 'Practice drill completed successfully.',
        data: result,
      });
    } catch (error: any) {
      console.error('Error in completeDrill controller:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error while completing drill.',
      });
    }
  }
}
