import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  constructor(private prisma: PrismaService) {}

  async send(
    to: string,
    subject: string,
    message: string,
    template?: string,
    payload?: any,
  ) {
    const cfg = await this.prisma.integrationConfig.findUnique({
      where: { provider: 'zoho_email' },
    });

    if (!cfg || !cfg.isActive) {
      throw new BadRequestException('Zoho Email is not configured or not active');
    }

    const config = (cfg.config || {}) as any;
    const secrets = (cfg.secrets || {}) as any;

    const host = String(config.host || 'smtp.zoho.com').trim();
    const port = Number(config.port || 587);
    const username = String(config.username || config.fromEmail || '').trim();
    const fromEmail = String(config.fromEmail || username).trim();
    const fromName = String(config.fromName || 'MV-OS').trim();
    const password = String(secrets.password || '').trim();
    const secure = Boolean(config.secure ?? port === 465);

    if (!username || !password || !fromEmail) {
      throw new BadRequestException(
        'Zoho Email settings are incomplete (username/password/fromEmail required)',
      );
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure, // true for 465, false for other ports
        auth: {
          user: username,
          pass: password,
        },
      });

      const mailOptions = {
        from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
        to,
        subject,
        html: message, // Treat message as HTML
      };

      const info = await transporter.sendMail(mailOptions);

      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      throw new BadRequestException(`Failed to send email: ${error.message}`);
    }
  }
}

