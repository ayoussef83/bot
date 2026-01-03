import { IsEnum, IsString, IsOptional, IsObject } from 'class-validator';
import { MarketingPlatform, ConversationStatus } from '@prisma/client';

export class CreateConversationDto {
  @IsString()
  channelAccountId: string;

  @IsEnum(MarketingPlatform)
  platform: MarketingPlatform;

  @IsString()
  externalThreadId: string; // Meta thread ID, WhatsApp conversation ID

  @IsString()
  participantId: string;

  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @IsOptional()
  @IsString()
  assignedTo?: string; // User ID

  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsOptional()
  @IsString()
  source?: string; // page_comment, dm, messenger, story_reply, etc.

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>; // Post URL, story ID, ad ID, etc.
}







