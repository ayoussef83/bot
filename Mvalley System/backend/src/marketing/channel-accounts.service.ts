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
    // This prevents accidental pasting of Meta App Secret (often 32-char hex) into "Access token"
    if (/^[a-f0-9]{32}$/i.test(accessToken.trim())) {
      return { ok: false, reason: 'Looks like an App Secret, not an Access Token.' };
    }

    // Best-effort token validation by calling Graph API for the given object id.
    // If token is invalid or lacks permissions, Graph will return 400/401 with OAuthException.
    const gv = this.graphVersion();
    const fields =
      platform === MarketingPlatform.instagram_business ? 'id,username' : 'id,name';

    const url = new URL(`https://graph.facebook.com/${gv}/${encodeURIComponent(externalId)}`);
    url.searchParams.set('fields', fields);
    url.searchParams.set('access_token', accessToken);

    try {
      const resp = await fetch(url.toString(), { method: 'GET' });
      const json: any = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const msg =
          json?.error?.message ||
          json?.message ||
          `Graph API validation failed (HTTP ${resp.status})`;
        return { ok: false, reason: msg };
      }
      const returnedId = String(json?.id || '');
      if (returnedId && returnedId !== String(externalId)) {
        return {
          ok: false,
          reason: `Token is valid but does not match externalId. Expected ${externalId}, got ${returnedId}.`,
        };
      }
      const name = String(json?.name || json?.username || '').trim() || undefined;
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
    // Verify before we mark as connected (prevents "secret" being treated as a token)
    const verification = await this.verifyMetaTokenForId(
      data.platform,
      data.externalId,
      data.accessToken,
    );
    if (!verification.ok) {
      throw new BadRequestException(
        `Invalid access token for ${data.platform}: ${verification.reason}`,
      );
    }

    const created = await this.prisma.channelAccount.create({
      data: {
        ...data,
        // status is derived from verification result, do not trust client input
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
    // If user is changing token or externalId/platform, re-verify before keeping status connected
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
    if (!verification.ok) {
      throw new BadRequestException(
        `Invalid access token for ${nextPlatform}: ${verification.reason}`,
      );
    }

    const account = await this.prisma.channelAccount.update({
      where: { id },
      data: {
        ...data,
        // status is derived from verification result, do not trust client input
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



