import api from '../api';

export type TeachingSlotStatus = 'open' | 'reserved' | 'occupied' | 'inactive';

export interface TeachingSlot {
  id: string;
  status: TeachingSlotStatus;
  courseLevelId: string;
  courseLevel?: any;
  instructorId: string;
  instructor?: any;
  roomId: string;
  room?: any;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  minCapacity: number;
  maxCapacity: number;
  plannedSessions: number;
  sessionDurationMins: number;
  pricePerStudent: number;
  minMarginPct: number;
  currency: string;
  currentClassId?: string | null;
  currentClass?: any;
  createdBy?: any;
  createdAt?: string;
}

export const teachingSlotsService = {
  getAll: () => api.get<TeachingSlot[]>('/teaching-slots'),
  getById: (id: string) => api.get<TeachingSlot>(`/teaching-slots/${id}`),
  create: (data: any) => api.post<TeachingSlot>('/teaching-slots', data),
  update: (id: string, data: any) => api.patch<TeachingSlot>(`/teaching-slots/${id}`, data),
  delete: (id: string, reason: string) => api.delete(`/teaching-slots/${id}`, { data: { reason } }),
};


