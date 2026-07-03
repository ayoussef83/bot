import { IsOptional, IsString, IsEnum, IsUUID, ValidateIf } from 'class-validator';
import { EnrollmentStatus } from '@prisma/client';

export class UpdateEnrollmentDto {
  @IsOptional()
  @ValidateIf((o) => o.classId !== null)
  @IsUUID()
  classId?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.groupId !== null)
  @IsUUID()
  groupId?: string | null;

  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;

  // Mandatory when requesting a manual override (e.g., moving a student into a locked group)
  @IsOptional()
  @IsString()
  reason?: string;
}


