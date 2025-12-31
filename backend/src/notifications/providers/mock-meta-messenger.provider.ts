import { Injectable } from '@nestjs/common';
import type { MetaMessengerProvider, ProviderSendResult } from './interfaces';

@Injectable()
export class MockMetaMessengerProvider implements MetaMessengerProvider {
  async send(
    to: string,
    message: string,
    template?: string,
    payload?: any,
  ): Promise<ProviderSendResult> {
    // eslint-disable-next-line no-console
    console.log('[MOCK_META_MESSENGER]', { to, message, template, payload });
    return { success: true, provider: 'mock-meta-messenger', messageId: `mock-meta-${Date.now()}` };
  }
}


