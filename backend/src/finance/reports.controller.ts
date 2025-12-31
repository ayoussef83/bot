import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('finance/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('profit-loss')
  @Roles('super_admin', 'management', 'accounting', 'operations')
  async getProfitAndLoss(
    @Query('period') period: string,
    @Query('location') location?: string,
    @Query('program') program?: string,
  ) {
    return this.reportsService.getProfitAndLoss(period, location, program);
  }

  @Get('cash-flow')
  @Roles('super_admin', 'management', 'accounting', 'operations')
  async getCashFlow(
    @Query('period') period: string,
    @Query('cashAccountId') cashAccountId?: string,
  ) {
    return this.reportsService.getCashFlow(period, cashAccountId);
  }

  @Get('class-profitability')
  @Roles('super_admin', 'management', 'accounting', 'operations')
  async getClassProfitability(
    @Query('period') period: string,
    @Query('location') location?: string,
    @Query('program') program?: string,
  ) {
    return this.reportsService.getClassProfitability(period, location, program);
  }

  @Get('instructor-costs')
  @Roles('super_admin', 'management', 'accounting', 'operations')
  async getInstructorCosts(
    @Query('period') period: string,
    @Query('instructorId') instructorId?: string,
  ) {
    return this.reportsService.getInstructorCosts(period, instructorId);
  }
}






