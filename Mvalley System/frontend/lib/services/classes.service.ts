import api from '../api';

export interface Class {
  id: string;
  name: string;
  location: string;
  capacity: number;
  code?: string | null;
  logoUrl?: string | null;
  ageMin?: number | null;
  ageMax?: number | null;
  price?: number | null;
  levelNumber?: number | null;
  plannedSessions?: number | null;
  description?: string | null;
  instructorId?: string;
  courseLevelId?: string | null;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  startDate?: string;
  endDate?: string;
  instructor?: any;
  students?: any[];
  courseLevel?: any; // includes course
  _count?: { sessions?: number };

  // Computed fields returned by backend list endpoints (optional)
  utilizationPercentage?: number;
  isUnderfilled?: boolean;
}

export const classesService = {
  getAll: () => api.get<Class[]>('/classes'),
  getById: (id: string) => api.get<Class>(`/classes/${id}`),
  create: (data: Partial<Class>) => api.post<Class>('/classes', data),
  update: (id: string, data: Partial<Class>) => api.patch<Class>(`/classes/${id}`, data),
  delete: (id: string) => api.delete(`/classes/${id}`),
};

