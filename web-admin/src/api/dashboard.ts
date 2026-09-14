import { apiRequest } from './client';
import type { AlertRecord } from './alerts';

export interface CheckedInUser {
  checkin_id: number;
  alert_id: number;
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  id_number: string | null;
  department: string | null;
  zone_id: number | null;
  zone_name: string | null;
  checked_in_at: string;
  status?: string;
  message?: string | null;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface MissingUser {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  id_number: string | null;
  department: string | null;
}

export interface DashboardCheckinData {
  alert: AlertRecord;
  alert_id: number;
  total_expected_users: number;
  checked_in_count: number;
  missing_count: number;
  checked_in_users: CheckedInUser[];
  missing_users: MissingUser[];
}

export interface EvacuationCapacity {
  zone_id: number;
  zone_name: string;
  zone_type: string;
  max_capacity: number;
  current_occupancy: number;
  percentage_full: number;
  is_full: boolean;
}

export async function getDashboardCheckinsApi(
  alertId: number
): Promise<{ success: boolean; data: DashboardCheckinData }> {
  return apiRequest(`/dashboard/checkins/${alertId}`, {
    method: 'GET',
  });
}

export async function getEvacuationCapacityApi(
  alertId: number
): Promise<{ success: boolean; data: EvacuationCapacity[] }> {
  return apiRequest(`/dashboard/capacity/${alertId}`, {
    method: 'GET',
  });
}
