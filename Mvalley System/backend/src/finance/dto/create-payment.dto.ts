import {
  IsNumber,
  IsEnum,
  IsDateString,
  IsString,
  Min,
  IsUUID,
} from 'class-validator';
import { PaymentType, PaymentStatus } from '@prisma/client';

export class CreatePaymentDto {
  // Payments must be linked to a student (internal ops requirement).
  @IsString()
  @IsUUID()
  studentId: string;

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

