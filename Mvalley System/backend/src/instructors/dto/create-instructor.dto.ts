import { IsInt, IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { InstructorCostType } from '@prisma/client';

export class CreateInstructorDto {
  @IsString()
  userId: string;

  @IsEnum(InstructorCostType)
  costType: InstructorCostType;

  @IsNumber()
  @Min(0)
  costAmount: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  age?: number;

  @IsOptional()
  @IsString()
  educationLevel?: string;

  @IsOptional()
  @IsString()
  livingArea?: string;
}

