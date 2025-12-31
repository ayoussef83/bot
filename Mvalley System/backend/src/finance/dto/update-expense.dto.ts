import {
  IsEnum,
  IsNumber,
  IsString,
  IsDateString,
  IsOptional,
  Min,
} from 'class-validator';
import { ExpenseCategory } from '@prisma/client';

export class UpdateExpenseDto {
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  instructorId?: string;

  @IsOptional()
  @IsDateString()
  expenseDate?: string;
}

