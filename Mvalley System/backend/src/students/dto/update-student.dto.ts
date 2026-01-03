import {
  IsString,
  IsInt,
  IsEnum,
  IsOptional,
  IsEmail,
  IsObject,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { StudentStatus, LearningTrack } from '@prisma/client';
import { Transform } from 'class-transformer';

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
  @Transform(({ value }) => (value === '' ? null : value))
  @ValidateIf((_, value) => value === null || typeof value === 'string')
  parentId?: string | null;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @ValidateIf((_, value) => value === null || typeof value === 'string')
  classId?: string | null;

  @IsOptional()
  @IsObject()
  customData?: Record<string, any>;
}

