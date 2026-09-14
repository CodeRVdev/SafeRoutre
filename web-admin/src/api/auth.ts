import { apiRequest } from './client';

export interface UserProfile {
  user_id: number;
  full_name: string;
  email: string;
  role: 'admin' | 'coordinator' | 'student' | 'faculty' | 'staff';
  id_number?: string;
  department?: string;
  created_at?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: UserProfile;
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getMeApi(): Promise<{ success: boolean; user: UserProfile }> {
  return apiRequest('/auth/me', {
    method: 'GET',
  });
}
