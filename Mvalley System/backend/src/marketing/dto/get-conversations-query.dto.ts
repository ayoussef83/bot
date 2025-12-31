import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ConversationStatus, MarketingPlatform } from '@prisma/client';

export class GetConversationsQueryDto {
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(MarketingPlatform)
  platform?: MarketingPlatform;

  @IsOptional()
  @IsString()
  channelAccountId?: string;

  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsString()
  participantId?: string;
}



