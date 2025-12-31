import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarketingPlatform } from '@prisma/client';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('whatsapp')
  whatsapp(@Body() body: any) {
    // TODO: implement WhatsApp ingestion
    // eslint-disable-next-line no-console
    console.log('[WEBHOOK][WHATSAPP]', JSON.stringify(body));
    return { ok: true };
  }

  // Meta webhook verification (Messenger uses Page webhook)
  @Get('meta/messenger')
  metaMessengerVerify(
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') token?: string,
    @Query('hub.challenge') challenge?: string,
  ) {
    const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || '';
    if (mode === 'subscribe' && token && verifyToken && token === verifyToken) {
      return challenge || '';
    }
    return { ok: false };
  }

  @Post('meta/messenger')
  async metaMessenger(@Body() body: any) {
    // Minimal Messenger ingestion:
    // - Finds ChannelAccount by recipient.page_id
    // - Upserts Participant (PSID) and Conversation
    // - Creates Message records

    if (body?.object !== 'page') return { ok: true };

    const entries: any[] = Array.isArray(body?.entry) ? body.entry : [];
    for (const entry of entries) {
      const messaging: any[] = Array.isArray(entry?.messaging) ? entry.messaging : [];
      for (const evt of messaging) {
        const msg = evt?.message;
        if (!msg || msg.is_echo) continue;

        const senderId = String(evt?.sender?.id || '');
        const pageId = String(evt?.recipient?.id || '');
        const mid = String(msg?.mid || '');
        const text = typeof msg?.text === 'string' ? msg.text : '';
        const tsMs = Number(evt?.timestamp || Date.now());

        if (!senderId || !pageId || !mid) continue;

        const channel = await this.prisma.channelAccount.findFirst({
          where: { platform: MarketingPlatform.facebook_page, externalId: pageId },
        });
        if (!channel) continue;

        const participant = await this.prisma.participant.upsert({
          where: { platformUserId: senderId },
          update: { lastSeenAt: new Date() },
          create: {
            platformUserId: senderId,
            type: 'unknown',
            firstSeenAt: new Date(),
            lastSeenAt: new Date(),
          },
        });

        const threadId = `${pageId}:${senderId}`;
        const sentAt = new Date(tsMs);

        const conversation = await this.prisma.conversation.upsert({
          where: { platform_externalThreadId: { platform: MarketingPlatform.facebook_page, externalThreadId: threadId } },
          update: { lastMessageAt: sentAt },
          create: {
            channelAccountId: channel.id,
            platform: MarketingPlatform.facebook_page,
            externalThreadId: threadId,
            participantId: participant.id,
            status: 'new',
            source: 'messenger',
            firstMessageAt: sentAt,
            lastMessageAt: sentAt,
          },
        });

        const existing = await this.prisma.message.findFirst({
          where: { conversationId: conversation.id, externalMessageId: mid },
        });
        if (existing) continue;

        await this.prisma.message.create({
          data: {
            conversationId: conversation.id,
            externalMessageId: mid,
            direction: 'inbound',
            type: 'text',
            content: text,
            sentAt,
            senderId: participant.id,
            metadata: evt,
          },
        });
      }
    }

    return { ok: true };
  }
}


