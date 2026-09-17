import { apiRequest } from './client';

export interface HazardFeature {
  type: 'Feature';
  id: number;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    hazard_id: number;
    type: string;
    description: string;
    severity: 'low' | 'moderate' | 'high' | 'critical';
    reported_by: number;
    status: 'active' | 'resolved';
    photo_url?: string | null;
    created_at: string;
    resolved_at: string | null;
  };
}

export interface HazardFeatureCollection {
  type: 'FeatureCollection';
  features: HazardFeature[];
}

export async function getActiveHazardsApi(): Promise<{ success: boolean; data: HazardFeatureCollection }> {
  return apiRequest('/hazards/active', {
    method: 'GET',
  });
}

export async function createHazardApi(data: {
  type: string;
  description: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  photoFile?: File | null;
}): Promise<{ success: boolean; message: string; hazard: HazardFeature }> {
  if (data.photoFile) {
    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('description', data.description);
    formData.append('severity', data.severity);
    formData.append('location', JSON.stringify(data.location));
    formData.append('photo', data.photoFile);

    return apiRequest('/hazards', {
      method: 'POST',
      body: formData,
    });
  }

  return apiRequest('/hazards', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function resolveHazardApi(
  id: number
): Promise<{ success: boolean; message: string; hazard: HazardFeature }> {
  return apiRequest(`/hazards/${id}/resolve`, {
    method: 'PATCH',
  });
}

export async function updateHazardApi(
  id: number,
  data: {
    type?: string;
    description?: string;
    severity?: 'low' | 'moderate' | 'high' | 'critical';
    location?: {
      type: 'Point';
      coordinates: [number, number];
    };
    photoFile?: File | null;
  }
): Promise<{ success: boolean; message: string; hazard: HazardFeature }> {
  if (data.photoFile) {
    const formData = new FormData();
    if (data.type !== undefined) formData.append('type', data.type);
    if (data.description !== undefined) formData.append('description', data.description);
    if (data.severity !== undefined) formData.append('severity', data.severity);
    if (data.location !== undefined) formData.append('location', JSON.stringify(data.location));
    formData.append('photo', data.photoFile);

    return apiRequest(`/hazards/${id}`, {
      method: 'PUT',
      body: formData,
    });
  }

  return apiRequest(`/hazards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteHazardApi(
  id: number
): Promise<{ success: boolean; message: string; hazard: HazardFeature }> {
  return apiRequest(`/hazards/${id}`, {
    method: 'DELETE',
  });
}

