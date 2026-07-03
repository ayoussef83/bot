import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { ProviderSendResult, WhatsAppProvider } from './interfaces';

/**
 * 360dialog WhatsApp Business API provider (Meta BSP).
 * Config lives in IntegrationConfig(provider: whatsapp_360dialog):
 *   secrets: { apiKey }
 *   config:  { baseUrl?, defaultLanguage?, templateMap? }
 * templateMap maps internal template keys (renewal_session8, welcome_onboarding,
 * progress_report_published, session_reminder, ...) to approved 360dialog template
 * names. If a template mapping exists -> send as WhatsApp TEMPLATE message
 * (works outside the 24h window). Otherwise -> plain session text message.
 */
@Injectable()
export class Dialog360WhatsAppProvider implements WhatsAppProvider {
  private readonly logger = new Logger(Dialog360WhatsAppProvider.name);
  constructor(private prisma: PrismaService) {}

  private normalizePhone(to: string): string {
    let p = to.replace(/[^\d]/g, '');
    if (p.startsWith('0')) p = `2${p}`; // Egyptian local -> intl (20...)
    if (!p.startsWith('20') && p.length === 10) p = `20${p}`;
    return p;
  }

  async send(to: string, message: string, template?: string, payload?: any): Promise<ProviderSendResult> {
    const cfg = await this.prisma.integrationConfig.findUnique({
      where: { provider: 'whatsapp_360dialog' },
    });
    if (!cfg || !cfg.isActive) {
      throw new Error('360dialog not configured/active');
    }
    const secrets = (cfg.secrets as any) ?? {};
    const conf = (cfg.config as any) ?? {};
    const apiKey: string | undefined = secrets.apiKey;
    if (!apiKey) throw new Error('360dialog apiKey missing');

    const baseUrl: string = conf.baseUrl || 'https://waba-v2.360dialog.io';
    const lang: string = conf.defaultLanguage || 'ar';
    const templateMap: Record<string, string> = conf.templateMap || {};
    const phone = this.normalizePhone(to);

    const mappedTemplate = template ? templateMap[template] : undefined;
    const body = mappedTemplate
      ? {
          messaging_product: 'whatsapp',
          to: phone,
          type: 'template',
          template: {
            name: mappedTemplate,
            language: { code: lang },
            components: payload?.templateComponents ?? [
              { type: 'body', parameters: [{ type: 'text', text: message }] },
            ],
          },
        }
      : {
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: message },
        };

    const res = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: { 'D360-API-KEY': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      this.logger.warn(`360dialog send failed (${res.status}): ${JSON.stringify(data).slice(0, 300)}`);
      throw new Error(`360dialog error ${res.status}`);
    }
    return {
      success: true,
      provider: 'whatsapp-360dialog',
      messageId: data?.messages?.[0]?.id,
      response: data,
    };
  }
}
