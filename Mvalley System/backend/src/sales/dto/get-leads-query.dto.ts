import { IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { LeadStatus, LeadSource } from '@prisma/client';

export class GetLeadsQueryDto {
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(LeadSource)
  source?: LeadSource;
}

