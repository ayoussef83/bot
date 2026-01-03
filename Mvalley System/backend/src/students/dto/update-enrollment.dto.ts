import { IsOptional, IsString } from 'class-validator';

export class UpdateEnrollmentDto {
  @IsOptional()
  @IsString()
  classId?: string | null;

  @IsOptional()
  @IsString()
  status?: string;
}


