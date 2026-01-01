import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ManualBankBalanceDto {
  @IsString()
  @IsNotEmpty()
  cashAccountId: string;

  @Type(() => Number)
  @IsNumber()
  balance: number;

  @IsOptional()
  @IsDateString()
  asOfDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}


