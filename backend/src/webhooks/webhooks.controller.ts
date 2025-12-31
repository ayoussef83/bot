import { Body, Controller, Post } from '@nestjs/common';

@Controller('webhooks')
export class WebhooksController {
  // These endpoints are intentionally minimal:
  // - Local-safe for replay testing
  // - Same routes in all environments
  // - Business logic should live in dedicated services when implementing real webhook ingestion

  @Post('whatsapp')
  whatsapp(@Body() body: any) {
    // eslint-disable-next-line no-console
    console.log('[WEBHOOK][WHATSAPP]', JSON.stringify(body));
    return { ok: true };
  }

  @Post('meta/messenger')
  metaMessenger(@Body() body: any) {
    // eslint-disable-next-line no-console
    console.log('[WEBHOOK][META_MESSENGER]', JSON.stringify(body));
    return { ok: true };
  }
}


