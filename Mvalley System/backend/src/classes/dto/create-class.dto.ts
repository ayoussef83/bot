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

  @IsString()
  courseLevelId: string;

  @IsEnum(Location)
  location: Location;

  @IsInt()
  @Min(1)
  @Max(50)
  capacity: number;

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

