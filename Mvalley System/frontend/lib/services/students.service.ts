import api from '../api';

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  learningTrack: string;
  status: string;
  email?: string;
  phone?: string;
  parentId?: string;
  classId?: string;
  class?: any;
  parent?: any;
}

export const studentsService = {
  getAll: () => api.get<Student[]>('/students'),
  getById: (id: string) => api.get<Student>(`/students/${id}`),
  create: (data: Partial<Student>) => api.post<Student>('/students', data),
  update: (id: string, data: Partial<Student>) => api.patch<Student>(`/students/${id}`, data),
  delete: (id: string) => api.delete(`/students/${id}`),
};




