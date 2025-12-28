import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CreateExpenseDto, UpdateExpenseDto } from './dto';

@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @Roles(UserRole.super_admin, UserRole.accounting)
  create(@Body() createExpenseDto: CreateExpenseDto, @CurrentUser() user: any) {
    return this.expensesService.create(createExpenseDto, user.id);
  }

  @Get()
  @Roles(
    UserRole.super_admin,
    UserRole.management,
    UserRole.accounting,
  )
  findAll(
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.expensesService.findAll(category, startDate, endDate);
  }

  @Get('breakdown')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.accounting)
  getBreakdown(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.expensesService.getExpenseBreakdown(startDate, endDate);
  }

  @Get(':id')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.accounting)
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.super_admin, UserRole.accounting)
  update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @CurrentUser() user: any,
  ) {
    return this.expensesService.update(id, updateExpenseDto, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.super_admin)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.expensesService.remove(id, user.id);
  }
}

