import api from '../api';

export type CustomFieldEntity = 'student' | 'class' | 'payment' | 'lead';
export type CustomFieldType = 'text' | 'number' | 'boolean' | 'date' | 'select';

export type IntegrationProvider = 'zoho_email' | 'smsmisr';
export type MessageChannel = 'email' | 'sms';

export interface CustomFieldDefinition {
  id: string;
  entity: CustomFieldEntity;
  key: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  options?: any;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface IntegrationConfig {
  id?: string;
  provider: IntegrationProvider;
  isActive: boolean;
  config?: any;
  hasSecrets?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MessageTemplate {
  id: string;
  channel: MessageChannel;
  key: string;
  name: string;
  subject?: string | null;
  body: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export const settingsService = {
  listCustomFields: (entity: CustomFieldEntity) =>
    api.get<CustomFieldDefinition[]>('/settings/custom-fields', { params: { entity } }),
  createCustomField: (data: Partial<CustomFieldDefinition>) =>
    api.post<CustomFieldDefinition>('/settings/custom-fields', data),
  updateCustomField: (id: string, data: Partial<CustomFieldDefinition>) =>
    api.patch<CustomFieldDefinition>(`/settings/custom-fields/${id}`, data),
  deleteCustomField: (id: string) => api.delete(`/settings/custom-fields/${id}`),

  // Integrations
  getIntegration: (provider: IntegrationProvider) =>
    api.get<IntegrationConfig>(`/settings/integrations/${provider}`),
  upsertIntegration: (data: {
    provider: IntegrationProvider;
    isActive?: boolean;
    config?: any;
    secrets?: any;
  }) => api.post<IntegrationConfig>('/settings/integrations', data),

  // Templates
  listTemplates: (channel?: MessageChannel) =>
    api.get<MessageTemplate[]>('/settings/templates', { params: channel ? { channel } : {} }),
  createTemplate: (data: Partial<MessageTemplate>) =>
    api.post<MessageTemplate>('/settings/templates', data),
  updateTemplate: (id: string, data: Partial<MessageTemplate>) =>
    api.patch<MessageTemplate>(`/settings/templates/${id}`, data),
  deleteTemplate: (id: string) => api.delete(`/settings/templates/${id}`),

  sendTestSms: (mobile: string, message?: string) =>
    api.post('/settings/test-sms', { mobile, message }),

  getSmsMisrBalance: () => api.get('/settings/smsmisr/balance'),
};


