import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { WhatsAppService } from './whatsapp.service';
import { SendMessageDto } from './dto';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private smsService: SmsService,
    private whatsappService: WhatsAppService,
  ) {}

  async sendMessage(dto: SendMessageDto) {
    // Create notification record
    const notification = await this.prisma.notification.create({
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
          result = await this.emailService.send(
            dto.recipient,
            dto.subject || '',
            dto.message,
            dto.template,
            dto.payload,
          );
          break;
        case 'sms':
          result = await this.smsService.send(
            dto.recipient,
            dto.message,
            dto.template,
            dto.payload,
          );
          break;
        case 'whatsapp':
          result = await this.whatsappService.send(
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
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

      return { ...notification, status: 'sent', sentAt: new Date() };
    } catch (error) {
      // Update notification status to failed
      await this.prisma.notification.update({
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
    return this.prisma.notification.findMany({
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
    return this.prisma.notification.findUnique({
      where: { id },
    });
  }
}

