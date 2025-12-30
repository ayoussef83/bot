import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateMessageDto) {
    const message = await this.prisma.message.create({
      data: {
        ...data,
        sentAt: data.sentAt ? new Date(data.sentAt) : new Date(),
        deliveredAt: data.deliveredAt ? new Date(data.deliveredAt) : null,
        readAt: data.readAt ? new Date(data.readAt) : null,
      },
      include: {
        conversation: {
          include: {
            participant: true,
          },
        },
      },
    });

    // Update conversation's lastMessageAt
    await this.prisma.conversation.update({
      where: { id: data.conversationId },
      data: {
        lastMessageAt: message.sentAt,
      },
    });

    return message;
  }

  async findAll(conversationId: string) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: {
        sentAt: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const message = await this.prisma.message.findUnique({
      where: { id },
      include: {
        conversation: {
          include: {
            participant: true,
            channelAccount: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }

  async updateDeliveryStatus(id: string, deliveredAt?: Date, readAt?: Date) {
    return this.prisma.message.update({
      where: { id },
      data: {
        ...(deliveredAt && { deliveredAt }),
        ...(readAt && { readAt }),
      },
    });
  }
}

