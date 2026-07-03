import { IsOptional, IsString, IsEnum } from 'class-validator';
import { EnrollmentStatus } from '@prisma/client';

export class UpdateEnrollmentDto {
  @IsOptional()
  @IsString()
  classId?: string | null;

  @IsOptional()
  @IsString()
  groupId?: string | null;

  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;

  // Mandatory when requesting a manual override (e.g., moving a student into a locked group)
  @IsOptional()
  @IsString()
  reason?: string;
}


