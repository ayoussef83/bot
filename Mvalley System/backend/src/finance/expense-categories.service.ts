import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';

@Injectable()
export class ExpenseCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createExpenseCategoryDto: CreateExpenseCategoryDto) {
    return this.prisma.expenseCategory.create({
      data: createExpenseCategoryDto,
    });
  }

  async findAll() {
    return this.prisma.expenseCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.expenseCategory.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateData: Partial<CreateExpenseCategoryDto>) {
    return this.prisma.expenseCategory.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    // Soft delete by marking as inactive
    return this.prisma.expenseCategory.update({
      where: { id },
      data: { isActive: false },
    });
  }
}



