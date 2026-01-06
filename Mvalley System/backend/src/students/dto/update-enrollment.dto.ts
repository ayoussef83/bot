import { IsOptional, IsString } from 'class-validator';

export class UpdateEnrollmentDto {
  @IsOptional()
  @IsString()
  classId?: string | null;

  @IsOptional()
  @IsString()
  groupId?: string | null;

  @IsOptional()
  @IsString()
  status?: string;

  // Mandatory when requesting a manual override (e.g., moving a student into a locked group)
  @IsOptional()
  @IsString()
  reason?: string;
}


