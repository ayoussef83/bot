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

export interface FinanceOverview {
  cashPosition: number;
  expectedRevenue: number;
  actualRevenue: number;
  variance: number;
  overdueInvoices: {
    count: number;
    amount: number;
  };
  netResult: number;
  unpaidInstructorBalances: number;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  amount: number;
  method: string;
  receivedDate: string;
  status: string;
  cashAccountId: string;
  cashAccount?: CashAccount;
  studentId?: string;
  student?: any;
  referenceNumber?: string;
  notes?: string;
  allocations?: Array<{
    id: string;
    amount: number;
    invoiceId: string;
    invoice?: Invoice;
  }>;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  amount: number;
  description: string;
  vendor?: string;
  expenseDate: string;
  paidDate?: string;
  status: string;
  categoryId: string;
  category?: any;
  cashAccountId?: string;
  notes?: string;
}

export interface CashAccount {
  id: string;
  name: string;
  type: string;
  accountNumber?: string;
  bankName?: string;
  balance: number;
  currency: string;
  isActive: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export const financeService = {
  // Overview
  getOverview: () => api.get<FinanceOverview>('/finance/overview'),

  // Invoices
  getInvoices: () => api.get<Invoice[]>('/finance/invoices'),
  getInvoiceById: (id: string) => api.get<Invoice>(`/finance/invoices/${id}`),
  createInvoice: (data: CreateInvoiceDto) => api.post<Invoice>('/finance/invoices', data),
  updateInvoiceStatus: (id: string, status: string) => api.put(`/finance/invoices/${id}/status`, { status }),
  cancelInvoice: (id: string) => api.put(`/finance/invoices/${id}/cancel`),

  // Payments
  getPayments: () => api.get<Payment[]>('/finance/payments'),
  getPaymentById: (id: string) => api.get<Payment>(`/finance/payments/${id}`),
  createPayment: (data: any) => api.post<Payment>('/finance/payments', data),
  deletePayment: (id: string) => api.delete(`/finance/payments/${id}`),
  createPaymentAllocation: (data: { paymentId: string; invoiceId: string; amount: number }) =>
    api.post('/finance/payments/allocations', data),

  // Expenses
  getExpenses: () => api.get<Expense[]>('/finance/expenses'),
  getExpenseById: (id: string) => api.get<Expense>(`/finance/expenses/${id}`),
  createExpense: (data: any) => api.post<Expense>('/finance/expenses', data),
  deleteExpense: (id: string) => api.delete(`/finance/expenses/${id}`),

  // Cash Accounts
  getCashAccounts: () => api.get<CashAccount[]>('/finance/cash-accounts'),
  getCashAccountById: (id: string) => api.get<CashAccount>(`/finance/cash-accounts/${id}`),
  createCashAccount: (data: any) => api.post<CashAccount>('/finance/cash-accounts', data),
  updateCashAccount: (id: string, data: any) => api.put<CashAccount>(`/finance/cash-accounts/${id}`, data),

  // Expense Categories
  getExpenseCategories: () => api.get<ExpenseCategory[]>('/finance/expense-categories'),
  getExpenseCategoryById: (id: string) => api.get<ExpenseCategory>(`/finance/expense-categories/${id}`),
  createExpenseCategory: (data: any) => api.post<ExpenseCategory>('/finance/expense-categories', data),
  updateExpenseCategory: (id: string, data: any) => api.put<ExpenseCategory>(`/finance/expense-categories/${id}`, data),
};

