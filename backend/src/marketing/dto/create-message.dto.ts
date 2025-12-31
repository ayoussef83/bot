import { IsEnum, IsString, IsOptional, IsObject, IsDateString } from 'class-validator';
import { MessageDirection, MessageType } from '@prisma/client';

export class CreateMessageDto {
  @IsString()
  conversationId: string;

  @IsString()
  externalMessageId: string; // Meta message ID, WhatsApp message ID

  @IsEnum(MessageDirection)
  direction: MessageDirection;

  @IsEnum(MessageType)
  type: MessageType;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsDateString()
  sentAt?: string;

  @IsOptional()
  @IsDateString()
  deliveredAt?: string;

  @IsOptional()
  @IsDateString()
  readAt?: string;

  @IsOptional()
  @IsString()
  senderId?: string; // Participant ID if inbound, User ID if outbound

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}






