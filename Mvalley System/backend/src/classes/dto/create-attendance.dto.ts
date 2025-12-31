import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateAttendanceDto {
  @IsString()
  sessionId: string;

  @IsString()
  studentId: string;

  @IsBoolean()
  attended: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

