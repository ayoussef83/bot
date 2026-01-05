import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { InstructorCostModelType } from '@prisma/client';

export class UpdateInstructorCostModelDto {
  @IsOptional()
  @IsEnum(InstructorCostModelType)
  type?: InstructorCostModelType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string | null;

  @IsOptional()
  @IsString()
  notes?: string;
}


