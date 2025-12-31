import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { ExpenseCategoriesService } from './expense-categories.service';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('finance/expense-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExpenseCategoriesController {
  constructor(private readonly expenseCategoriesService: ExpenseCategoriesService) {}

  @Post()
  @Roles('super_admin', 'accounting')
  async create(@Body() createExpenseCategoryDto: CreateExpenseCategoryDto) {
    return this.expenseCategoriesService.create(createExpenseCategoryDto);
  }

  @Get()
  @Roles('super_admin', 'management', 'accounting', 'operations')
  async findAll() {
    return this.expenseCategoriesService.findAll();
  }

  @Get(':id')
  @Roles('super_admin', 'management', 'accounting', 'operations')
  async findOne(@Param('id') id: string) {
    return this.expenseCategoriesService.findOne(id);
  }

  @Put(':id')
  @Roles('super_admin', 'accounting')
  async update(@Param('id') id: string, @Body() updateData: Partial<CreateExpenseCategoryDto>) {
    return this.expenseCategoriesService.update(id, updateData);
  }

  @Delete(':id')
  @Roles('super_admin', 'accounting')
  async remove(@Param('id') id: string) {
    return this.expenseCategoriesService.remove(id);
  }
}



