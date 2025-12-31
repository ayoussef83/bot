import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateAttendanceDto {
  @IsOptional()
  @IsBoolean()
  attended?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

