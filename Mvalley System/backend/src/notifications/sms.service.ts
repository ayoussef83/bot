import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { sendSmsMisr, SmsMisrError, SmsMisrLanguage } from './smsmisr.client';

@Injectable()
export class SmsService {
  constructor(private prisma: PrismaService) {}

  private normalizeMobile(to: string) {
    // Accept: +2012..., 2012..., 012...
    const raw = (to || '').trim().replace(/\s+/g, '');
    if (!raw) return '';
    if (raw.startsWith('+')) return raw.slice(1);
    if (raw.startsWith('00')) return raw.slice(2);
    if (raw.startsWith('0')) return `20${raw.slice(1)}`;
    return raw;
  }

  async send(
    to: string,
    message: string,
    template?: string,
    payload?: any,
  ) {
    const cfg = await this.prisma.integration_configs.findUnique({
      where: { provider: 'smsmisr' },
    });

    if (!cfg || !cfg.isActive) {
      throw new BadRequestException('SMSMisr is not configured or not active');
    }

    const config = (cfg.config || {}) as any;
    const secrets = (cfg.secrets || {}) as any;

    const username = String(config.username || '').trim();
    const sender = String(config.senderId || '').trim();
    const apiUrl = String(config.apiUrl || 'https://smsmisr.com/api/SMS/').trim();
    const password = String(secrets.password || '').trim();
    const environment = Number(config.environment || 1) as 1 | 2; // default: live
    const language = Number(config.language || 1) as SmsMisrLanguage; // default: english

    if (!username || !password || !sender) {
      throw new BadRequestException(
        'SMSMisr settings are incomplete (username/password/senderId required)',
      );
    }

    const mobile = this.normalizeMobile(to);
    if (!mobile) throw new BadRequestException('Invalid recipient mobile');

    let resp: any;
    try {
      resp = await sendSmsMisr({
        apiUrl,
        environment,
        username,
        password,
        sender,
        mobile,
        language,
        message,
      });
    } catch (e: any) {
      if (e instanceof SmsMisrError) {
        throw new BadRequestException(
          `SMSMisr failed (${e.code || 'unknown'}): ${e.message}`,
        );
      }
      throw e;
    }

    return { success: true, provider: 'smsmisr', response: resp };
  }
}

