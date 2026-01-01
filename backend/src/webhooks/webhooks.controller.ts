import { Body, Controller, ForbiddenException, Get, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
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

  @Get('meta/messenger')
  metaMessengerVerify(
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') token?: string,
    @Query('hub.challenge') challenge?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || '';
    if (mode === 'subscribe' && token && verifyToken && token === verifyToken) {
      if (res) res.status(200);
      return challenge || '';
    }
    if (res) res.status(403);
    throw new ForbiddenException('Invalid verify token');
  }

  @Post('meta/messenger')
  async metaMessenger(@Body() body: any) {
    if (body?.object !== 'page') return { ok: true };

    const entries: any[] = Array.isArray(body?.entry) ? body.entry : [];
    for (const entry of entries) {
      const messaging: any[] = Array.isArray(entry?.messaging) ? entry.messaging : [];
      for (const evt of messaging) {
        const senderId = String(evt?.sender?.id || '');
        const pageId = String(evt?.recipient?.id || '');
        const tsMs = Number(evt?.timestamp || Date.now());
        const sentAt = new Date(tsMs);

        if (!senderId || !pageId) continue;

        const channel = await this.prisma.channelAccount.findFirst({
          where: { platform: MarketingPlatform.facebook_page, externalId: pageId },
        });
        if (!channel) continue;

        const existingParticipant = await this.prisma.participant.findFirst({
          where: { platformUserId: senderId },
        });
        const participant = existingParticipant
          ? await this.prisma.participant.update({
              where: { id: existingParticipant.id },
              data: { lastSeenAt: new Date() },
            })
          : await this.prisma.participant.create({
              data: {
                platformUserId: senderId,
                type: 'unknown',
                firstSeenAt: new Date(),
                lastSeenAt: new Date(),
              },
            });

        const threadId = `${pageId}:${senderId}`;
        const conversation = await this.prisma.conversation.upsert({
          where: {
            platform_externalThreadId: {
              platform: MarketingPlatform.facebook_page,
              externalThreadId: threadId,
            },
          },
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

        // Enrich participant profile (best-effort). Meta doesn't provide age.
        if (!participant.name || !participant.profilePictureUrl) {
          try {
            const graphVersion = process.env.META_GRAPH_VERSION || 'v20.0';
            const url = new URL(`https://graph.facebook.com/${graphVersion}/${senderId}`);
            url.searchParams.set('fields', 'first_name,last_name,profile_pic');
            url.searchParams.set('access_token', channel.accessToken);
            const resp = await fetch(url.toString(), { method: 'GET' });
            const json = await resp.json().catch(() => ({}));
            if (resp.ok) {
              const first = String(json?.first_name || '').trim();
              const last = String(json?.last_name || '').trim();
              const name = `${first} ${last}`.trim();
              const pic = String(json?.profile_pic || '').trim();
              if (name || pic) {
                await this.prisma.participant.update({
                  where: { id: participant.id },
                  data: {
                    ...(name ? { name } : {}),
                    ...(pic ? { profilePictureUrl: pic } : {}),
                    lastSeenAt: new Date(),
                  },
                });
              }
            }
          } catch {
            // ignore
          }
        }

        // Handle inbound messages
        const msg = evt?.message;
        if (msg && !msg.is_echo) {
          const mid = String(msg?.mid || '');
          const text = typeof msg?.text === 'string' ? msg.text : '';
          if (mid) {
            const existing = await this.prisma.message.findFirst({
              where: { conversationId: conversation.id, externalMessageId: mid },
            });
            if (!existing) {
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
        }

        // Delivery receipts
        const delivery = evt?.delivery;
        if (delivery?.mids?.length) {
          const deliveredAt = new Date(Number(delivery?.watermark || tsMs) || Date.now());
          for (const mid of delivery.mids) {
            await this.prisma.message
              .updateMany({
                where: { externalMessageId: String(mid) },
                data: { deliveredAt },
              })
              .catch(() => undefined);
          }
        }

        // Read receipts (Meta gives watermark; no message id)
        const read = evt?.read;
        if (read?.watermark) {
          const readAt = new Date(Number(read.watermark) || Date.now());
          await this.prisma.conversation
            .update({
              where: { id: conversation.id },
              data: { lastReadAt: readAt },
            })
            .catch(() => undefined);
        }

        // Update channel last sync (best-effort)
        await this.prisma.channelAccount
          .update({
            where: { id: channel.id },
            data: { lastSyncAt: new Date() },
          })
          .catch(() => undefined);
      }
    }

    return { ok: true };
  }
}


