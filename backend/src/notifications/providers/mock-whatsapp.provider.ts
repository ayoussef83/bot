import { Injectable } from '@nestjs/common';
import type { ProviderSendResult, WhatsAppProvider } from './interfaces';

@Injectable()
export class MockWhatsAppProvider implements WhatsAppProvider {
  async send(
    to: string,
    message: string,
    template?: string,
    payload?: any,
  ): Promise<ProviderSendResult> {
    // eslint-disable-next-line no-console
    console.log('[MOCK_WHATSAPP]', { to, message, template, payload });
    return { success: true, provider: 'mock-whatsapp', messageId: `mock-wa-${Date.now()}` };
  }
}


