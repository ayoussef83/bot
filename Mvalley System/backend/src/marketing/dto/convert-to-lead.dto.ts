import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class ConvertToLeadDto {
  @IsOptional()
  @IsString()
  existingLeadId?: string; // If linking to existing lead

  @IsOptional()
  @IsBoolean()
  createNewLead?: boolean; // If creating new lead

  // Lead data (if creating new)
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}



