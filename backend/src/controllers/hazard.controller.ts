import { Request, Response } from 'express';
import { HazardService } from '../services/hazard.service';
import { AlertService } from '../services/alert.service';
import { FcmService } from '../services/fcm.service';
import { ActivityLogService } from '../services/activitylog.service';
import { emitHazardNew, emitHazardResolved } from '../socket';

const VALID_SEVERITIES = ['low', 'moderate', 'high', 'critical'];

export class HazardController {
  /**
   * GET /api/hazards/active
   * Lists all active hazards as GeoJSON FeatureCollection.
   */
  static async getActiveHazards(req: Request, res: Response) {
    try {
      const geojson = await HazardService.getActiveHazards();
      return res.status(200).json({
        success: true,
        data: geojson,
      });
    } catch (error) {
      console.error('Error in getActiveHazards controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch active hazards.',
      });
    }
  }

  /**
   * POST /api/hazards
   * Pins a new hazard with location point, type, description, and severity.
   */
  static async createHazard(req: Request, res: Response) {
    try {
      let { type, description, location, severity } = req.body;

      if (typeof location === 'string') {
        try {
          location = JSON.parse(location);
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: 'Invalid location JSON format.',
          });
        }
      }

      if (!type || typeof type !== 'string' || type.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Field "type" is required and must be a non-empty string.',
        });
      }

      if (!description || typeof description !== 'string' || description.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Field "description" is required and must be a non-empty string.',
        });
      }

      if (!severity || !VALID_SEVERITIES.includes(severity.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Field "severity" must be one of: ${VALID_SEVERITIES.join(', ')}.`,
        });
      }

      if (!location) {
        return res.status(400).json({
          success: false,
          message: 'Field "location" (GeoJSON Point object) is required.',
        });
      }

      const userId = req.user?.user_id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
      }

      const photoUrl = req.file ? `/uploads/hazards/${req.file.filename}` : null;

      const newHazard = await HazardService.createHazard({
        type: type.trim(),
        description: description.trim(),
        location,
        severity: severity.toLowerCase() as any,
        reported_by: userId,
        photo_url: photoUrl,
      });

      // Real-time socket emission
      emitHazardNew(newHazard);

      // Audit activity log
      ActivityLogService.logActivity(
        userId,
        'HAZARD_PINNED',
        'hazard',
        newHazard.id as number,
        { type: newHazard.properties.type, severity: newHazard.properties.severity, description: newHazard.properties.description },
        req.ip
      );

      // Dispatch informational advisory FCM notification (advisory only, NOT panic siren)
      try {
        const tokens = await AlertService.getActiveUserDeviceTokens();
        if (tokens.length > 0) {
          const pushTitle = `⚠️ Hazard Advisory: ${newHazard.properties.type}`;
          const pushBody = `${newHazard.properties.severity.toUpperCase()} severity: ${newHazard.properties.description}`;
          FcmService.sendToMultipleDevices(
            tokens,
            pushTitle,
            pushBody,
            {
              type: 'hazard_advisory',
              hazard_id: String(newHazard.id),
              severity: newHazard.properties.severity,
              hazard_type: newHazard.properties.type,
              description: newHazard.properties.description,
              lat: String(newHazard.geometry.coordinates[1]),
              lng: String(newHazard.geometry.coordinates[0]),
            }
          );
        }
      } catch (fcmErr) {
        console.error('Error dispatching hazard advisory FCM push notification:', fcmErr);
      }

      return res.status(201).json({
        success: true,
        message: 'Hazard reported and pinned successfully.',
        hazard: newHazard,
      });
    } catch (error: any) {
      if (error.message && (error.message.includes('Invalid') || error.message.includes('location') || error.message.includes('Point'))) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error('Error in createHazard controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while reporting hazard.',
      });
    }
  }

  /**
   * PATCH /api/hazards/:id/resolve
   * Marks an active hazard as resolved.
   */
  static async resolveHazard(req: Request, res: Response) {
    try {
      const hazardId = parseInt(req.params.id, 10);
      if (isNaN(hazardId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid hazard ID parameter.',
        });
      }

      const resolvedHazard = await HazardService.resolveHazard(hazardId);
      if (!resolvedHazard) {
        return res.status(404).json({
          success: false,
          message: `Hazard with ID ${hazardId} not found.`,
        });
      }

      // Real-time socket emission
      emitHazardResolved(resolvedHazard);

      // Audit activity log
      ActivityLogService.logActivity(
        req.user?.user_id || null,
        'HAZARD_RESOLVED',
        'hazard',
        hazardId,
        { type: resolvedHazard.properties.type },
        req.ip
      );

      return res.status(200).json({
        success: true,
        message: 'Hazard marked as resolved successfully.',
        hazard: resolvedHazard,
      });
    } catch (error) {
      console.error('Error in resolveHazard controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while resolving hazard.',
      });
    }
  }
}
