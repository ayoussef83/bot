import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';
import { CashAccountType } from '@prisma/client';

export class CreateCashAccountDto {
  @IsString()
  name: string;

  @IsEnum(CashAccountType)
  type: CashAccountType;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  balance?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}






