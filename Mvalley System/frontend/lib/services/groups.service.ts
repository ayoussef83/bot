import api from '../api';

export interface Group {
  id: string;
  name: string;
  courseLevelId: string;
  courseLevel?: any;
  defaultClassId?: string | null;
  defaultClass?: any;
  createdAt?: string;
  updatedAt?: string;
}

export const groupsService = {
  getAll: () => api.get<Group[]>('/groups'),
  create: (data: { name: string; courseLevelId: string; defaultClassId?: string | null }) => api.post<Group>('/groups', data),
  update: (id: string, data: Partial<{ name: string; courseLevelId: string; defaultClassId?: string | null }>) => api.patch<Group>(`/groups/${id}`, data),
  delete: (id: string) => api.delete(`/groups/${id}`),
};


