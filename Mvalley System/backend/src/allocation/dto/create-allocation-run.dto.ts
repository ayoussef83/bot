import { IsArray, IsEnum, IsInt, IsNumber, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Location } from '@prisma/client';

export class CourseDemandInputDto {
  @IsString()
  courseLevelId!: string;

  @IsArray()
  @IsString({ each: true })
  studentIds!: string[];

  // Flexible engine input (recommended format):
  // { [studentId]: [{ dayOfWeek: 0..6, from: "HH:mm", to: "HH:mm" }] }
  @IsOptional()
  @IsObject()
  studentAvailability?: any;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSkills?: string[];

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
  @IsEnum(Location)
  preferredLocation?: Location;
}

export class CreateAllocationRunDto {
  @IsString()
  fromDate!: string; // ISO or YYYY-MM-DD

  @IsString()
  toDate!: string; // ISO or YYYY-MM-DD

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  params?: any;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourseDemandInputDto)
  demands!: CourseDemandInputDto[];
}


