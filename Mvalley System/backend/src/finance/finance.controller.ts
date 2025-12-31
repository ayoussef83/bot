import { Controller, Get, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('overview')
  @Roles('super_admin', 'management', 'accounting', 'operations')
  async getOverview() {
    return this.financeService.getOverview();
  }

  @Get('periods')
  @Roles('super_admin', 'management', 'accounting', 'operations')
  async getPeriods() {
    return this.financeService.getFinancialPeriods();
  }
}
