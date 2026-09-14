import { apiRequest } from './client';

export interface EvacuationReportRecord {
  report_id: number;
  alert_id: number;
  total_users: number;
  checked_in_count: number;
  generated_at: string;
}

export async function generateReportApi(
  alertId: number
): Promise<{ success: boolean; message: string; report: EvacuationReportRecord }> {
  return apiRequest(`/reports/${alertId}/generate`, {
    method: 'POST',
  });
}

export async function getReportApi(
  alertId: number
): Promise<{ success: boolean; report: EvacuationReportRecord }> {
  return apiRequest(`/reports/${alertId}`, {
    method: 'GET',
  });
}
