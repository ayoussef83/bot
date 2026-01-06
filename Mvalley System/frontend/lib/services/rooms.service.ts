import api from '../api';

export interface Room {
  id: string;
  name: string;
  location: string;
  capacity: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  availabilities?: any[];
}

export const roomsService = {
  getAll: () => api.get<Room[]>('/rooms'),
  create: (data: Partial<Room>) => api.post<Room>('/rooms', data),
  update: (id: string, data: Partial<Room>) => api.patch<Room>(`/rooms/${id}`, data),
  delete: (id: string) => api.delete(`/rooms/${id}`),
  addAvailability: (roomId: string, data: any) => api.post(`/rooms/${roomId}/availability`, data),
  updateAvailability: (availabilityId: string, data: any) => api.patch(`/rooms/availability/${availabilityId}`, data),
  deleteAvailability: (availabilityId: string) => api.delete(`/rooms/availability/${availabilityId}`),
};


