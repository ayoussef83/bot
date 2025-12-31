import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('finance/expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @Roles('super_admin', 'accounting')
  async create(@Body() createExpenseDto: CreateExpenseDto, @Request() req) {
    return this.expensesService.create(createExpenseDto, req.user?.userId);
  }

  @Get()
  @Roles('super_admin', 'management', 'accounting', 'operations')
  async findAll() {
    return this.expensesService.findAll();
  }

  @Get(':id')
  @Roles('super_admin', 'management', 'accounting', 'operations')
  async findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }

  @Post(':id/approve')
  @Roles('super_admin', 'management', 'accounting')
  async approve(@Param('id') id: string, @Request() req) {
    return this.expensesService.approve(id, req.user?.userId);
  }

  @Post(':id/mark-paid')
  @Roles('super_admin', 'accounting')
  async markAsPaid(
    @Param('id') id: string,
    @Body() body: { cashAccountId: string; paidDate: string },
    @Request() req,
  ) {
    return this.expensesService.markAsPaid(id, body.cashAccountId, body.paidDate, req.user?.userId);
  }

  @Post(':id/reverse')
  @Roles('super_admin', 'accounting')
  async reverse(@Param('id') id: string, @Body() body: { reason: string }, @Request() req) {
    return this.expensesService.reverse(id, body.reason, req.user?.userId);
  }
}
