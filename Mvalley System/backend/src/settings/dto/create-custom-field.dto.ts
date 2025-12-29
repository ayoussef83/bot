import { IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { CustomFieldEntity, CustomFieldType } from '@prisma/client';

export class CreateCustomFieldDto {
  @IsEnum(CustomFieldEntity)
  entity: CustomFieldEntity;

  // machine key (unique per entity). Example: "sourceChannel"
  @IsString()
  key: string;

  @IsString()
  label: string;

  @IsEnum(CustomFieldType)
  type: CustomFieldType;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  // For type=select we expect something like { choices: ["A","B"] }
  @IsOptional()
  @IsObject()
  options?: Record<string, any>;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}



