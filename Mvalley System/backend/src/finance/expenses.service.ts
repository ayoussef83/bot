import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateExpenseDto, createdBy: string) {
    const expense = await this.prisma.expense.create({
      data: {
        ...data,
        createdBy,
      },
      include: {
        instructor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: createdBy,
        action: 'create',
        entityType: 'Expense',
        entityId: expense.id,
      },
    });

    return expense;
  }

  async findAll(category?: string, startDate?: string, endDate?: string) {
    return this.prisma.expense.findMany({
      where: {
        ...(category && { category: category as any }),
        ...(startDate || endDate
          ? {
              expenseDate: {
                ...(startDate && { gte: new Date(startDate) }),
                ...(endDate && { lte: new Date(endDate) }),
              },
            }
          : {}),
        deletedAt: null,
      },
      include: {
        instructor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        expenseDate: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, deletedAt: null },
      include: {
        instructor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  async update(id: string, data: UpdateExpenseDto, updatedBy: string) {
    const expense = await this.prisma.expense.update({
      where: { id },
      data,
      include: {
        instructor: true,
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: updatedBy,
        action: 'update',
        entityType: 'Expense',
        entityId: id,
        changes: JSON.stringify(data),
      },
    });

    return expense;
  }

  async remove(id: string, deletedBy: string) {
    const expense = await this.prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: deletedBy,
        action: 'delete',
        entityType: 'Expense',
        entityId: id,
      },
    });

    return expense;
  }

  async getExpenseBreakdown(startDate: string, endDate: string) {
    const expenses = await this.prisma.expense.findMany({
      where: {
        expenseDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        deletedAt: null,
      },
    });

    const breakdown = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = 0;
      }
      acc[expense.category] += expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return breakdown;
  }
}

