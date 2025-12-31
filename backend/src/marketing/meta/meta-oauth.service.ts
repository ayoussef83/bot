import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { MarketingPlatform } from '@prisma/client';
import * as jsonwebtoken from 'jsonwebtoken';

type OAuthStatePayload = {
  uid: string;
  ts: number;
};

@Injectable()
export class MetaOAuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
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

  private stateSecret() {
    const v = this.config.get<string>('JWT_SECRET') || process.env.JWT_SECRET;
    if (!v) throw new BadRequestException('JWT_SECRET is not configured');
    return v;
  }

  private signState(payload: OAuthStatePayload) {
    return jsonwebtoken.sign(payload, this.stateSecret(), { expiresIn: '10m' });
  }

  private verifyState(state: string): OAuthStatePayload {
    try {
      return jsonwebtoken.verify(state, this.stateSecret()) as OAuthStatePayload;
    } catch {
      throw new BadRequestException('Invalid or expired state');
    }
  }

  private assertRedirectAllowed(redirectUri: string) {
    const raw = String(redirectUri || '').trim();
    if (!raw) throw new BadRequestException('redirectUri is required');

    // Allow localhost for development, otherwise only allow configured FRONTEND_URL origins.
    if (raw.startsWith('http://localhost') || raw.startsWith('http://127.0.0.1')) return;

    const allowed = String(this.config.get<string>('FRONTEND_URL') || process.env.FRONTEND_URL || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.replace(/\/+$/, '')); // remove trailing slashes

    const uriNoSlash = raw.replace(/\/+$/, '');
    if (!allowed.length) throw new BadRequestException('FRONTEND_URL is not configured');

    const ok = allowed.some((origin) => uriNoSlash.startsWith(origin));
    if (!ok) throw new BadRequestException('Invalid redirectUri');
  }

  getOAuthUrl(userId: string, redirectUri: string) {
    this.assertRedirectAllowed(redirectUri);

    const state = this.signState({ uid: userId, ts: Date.now() });

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
    this.assertRedirectAllowed(redirectUri);
    const payload = this.verifyState(state);
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


