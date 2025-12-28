import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { InstructorCostType } from '@prisma/client';

export class UpdateInstructorDto {
  @IsOptional()
  @IsEnum(InstructorCostType)
  costType?: InstructorCostType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costAmount?: number;
}

