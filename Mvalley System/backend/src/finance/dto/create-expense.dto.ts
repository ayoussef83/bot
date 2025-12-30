import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, Min } from 'class-validator';
import { PaymentMethod, ExpenseStatus } from '@prisma/client';

export class CreateExpenseDto {
  @IsDateString()
  expenseDate: string;

  @IsDateString()
  @IsOptional()
  paidDate?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  categoryId: string;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  vendor?: string;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsString()
  @IsOptional()
  cashAccountId?: string;

  @IsEnum(ExpenseStatus)
  @IsOptional()
  status?: ExpenseStatus;

  @IsString()
  @IsOptional()
  instructorId?: string;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsString()
  @IsOptional()
  periodId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
