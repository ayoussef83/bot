import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateTeachingSlotDto {
  @IsOptional()
  @IsString()
  courseLevelId?: string;

  @IsOptional()
  @IsString()
  instructorId?: string;

  @IsOptional()
  @IsString()
  roomId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString()
  effectiveFrom?: string | null;

  @IsOptional()
  @IsString()
  effectiveTo?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  minCapacity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxCapacity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  plannedSessions?: number;

  @IsOptional()
  @IsInt()
  @Min(15)
  sessionDurationMins?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerStudent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minMarginPct?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}


