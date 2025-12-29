import {
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  IsString,
  Min,
  IsUUID,
} from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class UpdatePaymentDto {
  @IsOptional()
  @IsString()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

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
}

