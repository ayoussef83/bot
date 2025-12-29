import api from '../api';

export type CustomFieldEntity = 'student' | 'class' | 'payment' | 'lead';
export type CustomFieldType = 'text' | 'number' | 'boolean' | 'date' | 'select';

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

export const settingsService = {
  listCustomFields: (entity: CustomFieldEntity) =>
    api.get<CustomFieldDefinition[]>('/settings/custom-fields', { params: { entity } }),
  createCustomField: (data: Partial<CustomFieldDefinition>) =>
    api.post<CustomFieldDefinition>('/settings/custom-fields', data),
  updateCustomField: (id: string, data: Partial<CustomFieldDefinition>) =>
    api.patch<CustomFieldDefinition>(`/settings/custom-fields/${id}`, data),
  deleteCustomField: (id: string) => api.delete(`/settings/custom-fields/${id}`),
};


