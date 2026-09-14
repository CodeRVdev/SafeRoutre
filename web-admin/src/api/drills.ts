import { apiRequest } from './client';

export interface DrillMetrics {
  total_expected: number;
  checked_in_count: number;
  missing_count: number;
  completion_rate_percent: number;
  duration_minutes: number;
}

export interface ScheduledDrill {
  drill_id: number;
  title: string;
  description?: string;
  scheduled_date: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_by?: number;
  creator_name?: string;
  alert_id?: number;
  is_alert_active?: boolean;
  created_at?: string;
  metrics?: DrillMetrics | null;
}

export interface CreateDrillPayload {
  title: string;
  description?: string;
  scheduled_date: string;
}

export async function getUpcomingDrillsApi() {
  return apiRequest<{ success: boolean; data: ScheduledDrill[] }>('/drills/upcoming');
}

export async function getAllDrillsApi() {
  return apiRequest<{ success: boolean; data: ScheduledDrill[] }>('/drills');
}

export async function getDrillByIdApi(drillId: number) {
  return apiRequest<{ success: boolean; data: ScheduledDrill }>(`/drills/${drillId}`);
}

export async function createDrillApi(payload: CreateDrillPayload) {
  return apiRequest<{ success: boolean; data: ScheduledDrill; message?: string }>('/drills', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateDrillApi(drillId: number, payload: Partial<CreateDrillPayload & { status?: string }>) {
  return apiRequest<{ success: boolean; data: ScheduledDrill; message?: string }>(`/drills/${drillId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteDrillApi(drillId: number) {
  return apiRequest<{ success: boolean; message: string }>(`/drills/${drillId}`, {
    method: 'DELETE',
  });
}

export async function startDrillNowApi(drillId: number) {
  return apiRequest<{ success: boolean; message: string; data: { drill: ScheduledDrill; alert: any } }>(
    `/drills/${drillId}/start`,
    {
      method: 'POST',
    }
  );
}

export async function completeDrillApi(drillId: number) {
  return apiRequest<{ success: boolean; message: string; data: ScheduledDrill }>(`/drills/${drillId}/complete`, {
    method: 'POST',
  });
}
