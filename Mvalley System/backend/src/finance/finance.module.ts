import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { SnapshotsService } from './snapshots.service';
import { SnapshotsController } from './snapshots.controller';

@Module({
  providers: [FinanceService, PaymentsService, ExpensesService, SnapshotsService],
  controllers: [
    FinanceController,
    PaymentsController,
    ExpensesController,
    SnapshotsController,
  ],
  exports: [PaymentsService, ExpensesService, SnapshotsService],
})
export class FinanceModule {}

