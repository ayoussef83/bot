import { IsEnum, IsString, IsOptional, IsObject } from 'class-validator';
import { MarketingPlatform, ChannelAccountStatus } from '@prisma/client';

export class CreateChannelAccountDto {
  @IsEnum(MarketingPlatform)
  platform: MarketingPlatform;

  @IsString()
  externalId: string; // Meta Page ID, WhatsApp Business Number

  @IsString()
  name: string;

  @IsString()
  accessToken: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsEnum(ChannelAccountStatus)
  status?: ChannelAccountStatus;

  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}






