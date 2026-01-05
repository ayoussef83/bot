import api from '../api';

export interface Instructor {
  id: string;
  userId: string;
  costType: string;
  costAmount: number;
  user?: any;
  classes?: any[];
  sessions?: any[];
  availability?: any[];
  blackoutDates?: any[];
  costModels?: any[];
  payrolls?: any[];
  documents?: any[];
  feedbackSummaries?: any[];
}

export const instructorsService = {
  getAll: () => api.get<Instructor[]>('/instructors'),
  getById: (id: string) => api.get<Instructor>(`/instructors/${id}`),
  create: (data: Partial<Instructor>) => api.post<Instructor>('/instructors', data),
  update: (id: string, data: Partial<Instructor>) =>
    api.patch<Instructor>(`/instructors/${id}`, data),
  delete: (id: string) => api.delete(`/instructors/${id}`),

  getPayroll: (id: string) => api.get(`/instructors/${id}/payroll`),
  addAvailability: (id: string, data: any) => api.post(`/instructors/${id}/availability`, data),
  generatePayroll: (data: { year: number; month: number; instructorId?: string }) =>
    api.post(`/payroll/generate`, data),
};




