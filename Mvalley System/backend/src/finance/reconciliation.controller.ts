import { Controller, Get, Post, Body, Query, UseGuards, Param } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('finance/reconciliation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Get()
  @Roles('super_admin', 'accounting')
  async getReconciliation(@Query('period') period: string) {
    return this.reconciliationService.getReconciliation(period);
  }

  @Post('records')
  @Roles('super_admin', 'accounting')
  async createReconciliationRecord(
    @Body()
    body: {
      periodCode: string;
      type: string;
      amount: number;
      description: string;
      relatedInvoiceId?: string;
      relatedPaymentId?: string;
      relatedExpenseId?: string;
      notes?: string;
    }
  ) {
    return this.reconciliationService.createReconciliationRecord(body.periodCode, body);
  }

  @Post('periods/:periodCode/close')
  @Roles('super_admin', 'accounting')
  async closePeriod(@Param('periodCode') periodCode: string) {
    return this.reconciliationService.closePeriod(periodCode);
  }

  @Post('periods/:periodCode/lock')
  @Roles('super_admin', 'accounting')
  async lockPeriod(@Param('periodCode') periodCode: string) {
    return this.reconciliationService.lockPeriod(periodCode);
  }
}



