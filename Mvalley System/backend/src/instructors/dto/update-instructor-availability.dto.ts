import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Location } from '@prisma/client';

export class UpdateInstructorAvailabilityDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @IsString()
  startTime?: string; // HH:mm

  @IsOptional()
  @IsString()
  endTime?: string; // HH:mm

  @IsOptional()
  @IsEnum(Location)
  location?: Location | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}


