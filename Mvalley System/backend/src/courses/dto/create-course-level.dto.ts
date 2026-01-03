import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCourseLevelDto {
  @IsString()
  courseId: string;

  @IsString()
  name: string; // "Level 1", "Beginner", ...

  @IsOptional()
  @IsInt()
  @Min(1)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}


