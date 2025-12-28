import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getSummary(startDate: string, endDate: string) {
    const payments = await this.prisma.payment.findMany({
      where: {
        paymentDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        status: 'completed',
        deletedAt: null,
      },
    });

    const expenses = await this.prisma.expense.findMany({
      where: {
        expenseDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        deletedAt: null,
      },
    });

    const cashIn = payments.reduce((sum, p) => sum + p.amount, 0);
    const cashOut = expenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      cashIn,
      cashOut,
      net: cashIn - cashOut,
      paymentCount: payments.length,
      expenseCount: expenses.length,
    };
  }
}

