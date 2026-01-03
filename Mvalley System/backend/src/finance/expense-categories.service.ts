import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';

@Injectable()
export class ExpenseCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createExpenseCategoryDto: CreateExpenseCategoryDto) {
    return this.prisma.expenses_categories.create({
      data: createExpenseCategoryDto,
    });
  }

  async findAll() {
    return this.prisma.expenses_categories.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.expenses_categories.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateData: Partial<CreateExpenseCategoryDto>) {
    return this.prisma.expenses_categories.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    // Soft delete by marking as inactive
    return this.prisma.expenses_categories.update({
      where: { id },
      data: { isActive: false },
    });
  }
}



