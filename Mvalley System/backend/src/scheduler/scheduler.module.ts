import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SettingsModule } from '../settings/settings.module';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { EmailService } from '../notifications/email.service';
import { SmsService } from '../notifications/sms.service';
import { WhatsAppService } from '../notifications/whatsapp.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    NotificationsModule,
    SettingsModule,
  ],
  providers: [SchedulerService, EmailService, SmsService, WhatsAppService],
  controllers: [SchedulerController],
})
export class SchedulerModule {}

