import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateMessageDto) {
    // Unified messaging: if outbound and Facebook Page, send via Meta API first, then store message.
    if (data.direction === 'outbound') {
      const conv = await this.prisma.conversation.findUnique({
        where: { id: data.conversationId },
        include: { channelAccount: true, participant: true },
      });
      if (!conv) throw new NotFoundException('Conversation not found');

      if (conv.platform === 'facebook_page') {
        const pageToken = conv.channelAccount?.accessToken;
        const psid = conv.participant?.platformUserId;
        if (!pageToken) throw new BadRequestException('Facebook Page token is missing');
        if (!psid) throw new BadRequestException('Participant is missing platformUserId (PSID)');
        if (data.type !== 'text') throw new BadRequestException('Only text messages are supported for Messenger right now');
        if (!String(data.content || '').trim()) throw new BadRequestException('Message content is required');

        const graphVersion = process.env.META_GRAPH_VERSION || 'v20.0';
        const url = new URL(`https://graph.facebook.com/${graphVersion}/me/messages`);
        url.searchParams.set('access_token', pageToken);

        const resp = await fetch(url.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messaging_type: 'RESPONSE',
            recipient: { id: psid },
            message: { text: data.content || '' },
          }),
        });
        const json = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          throw new BadRequestException(json?.error?.message || 'Failed to send Messenger message');
        }
        const metaMessageId = String(json?.message_id || data.externalMessageId);

        const created = await this.prisma.message.create({
          data: {
            ...data,
            externalMessageId: metaMessageId,
            sentAt: data.sentAt ? new Date(data.sentAt) : new Date(),
            deliveredAt: data.deliveredAt ? new Date(data.deliveredAt) : null,
            readAt: data.readAt ? new Date(data.readAt) : null,
          },
          include: {
            conversation: { include: { participant: true } },
          },
        });

        await this.prisma.conversation.update({
          where: { id: data.conversationId },
          data: { lastMessageAt: created.sentAt },
        });

        // Update channel last sync
        if (conv.channelAccountId) {
          await this.prisma.channelAccount.update({
            where: { id: conv.channelAccountId },
            data: { lastSyncAt: new Date() },
          }).catch(() => undefined);
        }

        return created;
      }
    }

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



