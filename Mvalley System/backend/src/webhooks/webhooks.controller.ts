import { Body, Controller, ForbiddenException, Get, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { MarketingPlatform } from '@prisma/client';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeMetaInstagramWebhook(
    body: any,
  ): { entry: any[]; isMetaTestPayload: boolean } | null {
    // Standard Instagram webhook format: { object: "instagram", entry: [...] }
    if (body?.object === 'instagram' && Array.isArray(body?.entry))
      return { entry: body.entry, isMetaTestPayload: false };

    // Meta Webhooks "Test" tool sample format: { field: "...", value: { sender, recipient, timestamp, message } }
    // We'll treat it similarly and attempt to map it to a connected instagram_business channel.
    if (body?.field && body?.value && typeof body.value === 'object') {
      const v = body.value;
      const igBusinessId = String(v?.recipient?.id || '');
      return {
        entry: [
          {
            id: igBusinessId,
            time: Date.now(),
            messaging: [v],
          },
        ],
        isMetaTestPayload: true,
      };
    }

    return null;
  }

  private normalizeMetaPageWebhook(
    body: any,
  ): { entry: any[]; isMetaTestPayload: boolean } | null {
    // Standard Page webhook format: { object: "page", entry: [...] }
    if (body?.object === 'page' && Array.isArray(body?.entry))
      return { entry: body.entry, isMetaTestPayload: false };

    // Meta Webhooks "Test" tool sample format: { field: "messages", value: { sender, recipient, timestamp, message } }
    if (body?.field && body?.value && typeof body.value === 'object') {
      const v = body.value;
      const pageId = String(v?.recipient?.id || '');
      return {
        entry: [
          {
            id: pageId,
            time: Date.now(),
            messaging: [v],
          },
        ],
        isMetaTestPayload: true,
      };
    }

    return null;
  }

  private toUnixMs(ts: unknown): number {
    const n = Number(ts);
    if (!Number.isFinite(n) || n <= 0) return Date.now();
    // Meta samples sometimes send seconds (10 digits); production commonly sends ms (13 digits)
    return n < 1_000_000_000_000 ? n * 1000 : n;
  }

  // WhatsApp Cloud API webhook verification
  @Get('whatsapp')
  whatsappVerify(
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') token?: string,
    @Query('hub.challenge') challenge?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '';
    if (mode === 'subscribe' && token && verifyToken && token === verifyToken) {
      if (res) res.status(200);
      return challenge || '';
    }
    if (res) res.status(403);
    throw new ForbiddenException('Invalid verify token');
  }

  @Post('whatsapp')
  async whatsapp(@Body() body: any) {
    // WhatsApp Cloud API inbound webhook ingestion
    // Docs payload: object=whatsapp_business_account, entry[].changes[].value.messages/contacts/statuses
    if (body?.object !== 'whatsapp_business_account') return { ok: true };

    const entries: any[] = Array.isArray(body?.entry) ? body.entry : [];
    for (const entry of entries) {
      const changes: any[] = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const ch of changes) {
        const value = ch?.value || {};
        const metadata = value?.metadata || {};
        const phoneNumberId = String(metadata?.phone_number_id || '');
        if (!phoneNumberId) continue;

        const channel = await this.prisma.channel_accounts.findFirst({
          where: { platform: MarketingPlatform.whatsapp_business, externalId: phoneNumberId },
        });
        if (!channel) {
          // eslint-disable-next-line no-console
          console.warn('[WEBHOOK][WHATSAPP] No connected ChannelAccount for phone_number_id:', phoneNumberId);
          continue;
        }

        // Best-effort sync marker
        await this.prisma.channel_accounts
          .update({ where: { id: channel.id }, data: { lastSyncAt: new Date() } })
          .catch(() => undefined);

        const contacts: any[] = Array.isArray(value?.contacts) ? value.contacts : [];
        const messages: any[] = Array.isArray(value?.messages) ? value.messages : [];
        const statuses: any[] = Array.isArray(value?.statuses) ? value.statuses : [];

        // Inbound messages
        for (const msg of messages) {
          const waId = String(msg?.from || ''); // WhatsApp user id
          const mid = String(msg?.id || '');
          const tsMs = this.toUnixMs(msg?.timestamp);
          const sentAt = new Date(tsMs);
          if (!waId || !mid) continue;

          const contact = contacts.find((c) => String(c?.wa_id || '') === waId);
          const contactName = String(contact?.profile?.name || '').trim() || undefined;

          const existingParticipant = await this.prisma.participants.findFirst({
            where: { platformUserId: waId },
          });
          const participant = existingParticipant
            ? await this.prisma.participants.update({
                where: { id: existingParticipant.id },
                data: {
                  ...(contactName ? { name: contactName } : {}),
                  lastSeenAt: new Date(),
                },
              })
            : await this.prisma.participants.create({
                data: {
                  platformUserId: waId,
                  type: 'unknown',
                  ...(contactName ? { name: contactName } : {}),
                  firstSeenAt: new Date(),
                  lastSeenAt: new Date(),
                },
              });

          const threadId = `${phoneNumberId}:${waId}`;
          const conversation = await this.prisma.conversations.upsert({
            where: {
              platform_externalThreadId: {
                platform: MarketingPlatform.whatsapp_business,
                externalThreadId: threadId,
              },
            },
            update: { lastMessageAt: sentAt },
            create: {
              channelAccountId: channel.id,
              platform: MarketingPlatform.whatsapp_business,
              externalThreadId: threadId,
              participantId: participant.id,
              status: 'new',
              source: 'whatsapp',
              firstMessageAt: sentAt,
              lastMessageAt: sentAt,
            },
          });

          const existing = await this.prisma.message.findFirst({
            where: { conversationId: conversation.id, externalMessageId: mid },
          });
          if (existing) continue;

          const text = typeof msg?.text?.body === 'string' ? msg.text.body : '';
          await this.prisma.message.create({
            data: {
              conversationId: conversation.id,
              externalMessageId: mid,
              direction: 'inbound',
              type: 'text',
              content: text,
              sentAt,
              senderId: participant.id,
              metadata: msg,
            },
          });
        }

        // Delivery/read statuses
        for (const st of statuses) {
          const mid = String(st?.id || '');
          const status = String(st?.status || '');
          const tsMs = this.toUnixMs(st?.timestamp);
          const at = new Date(tsMs);
          if (!mid) continue;

          if (status === 'delivered') {
            await this.prisma.message.updateMany({
              where: { externalMessageId: mid },
              data: { deliveredAt: at },
            }).catch(() => undefined);
          }
          if (status === 'read') {
            await this.prisma.message.updateMany({
              where: { externalMessageId: mid },
              data: { readAt: at },
            }).catch(() => undefined);
          }
        }
      }
    }

    return { ok: true };
  }

  // Meta webhook verification (Messenger uses Page webhook)
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

  // Meta webhook verification (Instagram)
  @Get('meta/instagram')
  metaInstagramVerify(
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
    // Minimal Messenger ingestion:
    // - Finds ChannelAccount by recipient.page_id
    // - Upserts Participant (PSID) and Conversation
    // - Creates Message records

    const normalized = this.normalizeMetaPageWebhook(body);
    if (!normalized) return { ok: true };

    const entries: any[] = Array.isArray(normalized?.entry) ? normalized.entry : [];
    for (const entry of entries) {
      const messaging: any[] = Array.isArray(entry?.messaging) ? entry.messaging : [];
      for (const evt of messaging) {
        const senderId = String(evt?.sender?.id || '');
        const pageId = String(evt?.recipient?.id || '');
        const tsMs = this.toUnixMs(evt?.timestamp);
        const sentAt = new Date(tsMs);

        if (!senderId || !pageId) continue;

        const channel = await this.prisma.channel_accounts.findFirst({
          where: { platform: MarketingPlatform.facebook_page, externalId: pageId },
        });
        const effectiveChannel =
          channel ||
          (normalized.isMetaTestPayload
            ? await this.prisma.channel_accounts.findFirst({
                where: { platform: MarketingPlatform.facebook_page },
                orderBy: { updatedAt: 'desc' },
              })
            : null);
        if (!effectiveChannel) {
          // eslint-disable-next-line no-console
          console.warn(
            '[WEBHOOK][META] No connected ChannelAccount for pageId:',
            pageId,
            normalized.isMetaTestPayload ? '(meta test payload; no facebook_page channel exists)' : '',
          );
          continue;
        }
        if (!channel && normalized.isMetaTestPayload) {
          // eslint-disable-next-line no-console
          console.warn(
            '[WEBHOOK][META] Meta test payload used non-matching pageId; falling back to channel externalId:',
            effectiveChannel.externalId,
          );
        }

        const effectivePageId =
          !channel && normalized.isMetaTestPayload
            ? String(effectiveChannel.externalId || pageId)
            : pageId;

        const existingParticipant = await this.prisma.participants.findFirst({
          where: { platformUserId: senderId },
        });
        const participant = existingParticipant
          ? await this.prisma.participants.update({
              where: { id: existingParticipant.id },
              data: { lastSeenAt: new Date() },
            })
          : await this.prisma.participants.create({
              data: {
                platformUserId: senderId,
                type: 'unknown',
                firstSeenAt: new Date(),
                lastSeenAt: new Date(),
              },
            });

        const threadId = `${effectivePageId}:${senderId}`;
        const conversation = await this.prisma.conversations.upsert({
          where: {
            platform_externalThreadId: {
              platform: MarketingPlatform.facebook_page,
              externalThreadId: threadId,
            },
          },
          update: { lastMessageAt: sentAt },
          create: {
            channelAccountId: effectiveChannel.id,
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
            url.searchParams.set('access_token', effectiveChannel.accessToken);
            const resp = await fetch(url.toString(), { method: 'GET' });
            const json = await resp.json().catch(() => ({}));
            if (resp.ok) {
              const first = String(json?.first_name || '').trim();
              const last = String(json?.last_name || '').trim();
              const name = `${first} ${last}`.trim();
              const pic = String(json?.profile_pic || '').trim();
              if (name || pic) {
                await this.prisma.participants.update({
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
          let mid = String(msg?.mid || '');
          // Meta "Send to server" test uses a static message id like "test_message_id"
          // which would be de-duplicated; make it unique so repeated tests are visible.
          if (normalized.isMetaTestPayload) {
            if (!mid || mid === 'test_message_id') mid = `meta_test_${Date.now()}`;
            else if (mid.startsWith('test_')) mid = `${mid}_${tsMs}`;
          }
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
          await this.prisma.conversations
            .update({
              where: { id: conversation.id },
              data: { lastReadAt: readAt },
            })
            .catch(() => undefined);
        }

        // Update channel last sync (best-effort)
        await this.prisma.channel_accounts
          .update({
            where: { id: effectiveChannel.id },
            data: { lastSyncAt: new Date() },
          })
          .catch(() => undefined);
      }
    }

    return { ok: true };
  }

  @Post('meta/instagram')
  async metaInstagram(@Body() body: any) {
    // Minimal Instagram DM webhook ingestion (business accounts)
    const normalized = this.normalizeMetaInstagramWebhook(body);
    if (!normalized) return { ok: true };

    const entries: any[] = Array.isArray(normalized?.entry) ? normalized.entry : [];
    for (const entry of entries) {
      const messaging: any[] = Array.isArray(entry?.messaging) ? entry.messaging : [];
      for (const evt of messaging) {
        const senderId = String(evt?.sender?.id || '');
        const recipientId = String(evt?.recipient?.id || '');
        const entryId = String(entry?.id || '');
        const tsMs = this.toUnixMs(evt?.timestamp);
        const sentAt = new Date(tsMs);

        if (!senderId) continue;

        const accountId = recipientId || entryId;
        if (!accountId) continue;

        const channel = await this.prisma.channel_accounts.findFirst({
          where: { platform: MarketingPlatform.instagram_business, externalId: accountId },
        });
        const effectiveChannel =
          channel ||
          (normalized.isMetaTestPayload
            ? await this.prisma.channel_accounts.findFirst({
                where: { platform: MarketingPlatform.instagram_business },
                orderBy: { updatedAt: 'desc' },
              })
            : null);
        if (!effectiveChannel) {
          // eslint-disable-next-line no-console
          console.warn(
            '[WEBHOOK][INSTAGRAM] No connected ChannelAccount for instagram_business externalId:',
            accountId,
            normalized.isMetaTestPayload ? '(meta test payload; no instagram_business channel exists)' : '',
          );
          continue;
        }

        const existingParticipant = await this.prisma.participants.findFirst({
          where: { platformUserId: senderId },
        });
        const participant = existingParticipant
          ? await this.prisma.participants.update({
              where: { id: existingParticipant.id },
              data: { lastSeenAt: new Date() },
            })
          : await this.prisma.participants.create({
              data: {
                platformUserId: senderId,
                type: 'unknown',
                firstSeenAt: new Date(),
                lastSeenAt: new Date(),
              },
            });

        const threadId = `${String(effectiveChannel.externalId)}:${senderId}`;
        const conversation = await this.prisma.conversations.upsert({
          where: {
            platform_externalThreadId: {
              platform: MarketingPlatform.instagram_business,
              externalThreadId: threadId,
            },
          },
          update: { lastMessageAt: sentAt },
          create: {
            channelAccountId: effectiveChannel.id,
            platform: MarketingPlatform.instagram_business,
            externalThreadId: threadId,
            participantId: participant.id,
            status: 'new',
            source: 'instagram_dm',
            firstMessageAt: sentAt,
            lastMessageAt: sentAt,
          },
        });

        const msg = evt?.message;
        if (msg && !msg.is_echo) {
          let mid = String(msg?.mid || '');
          if (normalized.isMetaTestPayload) {
            if (!mid || mid === 'test_message_id') mid = `ig_test_${Date.now()}`;
            else if (mid.startsWith('test_')) mid = `${mid}_${tsMs}`;
          }
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

        await this.prisma.channel_accounts
          .update({
            where: { id: effectiveChannel.id },
            data: { lastSyncAt: new Date() },
          })
          .catch(() => undefined);
      }
    }

    return { ok: true };
  }
}


