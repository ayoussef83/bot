import { Injectable } from '@nestjs/common';
import type { EmailProvider, ProviderSendResult } from './interfaces';

@Injectable()
export class MockEmailProvider implements EmailProvider {
  async send(
    to: string,
    subject: string,
    message: string,
    template?: string,
    payload?: any,
  ): Promise<ProviderSendResult> {
    // Local-safe: never sends externally
    // eslint-disable-next-line no-console
    console.log('[MOCK_EMAIL]', { to, subject, message, template, payload });
    return { success: true, provider: 'mock-email', messageId: `mock-email-${Date.now()}` };
  }
}


