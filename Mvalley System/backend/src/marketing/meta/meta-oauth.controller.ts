import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { MetaOAuthService } from './meta-oauth.service';
import type { MetaOAuthExchangeBody } from './meta.types';

@Controller('marketing/meta/oauth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MetaOAuthController {
  constructor(private readonly meta: MetaOAuthService) {}

  @Get('url')
  @Roles(UserRole.super_admin, UserRole.management)
  getUrl(@Req() req: any, @Query('redirectUri') redirectUri: string) {
    return this.meta.getOAuthUrl(req.user?.sub || req.user?.id, redirectUri);
  }

  @Post('exchange')
  @Roles(UserRole.super_admin, UserRole.management)
  exchange(@Req() req: any, @Body() body: MetaOAuthExchangeBody) {
    return this.meta.exchangeAndConnectPages(req.user?.sub || req.user?.id, body.code, body.state, body.redirectUri);
  }
}


