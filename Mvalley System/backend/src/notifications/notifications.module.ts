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
import { Dialog360WhatsAppProvider } from './providers/dialog360-whatsapp.provider';

// Mock only when explicitly requested — NODE_ENV=local on the datacenter stack
// was silently mocking all channels (see COORDINATOR.md notifications note).
const useMocks = process.env.MOCK_PROVIDERS === '1';

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
    Dialog360WhatsAppProvider,
    {
      provide: EMAIL_PROVIDER,
      useExisting: useMocks ? MockEmailProvider : EmailService,
    },
    {
      provide: SMS_PROVIDER,
      useExisting: useMocks ? MockSmsProvider : SmsService,
    },
    {
      // WhatsApp via 360dialog (Meta BSP). Falls back to SMS in NotificationsService.
      provide: WHATSAPP_PROVIDER,
      useExisting: useMocks ? MockWhatsAppProvider : Dialog360WhatsAppProvider,
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

