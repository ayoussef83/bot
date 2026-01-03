import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePaymentAllocationDto {
  @IsString()
  paymentId: string;

  @IsString()
  invoiceId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  notes?: string;
}







