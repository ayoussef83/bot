import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MarketingPlatform } from '@prisma/client';

type OAuthStatePayload = {
  uid: string;
  ts: number;
};

@Injectable()
export class MetaOAuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private graphVersion() {
    return this.config.get<string>('META_GRAPH_VERSION') || 'v20.0';
  }

  private appId() {
    const v = this.config.get<string>('META_APP_ID');
    if (!v) throw new BadRequestException('META_APP_ID is not configured');
    return v;
  }

  private appSecret() {
    const v = this.config.get<string>('META_APP_SECRET');
    if (!v) throw new BadRequestException('META_APP_SECRET is not configured');
    return v;
  }

  getOAuthUrl(userId: string, redirectUri: string) {
    if (!redirectUri?.startsWith('https://') && !redirectUri?.startsWith('http://localhost')) {
      throw new BadRequestException('Invalid redirectUri');
    }

    const state = this.jwt.sign(
      { uid: userId, ts: Date.now() } satisfies OAuthStatePayload,
      { expiresIn: '10m' },
    );

    const params = new URLSearchParams({
      client_id: this.appId(),
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
      scope: [
        'pages_show_list',
        'pages_read_engagement',
        'pages_manage_metadata',
        'pages_messaging',
      ].join(','),
    });

    return {
      url: `https://www.facebook.com/${this.graphVersion()}/dialog/oauth?${params.toString()}`,
    };
  }

  private async graphGet(path: string, accessToken: string) {
    const url = new URL(`https://graph.facebook.com/${this.graphVersion()}/${path}`);
    url.searchParams.set('access_token', accessToken);
    const resp = await fetch(url.toString(), { method: 'GET' });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const msg = json?.error?.message || `Meta API failed: ${resp.status}`;
      throw new BadRequestException(msg);
    }
    return json;
  }

  private async graphPost(path: string, accessToken: string, body?: Record<string, any>) {
    const url = new URL(`https://graph.facebook.com/${this.graphVersion()}/${path}`);
    url.searchParams.set('access_token', accessToken);
    const resp = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const msg = json?.error?.message || `Meta API failed: ${resp.status}`;
      throw new BadRequestException(msg);
    }
    return json;
  }

  async exchangeAndConnectPages(currentUserId: string, code: string, state: string, redirectUri: string) {
    let payload: OAuthStatePayload;
    try {
      payload = this.jwt.verify(state) as OAuthStatePayload;
    } catch {
      throw new BadRequestException('Invalid or expired state');
    }
    if (payload.uid !== currentUserId) {
      throw new BadRequestException('State user mismatch');
    }

    const tokenUrl = new URL(`https://graph.facebook.com/${this.graphVersion()}/oauth/access_token`);
    tokenUrl.searchParams.set('client_id', this.appId());
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('client_secret', this.appSecret());
    tokenUrl.searchParams.set('code', code);

    const tokenResp = await fetch(tokenUrl.toString());
    const tokenJson = await tokenResp.json().catch(() => ({}));
    if (!tokenResp.ok) {
      throw new BadRequestException(tokenJson?.error?.message || 'Failed to exchange code');
    }
    const shortToken = tokenJson.access_token as string;
    if (!shortToken) throw new BadRequestException('No access_token returned');

    const longUrl = new URL(`https://graph.facebook.com/${this.graphVersion()}/oauth/access_token`);
    longUrl.searchParams.set('grant_type', 'fb_exchange_token');
    longUrl.searchParams.set('client_id', this.appId());
    longUrl.searchParams.set('client_secret', this.appSecret());
    longUrl.searchParams.set('fb_exchange_token', shortToken);

    const longResp = await fetch(longUrl.toString());
    const longJson = await longResp.json().catch(() => ({}));
    if (!longResp.ok) {
      throw new BadRequestException(longJson?.error?.message || 'Failed to exchange for long-lived token');
    }
    const userToken = (longJson.access_token as string) || shortToken;

    const pages = await this.graphGet('me/accounts?fields=id,name,access_token', userToken);
    const pageList: Array<{ id: string; name: string; access_token: string }> = pages?.data || [];
    if (!pageList.length) throw new BadRequestException('No Facebook Pages found for this account');

    const results: any[] = [];
    for (const p of pageList) {
      const pageId = String(p.id);
      const pageName = String(p.name || `Facebook Page ${pageId}`);
      const pageToken = String(p.access_token || '').trim();

      if (!pageToken) {
        results.push({ pageId, name: pageName, status: 'error', error: 'Missing page access token' });
        continue;
      }

      let subscribed = true;
      try {
        await this.graphPost(`${pageId}/subscribed_apps`, pageToken, {
          subscribed_fields: [
            'messages',
            'messaging_postbacks',
            'message_deliveries',
            'message_reads',
          ],
        });
      } catch {
        subscribed = false;
      }

      const upserted = await this.prisma.channelAccount.upsert({
        where: {
          platform_externalId: { platform: MarketingPlatform.facebook_page, externalId: pageId },
        },
        update: {
          name: pageName,
          accessToken: pageToken,
          status: subscribed ? 'connected' : 'error',
          settings: {
            ...(subscribed ? {} : { webhookSubscription: 'failed' }),
          },
          lastSyncAt: new Date(),
        },
        create: {
          platform: MarketingPlatform.facebook_page,
          externalId: pageId,
          name: pageName,
          accessToken: pageToken,
          status: subscribed ? 'connected' : 'error',
          settings: subscribed ? undefined : { webhookSubscription: 'failed' },
        },
      });

      results.push(upserted);
    }

    return { connected: results };
  }
}


