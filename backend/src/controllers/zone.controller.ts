import { Request, Response } from 'express';
import { ZoneService } from '../services/zone.service';
import { ActivityLogService } from '../services/activitylog.service';

const VALID_ZONE_TYPES = ['safe_zone', 'evacuation_point'];

export class ZoneController {
  /**
   * GET /api/zones
   * Retrieves all zones as GeoJSON FeatureCollection.
   */
  static async getZones(req: Request, res: Response) {
    try {
      const geojson = await ZoneService.getAllZones();
      return res.status(200).json({
        success: true,
        data: geojson,
      });
    } catch (error) {
      console.error('Error in getZones controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch zones.',
      });
    }
  }

  /**
   * POST /api/zones
   * Creates a new campus zone (safe_zone or evacuation_point).
   */
  static async createZone(req: Request, res: Response) {
    try {
      const { name, type, geometry } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Field "name" is required and must be a non-empty string.',
        });
      }

      if (!type || !VALID_ZONE_TYPES.includes(type)) {
        return res.status(400).json({
          success: false,
          message: `Field "type" must be one of: ${VALID_ZONE_TYPES.join(', ')}.`,
        });
      }

      if (!geometry) {
        return res.status(400).json({
          success: false,
          message: 'Field "geometry" (GeoJSON Polygon object) is required.',
        });
      }

      const userId = req.user?.user_id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
      }

      const newZone = await ZoneService.createZone({
        name: name.trim(),
        type,
        geometry,
        created_by: userId,
      });

      ActivityLogService.logActivity(
        userId,
        'ZONE_CREATED',
        'zone',
        newZone.id as number,
        { name: newZone.properties.name, type: newZone.properties.type },
        req.ip
      );

      return res.status(201).json({
        success: true,
        message: 'Zone created successfully.',
        zone: newZone,
      });
    } catch (error: any) {
      if (error.message && (error.message.includes('Invalid') || error.message.includes('geometry'))) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error('Error in createZone controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while creating zone.',
      });
    }
  }

  /**
   * PATCH /api/zones/:id
   * Updates an existing zone's name, type, or geometry.
   */
  static async updateZone(req: Request, res: Response) {
    try {
      const zoneId = parseInt(req.params.id, 10);
      if (isNaN(zoneId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid zone ID parameter.',
        });
      }

      const { name, type, geometry } = req.body;

      if (type !== undefined && !VALID_ZONE_TYPES.includes(type)) {
        return res.status(400).json({
          success: false,
          message: `Field "type" must be one of: ${VALID_ZONE_TYPES.join(', ')}.`,
        });
      }

      const updatedZone = await ZoneService.updateZone(zoneId, {
        name: name ? name.trim() : undefined,
        type,
        geometry,
      });

      if (!updatedZone) {
        return res.status(404).json({
          success: false,
          message: `Zone with ID ${zoneId} not found.`,
        });
      }

      ActivityLogService.logActivity(
        req.user?.user_id || null,
        'ZONE_UPDATED',
        'zone',
        zoneId,
        { name: updatedZone.properties.name, type: updatedZone.properties.type },
        req.ip
      );

      return res.status(200).json({
        success: true,
        message: 'Zone updated successfully.',
        zone: updatedZone,
      });
    } catch (error: any) {
      if (error.message && (error.message.includes('Invalid') || error.message.includes('geometry'))) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error('Error in updateZone controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while updating zone.',
      });
    }
  }

  /**
   * DELETE /api/zones/:id
   * Deletes a zone by ID.
   */
  static async deleteZone(req: Request, res: Response) {
    try {
      const zoneId = parseInt(req.params.id, 10);
      if (isNaN(zoneId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid zone ID parameter.',
        });
      }

      const deleted = await ZoneService.deleteZone(zoneId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: `Zone with ID ${zoneId} not found.`,
        });
      }

      ActivityLogService.logActivity(
        req.user?.user_id || null,
        'ZONE_DELETED',
        'zone',
        zoneId,
        {},
        req.ip
      );

      return res.status(200).json({
        success: true,
        message: 'Zone deleted successfully.',
      });
    } catch (error) {
      console.error('Error in deleteZone controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while deleting zone.',
      });
    }
  }
}
