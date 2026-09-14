import { Request, Response } from 'express';
import { ReportService } from '../services/report.service';
import { AlertService } from '../services/alert.service';
import { ActivityLogService } from '../services/activitylog.service';

export class ReportController {
  /**
   * POST /api/reports/:alertId/generate
   * Computes total_users and checked_in_count for the alert and saves a row in evacuation_reports.
   * Restricted to admin and coordinator roles.
   */
  static async generateReport(req: Request, res: Response) {
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

      const report = await ReportService.generateEvacuationReport(alertId);

      ActivityLogService.logActivity(
        req.user?.user_id || null,
        'REPORT_GENERATED',
        'report',
        report.report_id,
        { alert_id: report.alert_id, total_users: report.total_users, checked_in_count: report.checked_in_count },
        req.ip
      );

      return res.status(201).json({
        success: true,
        message: 'Evacuation report generated successfully.',
        report,
      });
    } catch (error) {
      console.error('Error in generateReport controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while generating evacuation report.',
      });
    }
  }

  /**
   * GET /api/reports/:alertId
   * Retrieves the generated evacuation report for a given alert_id.
   * Restricted to admin and coordinator roles.
   */
  static async getReport(req: Request, res: Response) {
    try {
      const alertId = parseInt(req.params.alertId, 10);
      if (isNaN(alertId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid alertId parameter.',
        });
      }

      const report = await ReportService.getReportByAlertId(alertId);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: `Evacuation report for alert ID ${alertId} not found. Please generate it first.`,
        });
      }

      return res.status(200).json({
        success: true,
        report,
      });
    } catch (error) {
      console.error('Error in getReport controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while fetching evacuation report.',
      });
    }
  }
}
