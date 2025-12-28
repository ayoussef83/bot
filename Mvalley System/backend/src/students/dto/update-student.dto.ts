import {
  IsString,
  IsInt,
  IsEnum,
  IsOptional,
  IsEmail,
  Min,
  Max,
} from 'class-validator';
import { StudentStatus, LearningTrack } from '@prisma/client';

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(18)
  age?: number;

  @IsOptional()
  @IsEnum(LearningTrack)
  learningTrack?: LearningTrack;

  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  classId?: string;
}

