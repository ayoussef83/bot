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
  parentId?: string | null;
  classId?: string | null;
  class?: any;
  parent?: any;
  enrollments?: StudentEnrollment[];
}

export const studentsService = {
  getAll: () => api.get<Student[]>('/students'),
  getById: (id: string) => api.get<Student>(`/students/${id}`),
  create: (data: Partial<Student>) => api.post<Student>('/students', data),
  update: (id: string, data: Partial<Student>) => api.patch<Student>(`/students/${id}`, data),
  delete: (id: string) => api.delete(`/students/${id}`),
  getUnallocatedPaidInsight: () => api.get(`/students/insights/unallocated-paid`),
  listEnrollments: (studentId: string) => api.get<StudentEnrollment[]>(`/students/${studentId}/enrollments`),
  addEnrollment: (studentId: string, data: { courseLevelId: string; classId?: string }) =>
    api.post<StudentEnrollment>(`/students/${studentId}/enrollments`, data),
  updateEnrollment: (enrollmentId: string, data: { classId?: string | null; status?: string }) =>
    api.patch<StudentEnrollment>(`/students/enrollments/${enrollmentId}`, data),
  removeEnrollment: (enrollmentId: string) => api.delete(`/students/enrollments/${enrollmentId}`),
};

export interface StudentEnrollment {
  id: string;
  studentId: string;
  courseLevelId: string;
  classId?: string | null;
  status: string;
  courseLevel?: any; // includes course
  class?: any;
  createdAt: string;
  updatedAt: string;
}




