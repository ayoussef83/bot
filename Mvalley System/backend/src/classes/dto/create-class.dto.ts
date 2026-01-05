import {
  IsString,
  IsInt,
  IsEnum,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Location } from '@prisma/client';

export class CreateClassDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  levelNumber: number;

  @IsEnum(Location)
  location: Location;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  capacity?: number; // deprecated (kept for backward compatibility)

  @IsInt()
  @Min(1)
  @Max(50)
  minCapacity: number;

  @IsInt()
  @Min(1)
  @Max(50)
  maxCapacity: number;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  ageMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  ageMax?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  plannedSessions?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  instructorId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number; // 0 = Sunday, 1 = Monday, etc.

  @IsOptional()
  @IsString()
  startTime?: string; // HH:mm format

  @IsOptional()
  @IsString()
  endTime?: string; // HH:mm format

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

