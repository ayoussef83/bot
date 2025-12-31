import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { WhatsAppService } from './whatsapp.service';
import { EMAIL_PROVIDER, META_MESSENGER_PROVIDER, SMS_PROVIDER, WHATSAPP_PROVIDER } from './providers/tokens';
import { MockEmailProvider } from './providers/mock-email.provider';
import { MockSmsProvider } from './providers/mock-sms.provider';
import { MockWhatsAppProvider } from './providers/mock-whatsapp.provider';
import { MockMetaMessengerProvider } from './providers/mock-meta-messenger.provider';

@Module({
  imports: [PrismaModule],
  providers: [
    NotificationsService,
    EmailService,
    SmsService,
    WhatsAppService,
    MockEmailProvider,
    MockSmsProvider,
    MockWhatsAppProvider,
    MockMetaMessengerProvider,
    {
      provide: EMAIL_PROVIDER,
      useExisting:
        process.env.NODE_ENV === 'local' ? MockEmailProvider : EmailService,
    },
    {
      provide: SMS_PROVIDER,
      useExisting:
        process.env.NODE_ENV === 'local' ? MockSmsProvider : SmsService,
    },
    {
      provide: WHATSAPP_PROVIDER,
      useExisting:
        process.env.NODE_ENV === 'local' ? MockWhatsAppProvider : WhatsAppService,
    },
    {
      provide: META_MESSENGER_PROVIDER,
      useExisting: MockMetaMessengerProvider,
    },
  ],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}

