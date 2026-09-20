import { apiRequest } from './client';

export interface ActivityLogItem {
  log_id: number;
  user_id: number | null;
  user_full_name: string | null;
  user_email: string | null;
  user_role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  details: any;
  ip_address: string | null;
  created_at: string;
}

export interface ActivityLogResponse {
  logs: ActivityLogItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ActivityLogQueryParams {
  search?: string;
  action?: string;
  userId?: number;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export async function getActivityLogs(
  _token?: string,
  params: ActivityLogQueryParams = {}
): Promise<ActivityLogResponse> {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.action && params.action !== 'all') query.append('action', params.action);
  if (params.userId) query.append('userId', params.userId.toString());
  if (params.from) query.append('from', params.from);
  if (params.to) query.append('to', params.to);
  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());

  const queryString = query.toString();
  const endpoint = `/activity-logs${queryString ? `?${queryString}` : ''}`;
  const response = await apiRequest<{ success: boolean; data: ActivityLogResponse }>(endpoint, {
    method: 'GET',
  });

  return response.data;
}
