import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Location } from '@prisma/client';

export class CreateInstructorAvailabilityDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsString()
  startTime: string; // HH:mm

  @IsString()
  endTime: string; // HH:mm

  @IsOptional()
  @IsEnum(Location)
  location?: Location;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}


