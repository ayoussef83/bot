import { IsString, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateAttendanceDto {
  @IsUUID()
  sessionId: string;

  @IsUUID()
  studentId: string;

  @IsBoolean()
  attended: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

