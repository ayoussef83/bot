import { IsOptional, IsString } from 'class-validator';

export class CreateEnrollmentDto {
  @IsString()
  studentId: string;

  @IsString()
  courseLevelId: string;

  @IsOptional()
  @IsString()
  classId?: string;
}


