import api from '../api';

export interface CourseLevel {
  id: string;
  courseId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  course?: Course;
}

export interface Course {
  id: string;
  name: string;
  isActive: boolean;
  levels?: CourseLevel[];
}

export const coursesService = {
  list: () => api.get<Course[]>('/courses'),
  get: (id: string) => api.get<Course>(`/courses/${id}`),
  create: (data: { name: string; isActive?: boolean }) => api.post<Course>('/courses', data),
  update: (id: string, data: { name?: string; isActive?: boolean }) => api.patch<Course>(`/courses/${id}`, data),
  delete: (id: string) => api.delete(`/courses/${id}`),

  listLevels: () => api.get<CourseLevel[]>('/courses/levels'),
  createLevel: (data: { courseId: string; name: string; sortOrder?: number; isActive?: boolean }) =>
    api.post<CourseLevel>('/courses/levels', data),
  updateLevel: (id: string, data: { name?: string; sortOrder?: number; isActive?: boolean }) =>
    api.patch<CourseLevel>(`/courses/levels/${id}`, data),
  deleteLevel: (id: string) => api.delete(`/courses/levels/${id}`),
};


