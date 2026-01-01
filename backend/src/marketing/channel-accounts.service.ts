import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChannelAccountDto, UpdateChannelAccountDto } from './dto';
import { MarketingPlatform } from '@prisma/client';

@Injectable()
export class ChannelAccountsService {
  constructor(private prisma: PrismaService) {}

  private graphVersion() {
    return process.env.META_GRAPH_VERSION || 'v20.0';
  }

  private async verifyMetaTokenForId(
    platform: MarketingPlatform,
    externalId: string,
    accessToken: string,
  ): Promise<{ ok: true; name?: string } | { ok: false; reason: string }> {
    // Normalize in case the token was pasted with hidden whitespace/newlines
    accessToken = String(accessToken || '')
      .replace(/[\s\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '')
      .trim();
    externalId = String(externalId || '').trim();

    if (/^[a-f0-9]{32}$/i.test(accessToken.trim())) {
      return { ok: false, reason: 'Looks like an App Secret, not an Access Token.' };
    }

    const gv = this.graphVersion();
    const fetchJson = async (url: URL) => {
      const resp = await fetch(url.toString(), { method: 'GET' });
      const json: any = await resp.json().catch(() => ({}));
      return { resp, json };
    };

    const errorMessage = (resp: Response, json: any) =>
      json?.error?.message ||
      json?.message ||
      `Graph API validation failed (HTTP ${resp.status})`;

    try {
      if (platform === MarketingPlatform.instagram_business) {
        // Attempt 1: direct lookup (works for some token types)
        {
          const url = new URL(
            `https://graph.facebook.com/${gv}/${encodeURIComponent(externalId)}`,
          );
          url.searchParams.set('fields', 'id,username');
          url.searchParams.set('access_token', accessToken);
          const { resp, json } = await fetchJson(url);
          if (resp.ok) {
            const returnedId = String(json?.id || '');
            if (returnedId && returnedId !== String(externalId)) {
              return {
                ok: false,
                reason: `Token is valid but does not match externalId. Expected ${externalId}, got ${returnedId}.`,
              };
            }
            const name = String(json?.username || '').trim() || undefined;
            return { ok: true, name };
          }
        }

        // Attempt 2: /me (page token) with instagram_business_account
        {
          const url = new URL(`https://graph.facebook.com/${gv}/me`);
          url.searchParams.set('fields', 'id,name,instagram_business_account');
          url.searchParams.set('access_token', accessToken);
          const { resp, json } = await fetchJson(url);
          if (resp.ok) {
            const igId = String(json?.instagram_business_account?.id || '');
            if (igId) {
              if (igId !== String(externalId)) {
                return {
                  ok: false,
                  reason: `Token is valid but is linked to a different Instagram Business account. Expected ${externalId}, got ${igId}.`,
                };
              }
              const name = String(json?.name || '').trim() || undefined;
              return { ok: true, name };
            }
          }
        }

        // Attempt 3: /me/accounts (user token) and search for matching instagram_business_account.id
        {
          const url = new URL(`https://graph.facebook.com/${gv}/me/accounts`);
          url.searchParams.set('fields', 'id,name,instagram_business_account');
          url.searchParams.set('access_token', accessToken);
          const { resp, json } = await fetchJson(url);
          if (resp.ok) {
            const pages: any[] = Array.isArray(json?.data) ? json.data : [];
            for (const p of pages) {
              const igId = String(p?.instagram_business_account?.id || '');
              if (igId && igId === String(externalId)) {
                const name = String(p?.name || '').trim() || undefined;
                return { ok: true, name };
              }
            }
            return {
              ok: false,
              reason:
                'Token is valid but does not have access to this Instagram Business account. Ensure the IG account is connected to a Facebook Page the token can access, and permissions include instagram_basic / instagram_manage_messages.',
            };
          }
        }

        return {
          ok: false,
          reason:
            'Unsupported get request. Ensure you are using a Facebook Graph User/Page access token with instagram_basic + instagram_manage_messages and access to the connected Facebook Page.',
        };
      }

      const url = new URL(`https://graph.facebook.com/${gv}/${encodeURIComponent(externalId)}`);
      url.searchParams.set('fields', 'id,name');
      url.searchParams.set('access_token', accessToken);
      const { resp, json } = await fetchJson(url);
      if (!resp.ok) return { ok: false, reason: errorMessage(resp, json) };

      const returnedId = String(json?.id || '');
      if (returnedId && returnedId !== String(externalId)) {
        return {
          ok: false,
          reason: `Token is valid but does not match externalId. Expected ${externalId}, got ${returnedId}.`,
        };
      }
      const name = String(json?.name || '').trim() || undefined;
      return { ok: true, name };
    } catch (e: any) {
      return { ok: false, reason: e?.message || 'Failed to validate token with Graph API' };
    }
  }

  private sanitize(account: any) {
    if (!account) return account;
    // Never return tokens to the client
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accessToken, refreshToken, ...rest } = account;
    return rest;
  }

  async create(data: CreateChannelAccountDto) {
    const verification = await this.verifyMetaTokenForId(
      data.platform,
      data.externalId,
      data.accessToken,
    );
    if (verification.ok === false) {
      throw new BadRequestException(
        `Invalid access token for ${data.platform}: ${verification.reason}`,
      );
    }

    const created = await this.prisma.channelAccount.create({
      data: {
        ...data,
        status: 'connected',
        ...(verification.name ? { name: data.name || verification.name } : {}),
        lastSyncAt: new Date(),
      },
      include: {
        _count: {
          select: {
            conversations: true,
            campaigns: true,
          },
        },
      },
    });
    return this.sanitize(created);
  }

  async findAll() {
    const rows = await this.prisma.channelAccount.findMany({
      include: {
        _count: {
          select: {
            conversations: true,
            campaigns: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return rows.map((r) => this.sanitize(r));
  }

  async findOne(id: string) {
    const account = await this.prisma.channelAccount.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            conversations: true,
            campaigns: true,
          },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Channel account not found');
    }

    return this.sanitize(account);
  }

  async update(id: string, data: UpdateChannelAccountDto) {
    const current = await this.prisma.channelAccount.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Channel account not found');

    const nextPlatform = (data.platform ?? current.platform) as MarketingPlatform;
    const nextExternalId = (data.externalId ?? current.externalId) as string;
    const nextAccessToken = (data.accessToken ?? current.accessToken) as string;

    const verification = await this.verifyMetaTokenForId(
      nextPlatform,
      nextExternalId,
      nextAccessToken,
    );
    if (verification.ok === false) {
      throw new BadRequestException(
        `Invalid access token for ${nextPlatform}: ${verification.reason}`,
      );
    }

    const account = await this.prisma.channelAccount.update({
      where: { id },
      data: {
        ...data,
        status: 'connected',
        ...(verification.name && !data.name ? { name: verification.name } : {}),
        lastSyncAt: new Date(),
      },
      include: {
        _count: {
          select: {
            conversations: true,
            campaigns: true,
          },
        },
      },
    });

    return this.sanitize(account);
  }

  async remove(id: string) {
    await this.prisma.channelAccount.delete({
      where: { id },
    });

    return { message: 'Channel account deleted successfully' };
  }
}






