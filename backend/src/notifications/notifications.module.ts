import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { WhatsAppService } from './whatsapp.service';

@Module({
  imports: [PrismaModule],
  providers: [
    NotificationsService,
    EmailService,
    SmsService,
    WhatsAppService,
  ],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}

