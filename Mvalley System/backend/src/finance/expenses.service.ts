import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(createExpenseDto: CreateExpenseDto, userId?: string) {
    // Generate expense number
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const count = await this.prisma.expense.count({
      where: {
        expenseDate: {
          gte: new Date(year, now.getMonth(), 1),
          lt: new Date(year, now.getMonth() + 1, 1),
        },
      },
    });
    const expenseNumber = `EXP-${year}-${month}-${String(count + 1).padStart(4, '0')}`;

    // Get or create current period
    const periodCode = `${year}-${month}`;
    let period = await this.prisma.financialPeriod.findUnique({
      where: { periodCode },
    });

    if (!period) {
      const startDate = new Date(year, now.getMonth(), 1);
      const endDate = new Date(year, now.getMonth() + 1, 0);
      period = await this.prisma.financialPeriod.create({
        data: {
          periodCode,
          startDate,
          endDate,
          status: 'open',
        },
      });
    }

    // Update cash account balance if expense is paid
    if (createExpenseDto.status === 'paid' && createExpenseDto.cashAccountId) {
      await this.prisma.cashAccount.update({
        where: { id: createExpenseDto.cashAccountId },
        data: {
          balance: {
            decrement: createExpenseDto.amount,
          },
        },
      });
    }

    return this.prisma.expense.create({
      data: {
        ...createExpenseDto,
        expenseNumber,
        expenseDate: new Date(createExpenseDto.expenseDate),
        paidDate: createExpenseDto.paidDate ? new Date(createExpenseDto.paidDate) : null,
        periodId: period.id,
      },
      include: {
        category: true,
        instructor: {
          include: {
            user: true,
          },
        },
        cashAccount: true,
        period: true,
      },
    });
  }

  async findAll() {
    return this.prisma.expense.findMany({
      orderBy: { expenseDate: 'desc' },
      include: {
        category: true,
        instructor: {
          include: {
            user: true,
          },
        },
        cashAccount: true,
        period: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.expense.findUnique({
      where: { id },
      include: {
        category: true,
        instructor: {
          include: {
            user: true,
          },
        },
        cashAccount: true,
        period: true,
      },
    });
  }

  async approve(id: string, userId: string) {
    return this.prisma.expense.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date(),
      },
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
  }

  async markAsPaid(id: string, cashAccountId: string, paidDate: string, userId?: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    if (expense.status === 'paid') {
      throw new Error('Expense already marked as paid');
    }

    // Update cash account balance
    await this.prisma.cashAccount.update({
      where: { id: cashAccountId },
      data: {
        balance: {
          decrement: expense.amount,
        },
      },
    });

    return this.prisma.expense.update({
      where: { id },
      data: {
        status: 'paid',
        paidDate: new Date(paidDate),
        cashAccountId,
        paidBy: userId,
      },
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
  }

  async reverse(id: string, reason: string, userId?: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        cashAccount: true,
      },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    if (expense.status === 'reversed') {
      throw new Error('Expense already reversed');
    }

    // Reverse cash account balance if expense was paid
    if (expense.status === 'paid' && expense.cashAccount) {
      await this.prisma.cashAccount.update({
        where: { id: expense.cashAccountId },
        data: {
          balance: {
            increment: expense.amount,
          },
        },
      });
    }

    return this.prisma.expense.update({
      where: { id },
      data: {
        status: 'reversed',
        notes: expense.notes ? `${expense.notes}\n\nReversed: ${reason}` : `Reversed: ${reason}`,
      },
    });
  }
}
