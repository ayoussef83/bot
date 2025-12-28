import {
  IsString,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class CreateFollowUpDto {
  @IsString()
  leadId: string;

  @IsString()
  notes: string;

  @IsOptional()
  @IsString()
  nextAction?: string;

  @IsOptional()
  @IsDateString()
  nextActionDate?: string;
}

