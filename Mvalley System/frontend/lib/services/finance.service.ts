import api from '../api';

export interface Payment {
  id: string;
  studentId?: string;
  amount: number;
  type: string;
  status: string;
  paymentDate?: string;
  dueDate?: string;
  notes?: string;
  student?: any;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  expenseDate: string;
  instructorId?: string;
  instructor?: any;
}

export const financeService = {
  // Payments
  getPayments: (params?: { studentId?: string; status?: string }) =>
    api.get<Payment[]>('/payments', { params }),
  getPaymentById: (id: string) => api.get<Payment>(`/payments/${id}`),
  createPayment: (data: Partial<Payment>) => api.post<Payment>('/payments', data),
  updatePayment: (id: string, data: Partial<Payment>) =>
    api.patch<Payment>(`/payments/${id}`, data),
  deletePayment: (id: string) => api.delete(`/payments/${id}`),
  getOutstandingBalances: () => api.get('/payments/outstanding'),

  // Expenses
  getExpenses: (params?: { category?: string; startDate?: string; endDate?: string }) =>
    api.get<Expense[]>('/expenses', { params }),
  getExpenseById: (id: string) => api.get<Expense>(`/expenses/${id}`),
  createExpense: (data: Partial<Expense>) => api.post<Expense>('/expenses', data),
  updateExpense: (id: string, data: Partial<Expense>) =>
    api.patch<Expense>(`/expenses/${id}`, data),
  deleteExpense: (id: string) => api.delete(`/expenses/${id}`),
  getExpenseBreakdown: (startDate: string, endDate: string) =>
    api.get('/expenses/breakdown', { params: { startDate, endDate } }),

  // Finance Summary
  getSummary: (startDate: string, endDate: string) =>
    api.get('/finance/summary', { params: { startDate, endDate } }),
};

