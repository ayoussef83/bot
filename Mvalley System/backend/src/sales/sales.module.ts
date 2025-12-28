import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { FollowUpsService } from './follow-ups.service';
import { FollowUpsController } from './follow-ups.controller';

@Module({
  providers: [LeadsService, FollowUpsService],
  controllers: [LeadsController, FollowUpsController],
  exports: [LeadsService],
})
export class SalesModule {}

