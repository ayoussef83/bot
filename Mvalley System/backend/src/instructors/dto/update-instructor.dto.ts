import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { InstructorCostType } from '@prisma/client';

export class UpdateInstructorDto {
  @IsOptional()
  @IsEnum(InstructorCostType)
  costType?: InstructorCostType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  age?: number | null;

  @IsOptional()
  @IsString()
  educationLevel?: string | null;

  @IsOptional()
  @IsString()
  livingArea?: string | null;
}

