import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReconciliationService {
  constructor(private prisma: PrismaService) {}

  async getReconciliation(periodCode: string) {
    const period = await this.prisma.financial_periods.findUnique({
      where: { periodCode },
    });

    if (!period) {
      throw new Error('Period not found');
    }

    // Expected Revenue: Sum of invoices issued in period
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
      include: {
        paymentAllocations: {
          include: {
            payment: true,
          },
        },
      },
    });

    const expectedRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const paidAmount = invoices.reduce((sum, inv) => {
      return sum + inv.paymentAllocations.reduce((allocSum, alloc) => allocSum + alloc.amount, 0);
    }, 0);

    // Actual Revenue: Sum of payments received in period
    const payments = await this.prisma.payments.findMany({
      where: {
        receivedDate: {
          gte: period.startDate,
          lte: period.endDate,
        },
        status: 'received',
      },
    });

    const actualRevenue = payments.reduce((sum, pay) => sum + pay.amount, 0);

    // Get reconciliation records for this period
    const reconciliationRecords = await this.prisma.reconciliation_records.findMany({
      where: {
        periodId: period.id,
      },
      include: {
        period: true,
      },
      orderBy: {
        reconciliationDate: 'desc',
      },
    });

    const totalAdjustments = reconciliationRecords.reduce((sum, rec) => sum + rec.amount, 0);

    // Calculate variance
    const variance = actualRevenue - expectedRevenue;
    const variancePercent = expectedRevenue > 0 ? (variance / expectedRevenue) * 100 : 0;

    // Reconciliation items: Match invoices with payments
    const reconciliationItems = invoices.map((inv) => {
      const allocatedPayments = inv.paymentAllocations.map((alloc) => alloc.payment);
      const allocatedAmount = inv.paymentAllocations.reduce((sum, alloc) => sum + alloc.amount, 0);
      const unallocatedAmount = inv.totalAmount - allocatedAmount;

      let status: 'matched' | 'partial' | 'missing' | 'overpaid' = 'matched';
      if (allocatedAmount === 0) {
        status = 'missing';
      } else if (allocatedAmount < inv.totalAmount) {
        status = 'partial';
      } else if (allocatedAmount > inv.totalAmount) {
        status = 'overpaid';
      }

      return {
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceAmount: inv.totalAmount,
        allocatedAmount,
        unallocatedAmount,
        status,
        dueDate: inv.dueDate,
        payments: allocatedPayments.map((pay) => ({
          paymentId: pay.id,
          paymentNumber: pay.paymentNumber,
          amount: pay.amount,
          receivedDate: pay.receivedDate,
        })),
      };
    });

    // Unallocated payments (payments not linked to any invoice)
    const allocatedPaymentIds = new Set(
      invoices.flatMap((inv) => inv.paymentAllocations.map((alloc) => alloc.paymentId))
    );
    const unallocatedPayments = payments
      .filter((pay) => !allocatedPaymentIds.has(pay.id))
      .map((pay) => ({
        paymentId: pay.id,
        paymentNumber: pay.paymentNumber,
        amount: pay.amount,
        receivedDate: pay.receivedDate,
        status: 'unallocated' as const,
      }));

    return {
      period: {
        code: period.periodCode,
        startDate: period.startDate,
        endDate: period.endDate,
        status: period.status,
      },
      summary: {
        expectedRevenue,
        actualRevenue,
        paidAmount,
        variance,
        variancePercent,
        totalAdjustments,
      },
      reconciliationItems,
      unallocatedPayments,
      reconciliationRecords,
    };
  }

  async createReconciliationRecord(
    periodCode: string,
    data: {
      type: string;
      amount: number;
      description: string;
      relatedInvoiceId?: string;
      relatedPaymentId?: string;
      relatedExpenseId?: string;
      notes?: string;
    }
  ) {
    const period = await this.prisma.financial_periods.findUnique({
      where: { periodCode },
    });

    if (!period) {
      throw new Error('Period not found');
    }

    if (period.status === 'locked') {
      throw new Error('Cannot create reconciliation record for locked period');
    }

    // Generate reconciliation number
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const count = await this.prisma.reconciliation_records.count({
      where: {
        reconciliationNumber: {
          startsWith: `REC-${year}-${month}-`,
        },
      },
    });
    const reconciliationNumber = `REC-${year}-${month}-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.reconciliation_records.create({
      data: {
        reconciliationNumber,
        periodId: period.id,
        reconciliationDate: new Date(),
        type: data.type as 'adjustment' | 'correction' | 'write_off' | 'reversal',
        amount: data.amount,
        description: data.description,
        relatedInvoiceId: data.relatedInvoiceId,
        relatedPaymentId: data.relatedPaymentId,
        relatedExpenseId: data.relatedExpenseId,
        notes: data.notes,
      },
    });
  }

  async closePeriod(periodCode: string) {
    const period = await this.prisma.financial_periods.findUnique({
      where: { periodCode },
    });

    if (!period) {
      throw new Error('Period not found');
    }

    if (period.status !== 'open') {
      throw new Error('Period is not open');
    }

    return this.prisma.financial_periods.update({
      where: { periodCode },
      data: {
        status: 'closed',
        closedAt: new Date(),
      },
    });
  }

  async lockPeriod(periodCode: string) {
    const period = await this.prisma.financial_periods.findUnique({
      where: { periodCode },
    });

    if (!period) {
      throw new Error('Period not found');
    }

    if (period.status !== 'closed') {
      throw new Error('Period must be closed before locking');
    }

    return this.prisma.financial_periods.update({
      where: { periodCode },
      data: {
        status: 'locked',
        lockedAt: new Date(),
      },
    });
  }
}

