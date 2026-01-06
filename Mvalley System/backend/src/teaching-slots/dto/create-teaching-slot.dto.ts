import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateTeachingSlotDto {
  @IsString()
  courseLevelId!: string;

  @IsString()
  instructorId!: string;

  @IsString()
  roomId!: string;

  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsString()
  startTime!: string; // HH:mm

  @IsString()
  endTime!: string; // HH:mm

  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  @IsOptional()
  @IsString()
  effectiveTo?: string;

  @IsInt()
  @Min(1)
  minCapacity!: number;

  @IsInt()
  @Min(1)
  maxCapacity!: number;

  @IsInt()
  @Min(1)
  plannedSessions!: number;

  @IsInt()
  @Min(15)
  sessionDurationMins!: number;

  @IsNumber()
  @Min(0)
  pricePerStudent!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minMarginPct?: number; // 0.2 = 20%

  @IsOptional()
  @IsString()
  currency?: string;
}


