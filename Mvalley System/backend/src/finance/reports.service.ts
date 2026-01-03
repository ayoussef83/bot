import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getProfitAndLoss(periodCode: string, location?: string, program?: string) {
    const period = await this.prisma.financial_periods.findUnique({
      where: { periodCode },
    });

    if (!period) {
      throw new NotFoundException('Financial period not found');
    }

    // Revenue: Sum of invoices issued in period
    const revenueQuery: any = {
      issueDate: {
        gte: period.startDate,
        lte: period.endDate,
      },
      status: {
        not: 'cancelled',
      },
    };

    const invoices = await this.prisma.invoices.findMany({
      where: revenueQuery,
      include: {
        students: {
          include: {
            classes: true,
          },
        },
      },
    });

    // Filter by location/program if provided
    let filteredInvoices = invoices;
    if (location || program) {
      filteredInvoices = invoices.filter((inv) => {
        if (location && inv.student?.class?.location !== location) return false;
        if (program && inv.student?.learningTrack !== program) return false;
        return true;
      });
    }

    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const classFees = filteredInvoices.filter((inv) => inv.classId).reduce((sum, inv) => sum + inv.totalAmount, 0);
    const subscriptions = filteredInvoices.filter((inv) => inv.subscriptionId).reduce((sum, inv) => sum + inv.totalAmount, 0);
    const otherRevenue = totalRevenue - classFees - subscriptions;

    // Expenses: Sum of expenses paid in period
    const expensesQuery: any = {
      status: 'paid',
      paidDate: {
        gte: period.startDate,
        lte: period.endDate,
      },
      periodId: period.id,
    };

    const expenses = await this.prisma.expenses.findMany({
      where: expensesQuery,
      include: {
        category: true,
      },
    });

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const instructorCosts = expenses
      .filter((exp) => exp.category.code === 'INSTR')
      .reduce((sum, exp) => sum + exp.amount, 0);
    const rentExpenses = expenses
      .filter((exp) => exp.category.code === 'RENT')
      .reduce((sum, exp) => sum + exp.amount, 0);
    const marketingExpenses = expenses
      .filter((exp) => exp.category.code === 'MKTG')
      .reduce((sum, exp) => sum + exp.amount, 0);
    const utilitiesExpenses = expenses
      .filter((exp) => exp.category.code === 'UTIL')
      .reduce((sum, exp) => sum + exp.amount, 0);
    const operationsExpenses = expenses
      .filter((exp) => exp.category.code === 'OPS')
      .reduce((sum, exp) => sum + exp.amount, 0);
    const otherExpenses = totalExpenses - instructorCosts - rentExpenses - marketingExpenses - utilitiesExpenses - operationsExpenses;

    const netProfit = totalRevenue - totalExpenses;
    const grossMargin = totalRevenue > 0 ? ((totalRevenue - instructorCosts) / totalRevenue) * 100 : 0;

    return {
      period: {
        code: period.periodCode,
        startDate: period.startDate,
        endDate: period.endDate,
      },
      revenue: {
        total: totalRevenue,
        breakdown: {
          classFees,
          subscriptions,
          other: otherRevenue,
        },
      },
      expenses: {
        total: totalExpenses,
        breakdown: {
          instructors: instructorCosts,
          rent: rentExpenses,
          marketing: marketingExpenses,
          utilities: utilitiesExpenses,
          operations: operationsExpenses,
          other: otherExpenses,
        },
      },
      netProfit,
      grossMargin,
    };
  }

  async getCashFlow(periodCode: string, cashAccountId?: string) {
    const period = await this.prisma.financial_periods.findUnique({
      where: { periodCode },
    });

    if (!period) {
      throw new NotFoundException('Financial period not found');
    }

    // Cash Inflows: Payments received in period
    const paymentsQuery: any = {
      status: 'received',
      receivedDate: {
        gte: period.startDate,
        lte: period.endDate,
      },
    };

    if (cashAccountId) {
      paymentsQuery.cashAccountId = cashAccountId;
    }

    const payments = await this.prisma.payments.findMany({
      where: paymentsQuery,
      include: {
        cash_accounts: true,
      },
    });

    const totalInflows = payments.reduce((sum, pay) => sum + pay.amount, 0);
    const cashPayments = payments.filter((p) => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0);
    const bankTransfers = payments.filter((p) => p.method === 'bank_transfer').reduce((sum, p) => sum + p.amount, 0);
    const walletPayments = payments.filter((p) => p.method === 'vodafone_cash' || p.method === 'instapay').reduce((sum, p) => sum + p.amount, 0);

    // Cash Outflows: Expenses paid in period
    const expensesQuery: any = {
      status: 'paid',
      paidDate: {
        gte: period.startDate,
        lte: period.endDate,
      },
      periodId: period.id,
    };

    if (cashAccountId) {
      expensesQuery.cashAccountId = cashAccountId;
    }

    const expenses = await this.prisma.expenses.findMany({
      where: expensesQuery,
    });

    const totalOutflows = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const instructorPayouts = expenses
      .filter((exp) => exp.instructorId)
      .reduce((sum, exp) => sum + exp.amount, 0);
    const otherOutflows = totalOutflows - instructorPayouts;

    // Get opening balance (previous period closing balance or sum of account balances)
    const previousPeriod = await this.prisma.financial_periods.findFirst({
      where: {
        periodCode: {
          lt: periodCode,
        },
      },
      orderBy: {
        periodCode: 'desc',
      },
    });

    let openingBalance = 0;
    
    if (previousPeriod) {
      // Calculate previous period's closing balance
      const prevStartDate = previousPeriod.startDate;
      const prevEndDate = previousPeriod.endDate;
      
      // Get all payments before current period start
      const prevPayments = await this.prisma.payments.aggregate({
        where: {
          receivedDate: {
            lt: period.startDate,
          },
          status: 'received',
        },
        _sum: {
          amount: true,
        },
      });
      
      // Get all expenses before current period start
      const prevExpenses = await this.prisma.expenses.aggregate({
        where: {
          expenseDate: {
            lt: period.startDate,
          },
          status: 'paid',
        },
        _sum: {
          amount: true,
        },
      });
      
      // Opening balance = sum of all account initial balances + net flow before period
      const allAccounts = await this.prisma.cash_accounts.findMany({
        where: { isActive: true },
      });
      const initialBalances = allAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
      
      const prevNetFlow = (prevPayments._sum.amount || 0) - (prevExpenses._sum.amount || 0);
      openingBalance = initialBalances + prevNetFlow;
    } else {
      // First period: use sum of all account balances
      const allAccounts = await this.prisma.cash_accounts.findMany({
        where: { isActive: true },
      });
      openingBalance = allAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
      
      // Subtract transactions that occurred before period start
      const prePeriodPayments = await this.prisma.payments.aggregate({
        where: {
          receivedDate: {
            lt: period.startDate,
          },
          status: 'received',
        },
        _sum: {
          amount: true,
        },
      });
      
      const prePeriodExpenses = await this.prisma.expenses.aggregate({
        where: {
          expenseDate: {
            lt: period.startDate,
          },
          status: 'paid',
        },
        _sum: {
          amount: true,
        },
      });
      
      const prePeriodNetFlow = (prePeriodPayments._sum.amount || 0) - (prePeriodExpenses._sum.amount || 0);
      openingBalance = openingBalance - prePeriodNetFlow;
    }

    const netCashFlow = totalInflows - totalOutflows;
    const closingBalance = openingBalance + netCashFlow;

    return {
      period: {
        code: period.periodCode,
        startDate: period.startDate,
        endDate: period.endDate,
      },
      inflows: {
        total: totalInflows,
        breakdown: {
          cash: cashPayments,
          bankTransfer: bankTransfers,
          wallet: walletPayments,
        },
      },
      outflows: {
        total: totalOutflows,
        breakdown: {
          instructorPayouts,
          other: otherOutflows,
        },
      },
      openingBalance,
      netCashFlow,
      closingBalance,
    };
  }

  async getClassProfitability(periodCode: string, location?: string, program?: string) {
    const period = await this.prisma.financial_periods.findUnique({
      where: { periodCode },
    });

    if (!period) {
      throw new NotFoundException('Financial period not found');
    }

    // Get invoices for the period (needed for revenue calculation)
    const invoices = await this.prisma.invoices.findMany({
      where: {
        issueDate: {
          gte: period.startDate,
          lte: period.endDate,
        },
        status: {
          not: 'cancelled',
        },
      },
    });

    // Get all classes with revenue and costs
    const classes = await this.prisma.classes.findMany({
      where: {
        ...(location && { location: location as any }),
      },
      include: {
        students: {
          where: {
            ...(program && { learningTrack: program as any }),
          },
        },
        sessions: {
          where: {
            scheduledDate: {
              gte: period.startDate,
              lte: period.endDate,
            },
          },
          include: {
            instructors: true,
          },
        },
      },
    });

    // Calculate profitability for each class
    const classProfitabilityWithInvoices = classes.map((cls) => {
      const classInvoices = invoices.filter((inv) => inv.classId === cls.id);
      const revenue = classInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

      const instructorCosts = cls.sessions.reduce((sum, session) => {
        if (!session.instructor) return sum;
        const startTime = new Date(session.startTime);
        const endTime = new Date(session.endTime);
        const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        if (session.instructor.costType === 'hourly') {
          return sum + hours * session.instructor.costAmount;
        }
        // For monthly, we'd need to calculate prorated cost based on total sessions in period
        // For now, return 0 for monthly (should be calculated from expense records)
        return sum;
      }, 0);

      const netProfit = revenue - instructorCosts;
      const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

      return {
        classId: cls.id,
        className: cls.name,
        location: cls.location,
        revenue,
        instructorCost: instructorCosts,
        netProfit,
        margin,
        studentCount: cls.students.length,
        sessionCount: cls.sessions.length,
      };
    });

    const totalRevenue = classProfitabilityWithInvoices.reduce((sum, c) => sum + c.revenue, 0);
    const totalCost = classProfitabilityWithInvoices.reduce((sum, c) => sum + c.instructorCost, 0);
    const totalProfit = classProfitabilityWithInvoices.reduce((sum, c) => sum + c.netProfit, 0);
    const profitableClasses = classProfitabilityWithInvoices.filter((c) => c.margin > 0).length;
    const unprofitableClasses = classProfitabilityWithInvoices.filter((c) => c.margin <= 0).length;
    const averageMargin = classProfitabilityWithInvoices.length > 0
      ? classProfitabilityWithInvoices.reduce((sum, c) => sum + c.margin, 0) / classProfitabilityWithInvoices.length
      : 0;

    return {
      period: {
        code: period.periodCode,
        startDate: period.startDate,
        endDate: period.endDate,
      },
      classes: classProfitabilityWithInvoices,
      summary: {
        totalClasses: classProfitabilityWithInvoices.length,
        profitableClasses,
        unprofitableClasses,
        totalRevenue,
        totalCost,
        totalProfit,
        averageMargin,
      },
    };
  }

  async getInstructorCosts(periodCode: string, instructorId?: string) {
    const period = await this.prisma.financial_periods.findUnique({
      where: { periodCode },
    });

    if (!period) {
      throw new NotFoundException('Financial period not found');
    }

    // Get instructor expenses in period
    const expensesQuery: any = {
      status: 'paid',
      paidDate: {
        gte: period.startDate,
        lte: period.endDate,
      },
      periodId: period.id,
      instructorId: instructorId || undefined,
    };

    const expenses = await this.prisma.expenses.findMany({
      where: expensesQuery,
      include: {
        instructors: {
          include: {
            users: true,
          },
        },
      },
    });

    // Get sessions for revenue calculation
    const sessions = await this.prisma.sessions.findMany({
      where: {
        scheduledDate: {
          gte: period.startDate,
          lte: period.endDate,
        },
        instructorId: instructorId || undefined,
        status: 'completed',
      },
      include: {
        classes: true,
      },
    });

    // Group by instructor
    const instructorMap = new Map();

    expenses.forEach((exp) => {
      if (!exp.instructor) return;
      const instId = exp.instructor.id;
      if (!instructorMap.has(instId)) {
        instructorMap.set(instId, {
          instructorId: instId,
          instructorName: `${exp.instructor.user?.firstName || ''} ${exp.instructor.user?.lastName || ''}`.trim(),
          costType: exp.instructor.costType,
          sessions: 0,
          hours: 0,
          totalCost: 0,
          revenueGenerated: 0,
        });
      }
      const inst = instructorMap.get(instId);
      inst.totalCost += exp.amount;
    });

    // Calculate sessions and hours
    sessions.forEach((session) => {
      if (!session.instructorId) return;
      const inst = instructorMap.get(session.instructorId);
      if (inst) {
        inst.sessions += 1;
        const hours = (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60 * 60);
        inst.hours += hours;
      }
    });

    // Calculate revenue generated (from invoices for classes taught by instructor)
    const instructorClasses = await this.prisma.classes.findMany({
      where: {
        instructorId: instructorId || undefined,
      },
      include: {
        students: true,
      },
    });

    const classIds = instructorClasses.map((c) => c.id);
    const invoices = await this.prisma.invoices.findMany({
      where: {
        classId: {
          in: classIds,
        },
        issueDate: {
          gte: period.startDate,
          lte: period.endDate,
        },
        status: {
          not: 'cancelled',
        },
      },
    });

    invoices.forEach((inv) => {
      if (!inv.classId) return;
      const cls = instructorClasses.find((c) => c.id === inv.classId);
      if (cls && cls.instructorId) {
        const inst = instructorMap.get(cls.instructorId);
        if (inst) {
          inst.revenueGenerated += inv.totalAmount;
        }
      }
    });

    const instructorCosts = Array.from(instructorMap.values()).map((inst) => ({
      ...inst,
      costPerSession: inst.sessions > 0 ? inst.totalCost / inst.sessions : 0,
      costPerHour: inst.hours > 0 ? inst.totalCost / inst.hours : 0,
      netContribution: inst.revenueGenerated - inst.totalCost,
      efficiency: inst.revenueGenerated > 0 ? (inst.totalCost / inst.revenueGenerated) * 100 : 0,
    }));

    const totalCost = instructorCosts.reduce((sum, inst) => sum + inst.totalCost, 0);
    const totalRevenue = instructorCosts.reduce((sum, inst) => sum + inst.revenueGenerated, 0);
    const totalSessions = instructorCosts.reduce((sum, inst) => sum + inst.sessions, 0);
    const totalHours = instructorCosts.reduce((sum, inst) => sum + inst.hours, 0);
    const costRatio = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;

    return {
      period: {
        code: period.periodCode,
        startDate: period.startDate,
        endDate: period.endDate,
      },
      instructors: instructorCosts,
      summary: {
        totalInstructors: instructorCosts.length,
        totalCost,
        totalRevenue,
        totalSessions,
        totalHours,
        costRatio,
      },
    };
  }
}

