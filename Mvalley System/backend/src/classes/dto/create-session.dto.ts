import {
  IsString,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';

export class CreateSessionDto {
  @IsString()
  classId: string;

  @IsDateString()
  scheduledDate: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

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
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  instructorConfirmed?: boolean;
}

