import {
  IsString,
  IsEnum,
  IsOptional,
  IsEmail,
} from 'class-validator';
import { LeadSource, LeadStatus, LearningTrack } from '@prisma/client';

export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(LearningTrack)
  interestedIn?: LearningTrack;
}

