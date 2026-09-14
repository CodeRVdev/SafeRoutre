import { apiRequest } from './client';

export interface ZoneFeature {
  type: 'Feature';
  id: number;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: {
    zone_id: number;
    name: string;
    type: 'safe_zone' | 'evacuation_point';
    created_by: number;
    created_at: string;
  };
}

export interface ZoneFeatureCollection {
  type: 'FeatureCollection';
  features: ZoneFeature[];
}

export async function getZonesApi(): Promise<{ success: boolean; data: ZoneFeatureCollection }> {
  return apiRequest('/zones', {
    method: 'GET',
  });
}

export async function createZoneApi(data: {
  name: string;
  type: 'safe_zone' | 'evacuation_point';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}): Promise<{ success: boolean; message: string; zone: ZoneFeature }> {
  return apiRequest('/zones', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateZoneApi(
  id: number,
  data: {
    name?: string;
    type?: 'safe_zone' | 'evacuation_point';
    geometry?: {
      type: 'Polygon';
      coordinates: number[][][];
    };
  }
): Promise<{ success: boolean; message: string; zone: ZoneFeature }> {
  return apiRequest(`/zones/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteZoneApi(id: number): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/zones/${id}`, {
    method: 'DELETE',
  });
}
