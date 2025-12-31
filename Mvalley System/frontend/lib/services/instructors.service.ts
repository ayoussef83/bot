import api from '../api';

export interface Instructor {
  id: string;
  userId: string;
  costType: string;
  costAmount: number;
  user?: any;
  classes?: any[];
  sessions?: any[];
}

export const instructorsService = {
  getAll: () => api.get<Instructor[]>('/instructors'),
  getById: (id: string) => api.get<Instructor>(`/instructors/${id}`),
  create: (data: Partial<Instructor>) => api.post<Instructor>('/instructors', data),
  update: (id: string, data: Partial<Instructor>) =>
    api.patch<Instructor>(`/instructors/${id}`, data),
  delete: (id: string) => api.delete(`/instructors/${id}`),
};




