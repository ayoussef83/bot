import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { CashAccountsController } from './cash-accounts.controller';
import { CashAccountsService } from './cash-accounts.service';
import { ExpenseCategoriesController } from './expense-categories.controller';
import { ExpenseCategoriesService } from './expense-categories.service';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    FinanceController,
    PaymentsController,
    ExpensesController,
    CashAccountsController,
    ExpenseCategoriesController,
    InvoicesController,
  ],
  providers: [
    FinanceService,
    PaymentsService,
    ExpensesService,
    CashAccountsService,
    ExpenseCategoriesService,
    InvoicesService,
  ],
  exports: [
    FinanceService,
    PaymentsService,
    ExpensesService,
    CashAccountsService,
    ExpenseCategoriesService,
    InvoicesService,
  ],
})
export class FinanceModule {}
