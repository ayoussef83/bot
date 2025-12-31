import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { CashAccountsService } from './cash-accounts.service';
import { CreateCashAccountDto } from './dto/create-cash-account.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('finance/cash-accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CashAccountsController {
  constructor(private readonly cashAccountsService: CashAccountsService) {}

  @Post()
  @Roles('super_admin', 'accounting')
  async create(@Body() createCashAccountDto: CreateCashAccountDto) {
    return this.cashAccountsService.create(createCashAccountDto);
  }

  @Get()
  @Roles('super_admin', 'management', 'accounting', 'operations')
  async findAll() {
    return this.cashAccountsService.findAll();
  }

  @Get(':id')
  @Roles('super_admin', 'management', 'accounting', 'operations')
  async findOne(@Param('id') id: string) {
    return this.cashAccountsService.findOne(id);
  }

  @Put(':id')
  @Roles('super_admin', 'accounting')
  async update(@Param('id') id: string, @Body() updateData: Partial<CreateCashAccountDto>) {
    return this.cashAccountsService.update(id, updateData);
  }

  @Delete(':id')
  @Roles('super_admin', 'accounting')
  async remove(@Param('id') id: string) {
    return this.cashAccountsService.remove(id);
  }
}



