import {
  IsString,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { SessionStatus } from '@prisma/client';

export class UpdateSessionDto {
  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsString()
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

