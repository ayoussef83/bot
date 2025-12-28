import {
  IsEnum,
  IsString,
  IsOptional,
  IsObject,
} from 'class-validator';
import { NotificationChannel } from '@prisma/client';

export class SendMessageDto {
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsString()
  recipient: string; // email, phone number, etc.

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  template?: string;

  @IsOptional()
  @IsObject()
  payload?: any; // Template variables

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsString()
  leadId?: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

