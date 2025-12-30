import api from '@/lib/api';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId?: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  classId?: string;
  subscriptionId?: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  receivedDate: string;
  amount: number;
  method: 'cash' | 'bank_transfer' | 'vodafone_cash' | 'instapay' | 'pos';
  cashAccountId: string;
  cashAccount?: {
    id: string;
    name: string;
    type: string;
  };
  referenceNumber?: string;
  status: 'pending' | 'received' | 'reversed' | 'failed';
  notes?: string;
  allocations?: PaymentAllocation[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  invoiceId: string;
  invoice?: Invoice;
  amount: number;
  allocatedAt: string;
  notes?: string;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  expenseDate: string;
  paidDate?: string;
  amount: number;
  categoryId: string;
  category?: ExpenseCategory;
  description: string;
  vendor?: string;
  paymentMethod?: string;
  cashAccountId?: string;
  cashAccount?: CashAccount;
  status: 'draft' | 'pending_approval' | 'approved' | 'paid' | 'reversed';
  instructorId?: string;
  instructor?: {
    id: string;
    user?: {
      firstName: string;
      lastName: string;
    };
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export interface CashAccount {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'wallet';
  accountNumber?: string;
  bankName?: string;
  balance: number;
  currency: string;
  isActive: boolean;
  notes?: string;
}

export interface FinanceOverview {
  cashPosition: {
    total: number;
    breakdown: Array<{
      name: string;
      type: string;
      balance: number;
    }>;
  };
  expectedRevenue: number;
  actualRevenue: {
    _sum: {
      amount: number;
    };
  };
  variance: number;
  overdueInvoices: {
    count: number;
    amount: number;
  };
  netResult: {
    revenue: number;
    expenses: number;
    profit: number;
    margin: number;
  };
  unpaidInstructorBalances: number;
  recentPayments: Payment[];
  recentExpenses: Expense[];
}

class FinanceService {
  async getOverview(): Promise<{ data: FinanceOverview }> {
    const response = await api.get('/finance/overview');
    return response.data;
  }

  async getInvoices(): Promise<{ data: Invoice[] }> {
    const response = await api.get('/finance/invoices');
    return response.data;
  }

  async getInvoiceById(id: string): Promise<{ data: Invoice }> {
    const response = await api.get(`/finance/invoices/${id}`);
    return response.data;
  }

  async getPayments(): Promise<{ data: Payment[] }> {
    const response = await api.get('/finance/payments');
    return response.data;
  }

  async getPaymentById(id: string): Promise<{ data: Payment }> {
    const response = await api.get(`/finance/payments/${id}`);
    return response.data;
  }

  async getExpenses(): Promise<{ data: Expense[] }> {
    const response = await api.get('/finance/expenses');
    return response.data;
  }

  async getExpenseById(id: string): Promise<{ data: Expense }> {
    const response = await api.get(`/finance/expenses/${id}`);
    return response.data;
  }

  async getCashAccounts(): Promise<{ data: CashAccount[] }> {
    const response = await api.get('/finance/cash-accounts');
    return response.data;
  }

  async getExpenseCategories(): Promise<{ data: ExpenseCategory[] }> {
    const response = await api.get('/finance/expense-categories');
    return response.data;
  }

  async getInvoices(): Promise<{ data: Invoice[] }> {
    const response = await api.get('/finance/invoices');
    return response.data;
  }

  async getInvoiceById(id: string): Promise<{ data: Invoice }> {
    const response = await api.get(`/finance/invoices/${id}`);
    return response.data;
  }
}

export const financeService = new FinanceService();
