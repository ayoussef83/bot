import {
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  IsString,
  Min,
} from 'class-validator';
import { PaymentType, PaymentStatus } from '@prisma/client';

export class CreatePaymentDto {
  @IsOptional()
  @IsString()
  studentId?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(PaymentType)
  type: PaymentType;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  schoolName?: string;
}

