import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SettingsModule } from '../settings/settings.module';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    NotificationsModule,
    SettingsModule,
  ],
  providers: [SchedulerService],
  controllers: [SchedulerController],
})
export class SchedulerModule {}

