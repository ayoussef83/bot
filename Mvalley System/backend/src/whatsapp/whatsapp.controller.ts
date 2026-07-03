import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { WhatsappService } from './whatsapp.service';
import { StartWhatsAppDto, SendWhatsAppDto, SaveWhatsAppSettingsDto, MarkReadDto } from './dto';

// Module-level constants so they can be used in decorators (decorators run at class definition time)
const WA_USER_ROLES: UserRole[] = [
  UserRole.super_admin,
  UserRole.management,
  UserRole.operations,
  UserRole.sales,
];

@Controller('whatsapp')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WhatsappController {
  constructor(private readonly wa: WhatsappService) {}

  // ─── Settings ────────────────────────────────────────────────────────────

  @Get('settings')
  @Roles(UserRole.super_admin, UserRole.management)
  async getSettings() {
    return this.wa.getSettings();
  }

  @Post('settings')
  @Roles(UserRole.super_admin, UserRole.management)
  async saveSettings(@Body() dto: SaveWhatsAppSettingsDto) {
    await this.wa.saveSettings(dto);
    return { success: true };
  }

  // ─── Connection status & live stream ─────────────────────────────────────

  @Get('status')
  @Roles(...WA_USER_ROLES)
  getStatus() {
    return this.wa.getStatus();
  }

  @Get('stream')
  @Roles(...WA_USER_ROLES)
  stream(@Req() req: Request, @Res() res: Response) {
    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    send('status', this.wa.getStatus());

    const unsub = this.wa.onStreamEvent((ev) => {
      if (ev.type === 'status') return send('status', ev.data);
      if (ev.type === 'message') return send('message', { remoteJid: ev.remoteJid });
    });

    const keepAlive = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 15_000);

    req.on('close', () => {
      clearInterval(keepAlive);
      unsub();
      res.end();
    });
  }

  // ─── QR / pairing ────────────────────────────────────────────────────────

  @Get('qr')
  @Roles(UserRole.super_admin, UserRole.management)
  getQr() {
    const qr = this.wa.getQr();
    if (!qr) {
      return { qrBase64: null, message: 'No QR available. Start the service first.' };
    }
    return qr;
  }

  @Post('start')
  @Roles(UserRole.super_admin, UserRole.management)
  @HttpCode(HttpStatus.OK)
  async start(@Body() dto: StartWhatsAppDto) {
    await this.wa.start(dto.phoneE164);
    return { success: true, status: this.wa.getStatus() };
  }

  @Post('pairing-code')
  @Roles(UserRole.super_admin, UserRole.management)
  @HttpCode(HttpStatus.OK)
  async pairingCode(@Body() body: { phoneE164: string }) {
    const result = await this.wa.requestPairingCode(body.phoneE164);
    return { success: true, ...result };
  }

  @Post('stop')
  @Roles(UserRole.super_admin, UserRole.management)
  @HttpCode(HttpStatus.OK)
  async stop() {
    await this.wa.stop();
    return { success: true, status: this.wa.getStatus() };
  }

  @Post('reset')
  @Roles(UserRole.super_admin, UserRole.management)
  @HttpCode(HttpStatus.OK)
  async reset() {
    await this.wa.resetAuth();
    return { success: true, status: this.wa.getStatus() };
  }

  // ─── Chats & messages ────────────────────────────────────────────────────

  @Get('chats')
  @Roles(...WA_USER_ROLES)
  async listChats(@Query('limit') limit?: string) {
    const chats = await this.wa.listChats(limit ? Number(limit) : 50);
    return { chats };
  }

  @Get('messages')
  @Roles(...WA_USER_ROLES)
  async listMessages(@Query('remoteJid') remoteJid: string, @Query('limit') limit?: string) {
    if (!remoteJid) {
      return { messages: [] };
    }
    const messages = await this.wa.listMessages(remoteJid, limit ? Number(limit) : 50);
    return { messages };
  }

  @Get('groups')
  @Roles(...WA_USER_ROLES)
  async listGroups() {
    const groups = await this.wa.listGroups();
    return { groups };
  }

  // ─── Send ────────────────────────────────────────────────────────────────

  @Post('send')
  @Roles(...WA_USER_ROLES)
  @HttpCode(HttpStatus.OK)
  async send(@Body() dto: SendWhatsAppDto) {
    await this.wa.sendMessage(dto.remoteJid, dto.content);
    return { success: true };
  }

  @Post('mark-read')
  @Roles(...WA_USER_ROLES)
  @HttpCode(HttpStatus.OK)
  async markRead(@Body() dto: MarkReadDto) {
    // Mark read logic would go here - for now just acknowledge
    return { success: true, remoteJid: dto.remoteJid };
  }
}
