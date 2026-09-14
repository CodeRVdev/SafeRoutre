import { apiRequest } from './client';

export interface SosMessage {
  message_id: number;
  alert_id: number;
  sender_id: number;
  sender_name: string;
  sender_email: string;
  sender_role: string;
  sender_department: string | null;
  receiver_id: number | null;
  receiver_name: string | null;
  content: string;
  is_read: boolean;
  priority: 'normal' | 'urgent' | 'critical';
  created_at: string;
  location_geojson: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  } | null;
}

export async function getSosForAlertApi(alertId: number): Promise<{ success: boolean; data: SosMessage[] }> {
  return apiRequest(`/sos?alertId=${alertId}`, {
    method: 'GET',
  });
}

export async function sendSosApi(data: {
  alert_id: number;
  content: string;
  priority?: 'normal' | 'urgent' | 'critical';
  location?: { latitude: number; longitude: number };
}): Promise<{ success: boolean; message: string; data: SosMessage }> {
  return apiRequest('/sos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function replySosApi(
  sosId: number,
  content: string
): Promise<{ success: boolean; message: string; data: SosMessage }> {
  return apiRequest(`/sos/${sosId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function markSosReadApi(sosId: number): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/sos/${sosId}/read`, {
    method: 'PATCH',
  });
}
