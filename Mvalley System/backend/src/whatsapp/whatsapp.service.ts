import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';

export type WhatsAppStatus =
  | 'disconnected'
  | 'connecting'
  | 'qr_ready'
  | 'pairing'
  | 'connected'
  | 'error';

export interface WhatsAppState {
  status: WhatsAppStatus;
  qrBase64?: string;
  pairingCode?: string;
  connectedPhone?: string;
  connectedName?: string;
  errorMessage?: string;
  startedAt?: string;
  connectedAt?: string;
}

@Injectable()
export class WhatsappService implements OnModuleDestroy {
  private readonly logger = new Logger(WhatsappService.name);
  private state: WhatsAppState = { status: 'disconnected' };
  private baileysInstance: any = null;
  private stopFn: (() => Promise<void>) | null = null;
  private streamListeners: Set<(ev: any) => void> = new Set();

  // Session directory on the host (outside Docker — mount as volume if needed)
  private readonly sessionDir = process.env.WHATSAPP_SESSION_DIR ||
    path.join(process.cwd(), 'whatsapp-session');

  constructor(private readonly prisma: PrismaService) {}

  // ─── Settings (stored in IntegrationConfig) ─────────────────────────────

  async getSettings() {
    const cfg = await this.prisma.integrationConfig.findUnique({
      where: { provider: 'whatsapp_baileys' as any },
    });
    return {
      isActive: cfg?.isActive ?? false,
      config: (cfg?.config || {}) as Record<string, any>,
      hasSession: this.hasSessionFiles(),
    };
  }

  async saveSettings(data: {
    isActive?: boolean;
    aiAutoReplyEnabled?: boolean;
    aiAutoReplyGroupsOnlyWhenMentioned?: boolean;
    dedicatedGroupId?: string;
    connectedPhone?: string;
  }) {
    const existing = await this.prisma.integrationConfig.findUnique({
      where: { provider: 'whatsapp_baileys' as any },
    });

    const currentConfig = (existing?.config || {}) as Record<string, any>;
    const nextConfig = { ...currentConfig, ...data };

    return this.prisma.integrationConfig.upsert({
      where: { provider: 'whatsapp_baileys' as any },
      create: {
        provider: 'whatsapp_baileys' as any,
        isActive: data.isActive ?? false,
        config: nextConfig,
      },
      update: {
        isActive: data.isActive ?? existing?.isActive ?? false,
        config: nextConfig,
      },
    });
  }

  // ─── Connection state ────────────────────────────────────────────────────

  getStatus(): WhatsAppState {
    return { ...this.state };
  }

  getQr() {
    if (this.state.status !== 'qr_ready' || !this.state.qrBase64) return null;
    return { qrBase64: this.state.qrBase64 };
  }

  private setState(patch: Partial<WhatsAppState>) {
    this.state = { ...this.state, ...patch };
    this.emit({ type: 'status', data: this.state });
  }

  // ─── SSE event streaming ─────────────────────────────────────────────────

  onStreamEvent(listener: (ev: any) => void): () => void {
    this.streamListeners.add(listener);
    return () => this.streamListeners.delete(listener);
  }

  private emit(event: any) {
    this.streamListeners.forEach((fn) => {
      try { fn(event); } catch { /* ignore */ }
    });
  }

  // ─── Session helpers ─────────────────────────────────────────────────────

  private hasSessionFiles(): boolean {
    try {
      const credsPath = path.join(this.sessionDir, 'creds.json');
      return fs.existsSync(credsPath);
    } catch {
      return false;
    }
  }

  // ─── Start / Stop / Reset ────────────────────────────────────────────────

  async start(phoneE164?: string): Promise<void> {
    if (this.state.status === 'connected' || this.state.status === 'connecting') {
      throw new Error(`WhatsApp is already ${this.state.status}`);
    }

    // Ensure session directory exists
    fs.mkdirSync(this.sessionDir, { recursive: true });

    this.setState({ status: 'connecting', startedAt: new Date().toISOString() });

    try {
      // Attempt to dynamically load Baileys
      const baileys = await this.loadBaileys();
      if (!baileys) {
        this.setState({
          status: 'error',
          errorMessage: 'Baileys library not installed. Run: npm install @whiskeysockets/baileys',
        });
        return;
      }

      await this.initBaileys(baileys, phoneE164);
    } catch (err: any) {
      this.setState({ status: 'error', errorMessage: String(err?.message || err) });
      throw err;
    }
  }

  async stop(): Promise<void> {
    if (this.stopFn) {
      await this.stopFn().catch(() => {});
      this.stopFn = null;
    }
    this.baileysInstance = null;
    this.setState({ status: 'disconnected', qrBase64: undefined, pairingCode: undefined });
  }

  async resetAuth(): Promise<void> {
    await this.stop();
    // Delete session files
    if (fs.existsSync(this.sessionDir)) {
      fs.rmSync(this.sessionDir, { recursive: true, force: true });
    }
    this.setState({ status: 'disconnected', qrBase64: undefined, pairingCode: undefined, connectedPhone: undefined });
  }

  async requestPairingCode(phoneE164: string): Promise<{ pairingCode: string }> {
    if (!this.baileysInstance) {
      throw new Error('WhatsApp service is not started. Call /start first.');
    }
    if (typeof this.baileysInstance.requestPairingCode !== 'function') {
      throw new Error('Pairing code not available in this session state.');
    }
    const code: string = await this.baileysInstance.requestPairingCode(phoneE164);
    const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
    this.setState({ status: 'pairing', pairingCode: formatted });
    return { pairingCode: formatted };
  }

  // ─── Messaging ───────────────────────────────────────────────────────────

  async listChats(limit = 50): Promise<any[]> {
    if (!this.baileysInstance?.listChats) return [];
    return this.baileysInstance.listChats(limit);
  }

  async listMessages(remoteJid: string, limit = 50): Promise<any[]> {
    if (!this.baileysInstance?.listMessages) return [];
    return this.baileysInstance.listMessages(remoteJid, limit);
  }

  async sendMessage(remoteJid: string, content: string): Promise<void> {
    if (this.state.status !== 'connected') {
      throw new Error('WhatsApp is not connected');
    }
    if (!this.baileysInstance?.sendMessage) {
      throw new Error('Baileys not initialized');
    }
    await this.baileysInstance.sendMessage(remoteJid, content);
    this.emit({ type: 'message', remoteJid });
  }

  async listGroups(): Promise<any[]> {
    if (!this.baileysInstance?.listGroups) return [];
    return this.baileysInstance.listGroups();
  }

  // ─── Baileys loader ──────────────────────────────────────────────────────

  private async loadBaileys(): Promise<any | null> {
    try {
      // Dynamic import so the app starts even if Baileys is not installed
      return await import('@whiskeysockets/baileys');
    } catch {
      this.logger.warn(
        'Baileys not found. Install it with: npm install @whiskeysockets/baileys',
      );
      return null;
    }
  }

  private async initBaileys(baileys: any, phoneE164?: string): Promise<void> {
    const {
      makeWASocket,
      useMultiFileAuthState,
      DisconnectReason,
      makeCacheableSignalKeyStore,
    } = baileys;

    const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir);
    const logger = { level: 'silent', child: () => logger, info: () => {}, error: () => {}, warn: () => {}, debug: () => {}, trace: () => {}, fatal: () => {} } as any;

    const sock = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore ? makeCacheableSignalKeyStore(state.keys, logger) : state.keys,
      },
      printQRInTerminal: false,
      logger,
      browser: ['MV-OS', 'Desktop', '1.0.0'],
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
    });

    this.baileysInstance = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const QRCode = await import('qrcode');
          const qrBase64 = await QRCode.toDataURL(qr);
          this.setState({ status: 'qr_ready', qrBase64 });
        } catch {
          this.setState({ status: 'qr_ready', qrBase64: qr }); // raw string fallback
        }
      }

      if (connection === 'open') {
        const user = sock.user;
        const phone = user?.id?.split(':')[0] || '';
        this.setState({
          status: 'connected',
          qrBase64: undefined,
          pairingCode: undefined,
          connectedPhone: phone,
          connectedName: user?.name,
          connectedAt: new Date().toISOString(),
        });
        // Persist connected phone to settings
        await this.saveSettings({ connectedPhone: phone, isActive: true }).catch(() => {});
      }

      if (connection === 'close') {
        const code = (lastDisconnect?.error as any)?.output?.statusCode;
        const loggedOut = code === DisconnectReason?.loggedOut;
        if (loggedOut) {
          this.setState({ status: 'disconnected', connectedPhone: undefined });
        } else {
          // Reconnect
          this.setState({ status: 'connecting' });
          setTimeout(() => this.initBaileys(baileys, phoneE164).catch(() => {}), 3000);
        }
      }
    });

    // Use pairing code if phone provided and no existing session
    if (phoneE164 && !state.creds.me) {
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(phoneE164);
          const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
          this.setState({ status: 'pairing', pairingCode: formatted });
        } catch (e) {
          this.logger.error('Pairing code request failed', e);
        }
      }, 2000);
    }

    this.stopFn = async () => {
      try { sock.end(undefined); } catch { /* ignore */ }
    };
  }

  async onModuleDestroy() {
    await this.stop().catch(() => {});
  }
}
