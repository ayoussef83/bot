import api from '../api';

export interface Group {
  id: string;
  name: string;
  courseLevelId: string;
  courseLevel?: any;
  defaultClassId?: string | null;
  defaultClass?: any;
  location?: string | null;
  minCapacity?: number | null;
  maxCapacity?: number | null;
  ageMin?: number | null;
  ageMax?: number | null;
  createdBy?: { id: string; firstName?: string; lastName?: string; email?: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

export const groupsService = {
  getAll: () => api.get<Group[]>('/groups'),
  create: (data: {
    name?: string;
    courseLevelId: string;
    defaultClassId?: string | null;
    location?: string | null;
    minCapacity?: number | null;
    maxCapacity?: number | null;
    ageMin?: number | null;
    ageMax?: number | null;
  }) => api.post<Group>('/groups', data),
  update: (
    id: string,
    data: Partial<{
      name: string;
      courseLevelId: string;
      defaultClassId?: string | null;
      location?: string | null;
      minCapacity?: number | null;
      maxCapacity?: number | null;
      ageMin?: number | null;
      ageMax?: number | null;
    }>,
  ) => api.patch<Group>(`/groups/${id}`, data),
  delete: (id: string) => api.delete(`/groups/${id}`),
};


