import api from '../api';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string | null;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  } | null;
  classId: string | null;
  subscriptionId: string | null;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled' | 'draft';
  notes: string | null;
  paymentAllocations?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceDto {
  studentId?: string;
  classId?: string;
  subscriptionId?: string;
  dueDate: string;
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  status?: string;
  notes?: string;
}

export const financeService = {
  // Invoices
  getInvoices: () => api.get<Invoice[]>('/finance/invoices'),
  getInvoiceById: (id: string) => api.get<Invoice>(`/finance/invoices/${id}`),
  createInvoice: (data: CreateInvoiceDto) => api.post<Invoice>('/finance/invoices', data),
  updateInvoiceStatus: (id: string, status: string) => api.put(`/finance/invoices/${id}/status`, { status }),
  cancelInvoice: (id: string) => api.put(`/finance/invoices/${id}/cancel`),
};

