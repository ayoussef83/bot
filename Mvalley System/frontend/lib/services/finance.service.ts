import api from '../api';

export interface ProfitAndLossReport {
  period: {
    code: string;
    startDate: string;
    endDate: string;
  };
  revenue: {
    total: number;
    breakdown: {
      classFees: number;
      subscriptions: number;
      other: number;
    };
  };
  expenses: {
    total: number;
    breakdown: {
      instructor: number;
      rent: number;
      marketing: number;
      utilities: number;
      operations: number;
      other: number;
    };
  };
  netProfit: number;
  grossMargin: number;
}

export interface CashFlowReport {
  period: {
    code: string;
    startDate: string;
    endDate: string;
  };
  inflows: {
    total: number;
    breakdown: {
      cash: number;
      bankTransfer: number;
      wallet: number;
    };
  };
  outflows: {
    total: number;
    breakdown: {
      instructorPayouts: number;
      other: number;
    };
  };
  openingBalance: number;
  netCashFlow: number;
  closingBalance: number;
}

export interface ClassProfitabilityItem {
  classId: string;
  className: string;
  location: string;
  revenue: number;
  instructorCost: number;
  netProfit: number;
  margin: number;
  studentCount: number;
  sessionCount: number;
}

export interface ClassProfitabilityReport {
  period: {
    code: string;
    startDate: string;
    endDate: string;
  };
  classes: ClassProfitabilityItem[];
  summary: {
    totalClasses: number;
    profitableClasses: number;
    unprofitableClasses: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    averageMargin: number;
  };
}

export interface InstructorCostItem {
  instructorId: string;
  instructorName: string;
  costType: string;
  sessions: number;
  hours: number;
  totalCost: number;
  revenueGenerated: number;
  costPerSession: number;
  costPerHour: number;
  netContribution: number;
  efficiency: number;
}

export interface InstructorCostsReport {
  period: {
    code: string;
    startDate: string;
    endDate: string;
  };
  instructors: InstructorCostItem[];
  summary: {
    totalInstructors: number;
    totalCost: number;
    totalRevenue: number;
    totalSessions: number;
    totalHours: number;
    costRatio: number;
  };
}

export interface FinancialPeriod {
  id: string;
  periodCode: string;
  startDate: string;
  endDate: string;
  status: string;
}

class FinanceService {
  // Reports
  async getProfitAndLoss(period: string, location?: string, program?: string): Promise<ProfitAndLossReport> {
    const params = new URLSearchParams({ period });
    if (location) params.append('location', location);
    if (program) params.append('program', program);
    const response = await api.get(`/finance/reports/profit-loss?${params.toString()}`);
    return response.data;
  }

  async getCashFlow(period: string, cashAccountId?: string): Promise<CashFlowReport> {
    const params = new URLSearchParams({ period });
    if (cashAccountId) params.append('cashAccountId', cashAccountId);
    const response = await api.get(`/finance/reports/cash-flow?${params.toString()}`);
    return response.data;
  }

  async getClassProfitability(period: string, location?: string, program?: string): Promise<ClassProfitabilityReport> {
    const params = new URLSearchParams({ period });
    if (location) params.append('location', location);
    if (program) params.append('program', program);
    const response = await api.get(`/finance/reports/class-profitability?${params.toString()}`);
    return response.data;
  }

  async getInstructorCosts(period: string, instructorId?: string): Promise<InstructorCostsReport> {
    const params = new URLSearchParams({ period });
    if (instructorId) params.append('instructorId', instructorId);
    const response = await api.get(`/finance/reports/instructor-costs?${params.toString()}`);
    return response.data;
  }

  // Financial Periods
  async getFinancialPeriods(): Promise<FinancialPeriod[]> {
    const response = await api.get('/finance/periods');
    return response.data;
  }

  // Reconciliation
  async getReconciliation(period: string): Promise<any> {
    const response = await api.get(`/finance/reconciliation?period=${period}`);
    return response.data;
  }

  async createReconciliationRecord(data: any): Promise<any> {
    const response = await api.post('/finance/reconciliation', data);
    return response.data;
  }

  async closePeriod(period: string): Promise<any> {
    const response = await api.put(`/finance/reconciliation/close?period=${period}`);
    return response.data;
  }

  async lockPeriod(period: string): Promise<any> {
    const response = await api.put(`/finance/reconciliation/lock?period=${period}`);
    return response.data;
  }
}

export const financeReportsService = new FinanceService();
