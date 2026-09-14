import { apiRequest } from './client';

export interface AlertRecord {
  alert_id: number;
  hazard_id: number | null;
  title: string;
  message: string;
  sent_by: number;
  sent_by_name?: string;
  sent_at: string;
  is_active: boolean;
  is_drill?: boolean;
  hazard_location?: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export async function getActiveAlertsApi(): Promise<{ success: boolean; data: AlertRecord[] }> {
  return apiRequest('/alerts/active', {
    method: 'GET',
  });
}

export async function createAlertApi(data: {
  hazard_id?: number;
  title: string;
  message: string;
  is_drill?: boolean;
}): Promise<{ success: boolean; message: string; alert: AlertRecord }> {
  return apiRequest('/alerts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deactivateAlertApi(
  id: number
): Promise<{ success: boolean; message: string; alert: AlertRecord }> {
  return apiRequest(`/alerts/${id}/deactivate`, {
    method: 'PATCH',
  });
}
