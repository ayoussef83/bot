import { Body, Controller, Post } from '@nestjs/common';

@Controller('webhooks')
export class WebhooksController {
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


