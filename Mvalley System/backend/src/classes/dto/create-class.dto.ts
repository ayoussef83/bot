import {
  IsString,
  IsInt,
  IsEnum,
  IsOptional,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Location } from '@prisma/client';

export class CreateClassDto {
  @IsString()
  name: string;

  @IsEnum(Location)
  location: Location;

  @IsInt()
  @Min(1)
  @Max(50)
  capacity: number;

  @IsOptional()
  @IsString()
  instructorId?: string;

  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.

  @IsString()
  startTime: string; // HH:mm format

  @IsString()
  endTime: string; // HH:mm format

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

