import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class PresignInstructorDocumentUploadDto {
  @IsString()
  type!: string; // e.g. "id", "contract", "certificate"

  @IsString()
  name!: string; // original file name

  @IsString()
  contentType!: string; // MIME type

  @IsOptional()
  @IsBoolean()
  visibleToInstructor?: boolean;
}


