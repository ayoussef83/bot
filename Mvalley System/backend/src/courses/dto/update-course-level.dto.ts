import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateCourseLevelDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}


