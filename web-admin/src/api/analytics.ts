import { apiRequest } from './client';

export interface AnalyticsData {
  kpis: {
    total_alerts: number;
    drill_alerts_count?: number;
    real_alerts_count?: number;
    avg_response_time_minutes: number;
    avg_drill_response_time_minutes?: number;
    avg_real_response_time_minutes?: number;
    overall_completion_rate: number;
    total_hazards: number;
  };
  response_times: Array<{
    alert_id: number;
    title: string;
    sent_date: string;
    avg_minutes: number;
    total_checkins: number;
    is_drill?: boolean;
  }>;
  status_breakdown: Array<{
    status: 'safe' | 'need_help' | 'injured';
    count: number;
  }>;
  role_rates: Array<{
    role: string;
    total_users: number;
    checked_in_users: number;
    rate: number;
  }>;
  alert_history: Array<{
    date_label: string;
    total_alerts: number;
    drill_alerts: number;
    real_alerts: number;
  }>;
  hazard_frequency: Array<{
    type: string;
    severity: 'low' | 'moderate' | 'high' | 'critical';
    count: number;
  }>;
}

export async function getAnalyticsApi(range: string = '30d'): Promise<{ success: boolean; data: AnalyticsData }> {
  return apiRequest(`/dashboard/analytics?range=${encodeURIComponent(range)}`, {
    method: 'GET',
  });
}
