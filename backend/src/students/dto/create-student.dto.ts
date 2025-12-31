import {
  IsString,
  IsInt,
  IsEnum,
  IsOptional,
  IsEmail,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { StudentStatus, LearningTrack } from '@prisma/client';

export class CreateStudentDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsInt()
  @Min(5)
  @Max(18)
  age: number;

  @IsEnum(LearningTrack)
  learningTrack: LearningTrack;

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

  // Admin-defined custom fields
  @IsOptional()
  @IsObject()
  customData?: Record<string, any>;
}

