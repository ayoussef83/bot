import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const currentPeriod = await this.getCurrentPeriod();

    // Cash Position
    const cashAccounts = await this.prisma.cash_accounts.findMany({
      where: { isActive: true },
    });
    const totalCash = cashAccounts.reduce((sum, acc) => sum + acc.balance, 0);

    // Expected Revenue (unpaid invoices)
    const expectedRevenue = await this.prisma.invoices.aggregate({
      where: {
        status: {
          in: ['issued', 'partially_paid', 'overdue'],
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Actual Revenue (received payments in current period)
    const actualRevenue = await this.prisma.payments.aggregate({
      where: {
        status: 'received',
        receivedDate: currentPeriod
          ? {
              gte: currentPeriod.startDate,
              lte: currentPeriod.endDate,
            }
          : undefined,
      },
      _sum: {
        amount: true,
      },
    });

    // Expenses (paid in current period)
    const expenses = await this.prisma.expenses.aggregate({
      where: {
        status: 'paid',
        paidDate: currentPeriod
          ? {
              gte: currentPeriod.startDate,
              lte: currentPeriod.endDate,
            }
          : { not: null },
      },
      _sum: {
        amount: true,
      },
    });

    // Overdue Invoices
    const overdueInvoices = await this.prisma.invoices.count({
      where: {
        status: 'overdue',
        dueDate: {
          lt: new Date(),
        },
      },
    });

    const overdueAmount = await this.prisma.invoices.aggregate({
      where: {
        status: 'overdue',
        dueDate: {
          lt: new Date(),
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Unpaid Instructor Balances
    const instructorCategory = await this.prisma.expenses_categories.findFirst({
      where: { code: 'INSTR' },
    });

    const unpaidInstructorExpenses = await this.prisma.expenses.aggregate({
      where: {
        categoryId: instructorCategory?.id,
        status: {
          in: ['approved', 'pending_approval'],
        },
        paidDate: null,
      },
      _sum: {
        amount: true,
      },
    });

    // Net Result
    const revenue = actualRevenue._sum.amount || 0;
    const expenseTotal = expenses._sum.amount || 0;
    const profit = revenue - expenseTotal;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    // Cash breakdown by account
    const cashBreakdown = cashAccounts.map((acc) => ({
      name: acc.name,
      type: acc.type,
      balance: acc.balance,
    }));

    // Recent payments
    const recentPayments = await this.prisma.payments.findMany({
      take: 10,
      orderBy: { receivedDate: 'desc' },
      include: {
        cash_accounts: true,
        payment_allocations: {
          include: {
            invoice: {
              include: {
                students: true,
              },
            },
          },
        },
      },
    });

    // Recent expenses
    const recentExpenses = await this.prisma.expenses.findMany({
      take: 10,
      orderBy: { expenseDate: 'desc' },
      include: {
        category: true,
        instructors: {
          include: {
            users: true,
          },
        },
        cash_accounts: true,
      },
    });

    const actualRevenueAmount = actualRevenue._sum.amount || 0;
    const expectedRevenueAmount = expectedRevenue._sum.totalAmount || 0;

    return {
      cashPosition: {
        total: totalCash,
        breakdown: cashBreakdown,
      },
      expectedRevenue: expectedRevenueAmount,
      actualRevenue: actualRevenueAmount,
      variance: expectedRevenueAmount - actualRevenueAmount,
      overdueInvoices: {
        count: overdueInvoices,
        amount: overdueAmount._sum.totalAmount || 0,
      },
      netResult: {
        revenue,
        expenses: expenseTotal,
        profit,
        margin,
      },
      unpaidInstructorBalances: unpaidInstructorExpenses._sum.amount || 0,
      recentPayments,
      recentExpenses,
    };
  }

  private async getCurrentPeriod() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const periodCode = `${year}-${String(month).padStart(2, '0')}`;

    return this.prisma.financial_periods.findUnique({
      where: { periodCode },
    });
  }

  async getFinancialPeriods() {
    return this.prisma.financial_periods.findMany({
      orderBy: {
        periodCode: 'desc',
      },
    });
  }
}
