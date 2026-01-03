import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { SendMessageDto } from './dto';
import { EMAIL_PROVIDER, SMS_PROVIDER, WHATSAPP_PROVIDER } from './providers/tokens';
import type { EmailProvider, SmsProvider, WhatsAppProvider } from './providers/interfaces';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @Inject(EMAIL_PROVIDER) private emailProvider: EmailProvider,
    @Inject(SMS_PROVIDER) private smsProvider: SmsProvider,
    @Inject(WHATSAPP_PROVIDER) private whatsappProvider: WhatsAppProvider,
  ) {}

  async sendMessage(dto: SendMessageDto) {
    // Create notification record
    const notification = await this.prisma.notifications.create({
      data: {
        channel: dto.channel,
        recipient: dto.recipient,
        template: dto.template,
        subject: dto.subject,
        message: dto.message,
        payload: dto.payload ? JSON.stringify(dto.payload) : null,
        studentId: dto.studentId,
        leadId: dto.leadId,
        parentId: dto.parentId,
        status: 'pending',
      },
    });

    try {
      // Send via appropriate channel
      let result;
      switch (dto.channel) {
        case 'email':
          result = await this.emailProvider.send(
            dto.recipient,
            dto.subject || '',
            dto.message,
            dto.template,
            dto.payload,
          );
          break;
        case 'sms':
          result = await this.smsProvider.send(
            dto.recipient,
            dto.message,
            dto.template,
            dto.payload,
          );
          break;
        case 'whatsapp':
          result = await this.whatsappProvider.send(
            dto.recipient,
            dto.message,
            dto.template,
            dto.payload,
          );
          break;
        default:
          throw new Error(`Unsupported channel: ${dto.channel}`);
      }

      // Update notification status
      await this.prisma.notifications.update({
        where: { id: notification.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

      return { ...notification, status: 'sent', sentAt: new Date() };
    } catch (error) {
      // Update notification status to failed
      await this.prisma.notifications.update({
        where: { id: notification.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }

  async findAll(filters?: {
    channel?: NotificationChannel;
    status?: NotificationStatus;
    studentId?: string;
    leadId?: string;
  }) {
    return this.prisma.notifications.findMany({
      where: {
        ...(filters?.channel && { channel: filters.channel }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.studentId && { studentId: filters.studentId }),
        ...(filters?.leadId && { leadId: filters.leadId }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });
  }

  async findOne(id: string) {
    return this.prisma.notifications.findUnique({
      where: { id },
    });
  }
}

