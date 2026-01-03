import {
  IsString,
  IsDateString,
  IsOptional,
  IsBoolean,
} from 'class-validator';

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
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  instructorConfirmed?: boolean;
}

