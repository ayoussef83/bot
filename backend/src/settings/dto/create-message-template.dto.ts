import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { MessageChannel } from '@prisma/client';

export class CreateMessageTemplateDto {
  @IsEnum(MessageChannel)
  channel: MessageChannel;

  // unique per channel
  @IsString()
  key: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}









