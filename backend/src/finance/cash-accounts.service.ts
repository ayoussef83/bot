import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCashAccountDto } from './dto/create-cash-account.dto';

@Injectable()
export class CashAccountsService {
  constructor(private prisma: PrismaService) {}

  async create(createCashAccountDto: CreateCashAccountDto) {
    return this.prisma.cashAccount.create({
      data: {
        ...createCashAccountDto,
        balance: createCashAccountDto.balance || 0,
        currency: createCashAccountDto.currency || 'EGP',
        isActive: createCashAccountDto.isActive !== undefined ? createCashAccountDto.isActive : true,
      },
    });
  }

  async findAll() {
    return this.prisma.cashAccount.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.cashAccount.findUnique({
      where: { id },
      include: {
        payments: {
          take: 10,
          orderBy: { receivedDate: 'desc' },
        },
        expenses: {
          take: 10,
          orderBy: { expenseDate: 'desc' },
        },
      },
    });
  }

  async update(id: string, updateData: Partial<CreateCashAccountDto>) {
    return this.prisma.cashAccount.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    // Check if account has transactions
    const paymentCount = await this.prisma.payment.count({
      where: { cashAccountId: id },
    });
    const expenseCount = await this.prisma.expense.count({
      where: { cashAccountId: id },
    });

    if (paymentCount > 0 || expenseCount > 0) {
      // Soft delete by marking as inactive
      return this.prisma.cashAccount.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return this.prisma.cashAccount.delete({
      where: { id },
    });
  }
}






