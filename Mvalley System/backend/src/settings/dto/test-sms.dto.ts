import { IsOptional, IsString } from 'class-validator';

export class TestSmsDto {
  @IsString()
  mobile: string;

  @IsOptional()
  @IsString()
  message?: string;
}


