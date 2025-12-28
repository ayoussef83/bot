import {
  IsEnum,
  IsNumber,
  IsString,
  IsDateString,
  IsOptional,
  Min,
} from 'class-validator';
import { ExpenseCategory } from '@prisma/client';

export class CreateExpenseDto {
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  instructorId?: string;

  @IsDateString()
  expenseDate: string;
}

