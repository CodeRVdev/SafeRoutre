import { apiRequest } from './client';

export interface RouteGeometry {
  type: 'LineString';
  coordinates: [number, number][]; // [lng, lat]
}

export interface BackendRouteResult {
  success: boolean;
  route: {
    geometry: RouteGeometry;
    distanceMeters: number;
    estimatedWalkingMinutes: number;
    estimatedSeconds: number;
    origin: {
      id: string;
      name: string;
      type: string;
      coordinates: [number, number];
    };
    destination: {
      id: string;
      name: string;
      type: string;
      center: [number, number];
    };
    isHazardRerouted: boolean;
    hazardsAvoided: any[];
    hazardsAvoidedCount: number;
    pathNodes: {
      id: string;
      name: string;
      type: string;
      lat: number;
      lng: number;
    }[];
    status: 'recommended' | 'safest_hazard_aware' | 'no_route_available';
  } | null;
  message?: string;
}

export async function fetchSafeRouteApi(params: {
  fromLat: number;
  fromLng: number;
  startNodeId?: string;
  destinationId?: string;
  toLat?: number;
  toLng?: number;
}): Promise<BackendRouteResult> {
  const query = new URLSearchParams();
  query.set('fromLat', params.fromLat.toString());
  query.set('fromLng', params.fromLng.toString());
  if (params.startNodeId) query.set('startNodeId', params.startNodeId);
  if (params.destinationId) query.set('destinationId', params.destinationId);
  if (params.toLat !== undefined) query.set('toLat', params.toLat.toString());
  if (params.toLng !== undefined) query.set('toLng', params.toLng.toString());

  return apiRequest<BackendRouteResult>(`/routing/safe-path?${query.toString()}`);
}
