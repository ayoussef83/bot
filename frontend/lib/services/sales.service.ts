import api from '../api';

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  source: string;
  status: string;
  notes?: string;
  interestedIn?: string;
  followUps?: LeadFollowUp[];
  createdAt: string;
  updatedAt?: string;
  convertedToStudentId?: string;
  convertedAt?: string;
}

export interface LeadFollowUp {
  id: string;
  leadId: string;
  notes: string;
  nextAction?: string;
  nextActionDate?: string;
  createdAt: string;
}

export const salesService = {
  getLeads: (params?: { status?: string; source?: string }) =>
    api.get<Lead[]>('/leads', { params }),
  getLeadById: (id: string) => api.get<Lead>(`/leads/${id}`),
  createLead: (data: Partial<Lead>) => api.post<Lead>('/leads', data),
  updateLead: (id: string, data: Partial<Lead>) => api.patch<Lead>(`/leads/${id}`, data),
  deleteLead: (id: string) => api.delete(`/leads/${id}`),
  convertToStudent: (id: string, studentData: any) =>
    api.post(`/leads/${id}/convert`, studentData),

  // Follow-ups
  createFollowUp: (data: Partial<LeadFollowUp>) => api.post('/follow-ups', data),
  getFollowUpsByLead: (leadId: string) => api.get(`/follow-ups/lead/${leadId}`),
};






