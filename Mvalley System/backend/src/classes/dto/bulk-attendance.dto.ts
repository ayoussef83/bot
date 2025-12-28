import { IsString, IsArray, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AttendanceItem {
  @IsString()
  studentId: string;

  @IsBoolean()
  attended: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkAttendanceDto {
  @IsString()
  sessionId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceItem)
  attendances: AttendanceItem[];
}

