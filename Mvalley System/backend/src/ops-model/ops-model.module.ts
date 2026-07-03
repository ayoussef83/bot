import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RenewalsService } from './renewals.service';
import { OpsWorkflowsService } from './ops-workflows.service';
import { PortfolioService } from './portfolio.service';
import {
  RenewalsController,
  SlotRequestsController,
  OpsAuditsController,
  PortfolioController,
} from './ops-model.controller';

@Module({
  imports: [PrismaModule],
  controllers: [RenewalsController, SlotRequestsController, OpsAuditsController, PortfolioController],
  providers: [RenewalsService, OpsWorkflowsService, PortfolioService],
  exports: [OpsWorkflowsService],
})
export class OpsModelModule {}
