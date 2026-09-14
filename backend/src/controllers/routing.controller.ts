import { Request, Response } from 'express';
import { RoutingService } from '../services/routing.service';

export class RoutingController {
  /**
   * GET /api/routing/safe-path?fromLat=&fromLng=&toLat=&toLng=
   * Computes safe evacuation path from user coordinates to nearest safe zone,
   * avoiding active hazard areas.
   */
  static async getSafePath(req: Request, res: Response) {
    try {
      const { fromLat, fromLng, toLat, toLng, destinationId, startNodeId } = req.query;

      let fLat = fromLat ? parseFloat(fromLat as string) : NaN;
      let fLng = fromLng ? parseFloat(fromLng as string) : NaN;
      const tLat = toLat ? parseFloat(toLat as string) : undefined;
      const tLng = toLng ? parseFloat(toLng as string) : undefined;
      const destId = destinationId ? (destinationId as string) : undefined;
      const startId = startNodeId ? (startNodeId as string) : undefined;

      // If coordinates are omitted or NaN, attempt to resolve from startId
      if ((isNaN(fLat) || isNaN(fLng)) && startId) {
        const node = RoutingService.getGraphNode(startId);
        if (node) {
          fLat = node.lat;
          fLng = node.lng;
        }
      }

      if (isNaN(fLat) || isNaN(fLng)) {
        return res.status(400).json({
          success: false,
          message: 'Query parameters fromLat and fromLng (or valid startNodeId) are required.',
        });
      }

      console.log(`🗺️ Routing Request: start=${startId || 'GPS'}, from=(${fLat}, ${fLng}), dest=${destId || 'auto'}`);
      const routeData = await RoutingService.getSafePath(fLat, fLng, tLat, tLng, destId, startId);
      console.log(`🗺️ Routing Success: distance=${routeData.route?.distanceMeters}m, status=${routeData.route?.status}, isHazardRerouted=${routeData.route?.isHazardRerouted}`);

      return res.status(200).json(routeData);
    } catch (error) {
      console.error('Error in getSafePath controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while calculating safe route.',
      });
    }
  }
}
