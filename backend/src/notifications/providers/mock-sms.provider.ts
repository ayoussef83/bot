import { Injectable } from '@nestjs/common';
import type { ProviderSendResult, SmsProvider } from './interfaces';

@Injectable()
export class MockSmsProvider implements SmsProvider {
  async send(
    to: string,
    message: string,
    template?: string,
    payload?: any,
  ): Promise<ProviderSendResult> {
    // eslint-disable-next-line no-console
    console.log('[MOCK_SMS]', { to, message, template, payload });
    return { success: true, provider: 'mock-sms', messageId: `mock-sms-${Date.now()}` };
  }
}


