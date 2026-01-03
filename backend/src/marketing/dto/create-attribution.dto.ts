import { IsString, IsOptional, IsDateString, IsObject } from 'class-validator';

export class CreateAttributionDto {
  @IsString()
  conversationId: string;

  @IsOptional()
  @IsString()
  campaignId?: string;

  // Attribution data
  @IsOptional()
  @IsString()
  source?: string; // facebook_page, instagram_post, whatsapp_broadcast, organic_search, referral

  @IsOptional()
  @IsString()
  medium?: string; // social, messaging, paid_ad, organic

  @IsOptional()
  @IsString()
  campaignName?: string; // Campaign name (for non-campaign sources)

  @IsOptional()
  @IsString()
  content?: string; // Post ID, ad ID, story ID

  @IsOptional()
  @IsString()
  term?: string; // Keyword if applicable

  @IsOptional()
  @IsDateString()
  firstTouchAt?: string;

  @IsOptional()
  @IsDateString()
  lastTouchAt?: string;

  @IsOptional()
  @IsObject()
  touchpoints?: Record<string, any>; // Array of touchpoints before conversion
}






