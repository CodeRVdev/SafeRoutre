import { apiRequest } from './client';

export interface EmergencyContact {
  contact_id: number;
  name: string;
  organization?: string;
  phone: string;
  category: 'fire' | 'medical' | 'police' | 'disaster' | 'school';
  is_active: boolean;
  sort_order: number;
  created_at?: string;
}

export interface CreateContactPayload {
  name: string;
  organization?: string;
  phone: string;
  category: 'fire' | 'medical' | 'police' | 'disaster' | 'school';
  is_active?: boolean;
  sort_order?: number;
}

export async function getEmergencyContactsApi(all = true) {
  return apiRequest<{ success: boolean; data: EmergencyContact[] }>(`/emergency-contacts${all ? '?all=true' : ''}`);
}

export async function createEmergencyContactApi(payload: CreateContactPayload) {
  return apiRequest<{ success: boolean; data: EmergencyContact; message?: string }>('/emergency-contacts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateEmergencyContactApi(contactId: number, payload: Partial<CreateContactPayload>) {
  return apiRequest<{ success: boolean; data: EmergencyContact; message?: string }>(`/emergency-contacts/${contactId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteEmergencyContactApi(contactId: number) {
  return apiRequest<{ success: boolean; message: string }>(`/emergency-contacts/${contactId}`, {
    method: 'DELETE',
  });
}
