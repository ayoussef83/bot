import api from '../api';

export type ParentContact = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone: string;
  address?: string | null;
  students?: any[];
  createdAt: string;
  updatedAt: string;
};

export const parentsService = {
  getAll: () => api.get<ParentContact[]>('/parents'),
  getById: (id: string) => api.get<ParentContact>(`/parents/${id}`),
  create: (data: Partial<ParentContact>) => api.post<ParentContact>('/parents', data),
  update: (id: string, data: Partial<ParentContact>) => api.patch<ParentContact>(`/parents/${id}`, data),
};


