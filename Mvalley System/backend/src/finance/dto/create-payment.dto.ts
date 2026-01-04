import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, Min, IsIn } from 'class-validator';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class CreatePaymentDto {
  @IsDateString()
  @IsOptional()
  receivedDate?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsString()
  cashAccountId: string;

  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @IsString()
  @IsOptional()
  notes?: string;

  // Payment owner
  @IsString()
  @IsOptional()
  studentId?: string;

  @IsIn(['student', 'school'])
  @IsOptional()
  payerType?: 'student' | 'school';

  @IsString()
  @IsOptional()
  schoolName?: string;
}
