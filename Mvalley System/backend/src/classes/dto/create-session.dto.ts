import {
  IsString,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { SessionStatus } from '@prisma/client';
import { IsUUID } from 'class-validator';

export class CreateSessionDto {
  @IsUUID()
  classId: string;

  @IsDateString()
  scheduledDate: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsUUID()
  instructorId?: string;

  @IsOptional()
  @IsString()
  room?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @IsOptional()
  @IsBoolean()
  instructorConfirmed?: boolean;
}

