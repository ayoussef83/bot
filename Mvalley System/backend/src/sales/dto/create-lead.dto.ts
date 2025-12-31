import {
  IsString,
  IsEnum,
  IsOptional,
  IsEmail,
} from 'class-validator';
import { LeadSource, LeadStatus, LearningTrack } from '@prisma/client';

export class CreateLeadDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  phone: string;

  @IsEnum(LeadSource)
  source: LeadSource;

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

