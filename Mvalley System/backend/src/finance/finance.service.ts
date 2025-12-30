import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const currentPeriod = await this.getCurrentPeriod();

    // Cash Position
    const cashAccounts = await this.prisma.cashAccount.findMany({
      where: { isActive: true },
    });
    const totalCash = cashAccounts.reduce((sum, acc) => sum + acc.balance, 0);

    // Expected Revenue (unpaid invoices)
    const expectedRevenue = await this.prisma.invoice.aggregate({
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
    const actualRevenue = await this.prisma.payment.aggregate({
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
    const expenses = await this.prisma.expense.aggregate({
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
    const overdueInvoices = await this.prisma.invoice.count({
      where: {
        status: 'overdue',
        dueDate: {
          lt: new Date(),
        },
      },
    });

    const overdueAmount = await this.prisma.invoice.aggregate({
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
    const instructorCategory = await this.prisma.expenseCategory.findFirst({
      where: { code: 'INSTR' },
    });

    const unpaidInstructorExpenses = await this.prisma.expense.aggregate({
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
    const recentPayments = await this.prisma.payment.findMany({
      take: 10,
      orderBy: { receivedDate: 'desc' },
      include: {
        cashAccount: true,
        allocations: {
          include: {
            invoice: {
              include: {
                student: true,
              },
            },
          },
        },
      },
    });

    // Recent expenses
    const recentExpenses = await this.prisma.expense.findMany({
      take: 10,
      orderBy: { expenseDate: 'desc' },
      include: {
        category: true,
        instructor: {
          include: {
            user: true,
          },
        },
        cashAccount: true,
      },
    });

    return {
      cashPosition: {
        total: totalCash,
        breakdown: cashBreakdown,
      },
      expectedRevenue: expectedRevenue._sum.totalAmount || 0,
      actualRevenue,
      variance: (expectedRevenue._sum.totalAmount || 0) - (actualRevenue._sum.amount || 0),
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

    return this.prisma.financialPeriod.findUnique({
      where: { periodCode },
    });
  }
}
