import { apiRequest } from './client';

export interface UserRecord {
  user_id: number;
  full_name: string;
  email: string;
  role: 'admin' | 'coordinator' | 'student' | 'faculty' | 'staff';
  id_number: string | null;
  department: string | null;
  device_token?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface UserStats {
  total: number;
  admin: number;
  coordinator: number;
  faculty: number;
  staff: number;
  student: number;
}

export interface UserCheckinHistory {
  checkin_id: number;
  alert_id: number;
  alert_title: string;
  checked_in_at: string;
  status: string;
  message: string | null;
  zone_name: string | null;
}

export interface UserDetailsData {
  user: UserRecord;
  checkins: UserCheckinHistory[];
}

export interface PaginatedUsersResponse {
  users: UserRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getUsersApi(params?: {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; data: PaginatedUsersResponse }> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.set('search', params.search);
  if (params?.role && params.role !== 'all') queryParams.set('role', params.role);
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());

  const queryString = queryParams.toString();
  const endpoint = `/users${queryString ? `?${queryString}` : ''}`;

  return apiRequest(endpoint, { method: 'GET' });
}

export async function getUserStatsApi(): Promise<{ success: boolean; data: UserStats }> {
  return apiRequest('/users/stats', { method: 'GET' });
}

export async function getUserDetailsApi(userId: number): Promise<{ success: boolean; data: UserDetailsData }> {
  return apiRequest(`/users/${userId}`, { method: 'GET' });
}

export async function updateUserRoleApi(
  userId: number,
  role: string
): Promise<{ success: boolean; message: string; user: UserRecord }> {
  return apiRequest(`/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function deactivateUserApi(
  userId: number
): Promise<{ success: boolean; message: string; user: UserRecord }> {
  return apiRequest(`/users/${userId}`, {
    method: 'DELETE',
  });
}
