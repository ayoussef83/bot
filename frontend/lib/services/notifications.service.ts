import api from '../api';

export type NotificationChannel = 'email' | 'sms' | 'whatsapp';

export interface SendMessageDto {
  channel: NotificationChannel;
  recipient: string;
  message: string;
  subject?: string;
  template?: string;
  payload?: any;
  studentId?: string;
  leadId?: string;
  parentId?: string;
}

export interface NotificationRecord {
  id: string;
  channel: NotificationChannel;
  recipient: string;
  template?: string | null;
  subject?: string | null;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: string | null;
  errorMessage?: string | null;
  scheduledAt?: string | null;
  studentId?: string | null;
  leadId?: string | null;
  parentId?: string | null;
  createdAt?: string;
}

export const notificationsService = {
  sendMessage: (data: SendMessageDto) => api.post<NotificationRecord>('/notifications/send', data),
  list: (params?: { channel?: NotificationChannel; status?: string; studentId?: string; leadId?: string }) =>
    api.get<NotificationRecord[]>('/notifications', { params }),
  getById: (id: string) => api.get<NotificationRecord>(`/notifications/${id}`),
};


