import { IsBoolean, IsEnum, IsObject, IsOptional } from 'class-validator';
import { IntegrationProvider } from '@prisma/client';

export class UpsertIntegrationConfigDto {
  @IsEnum(IntegrationProvider)
  provider: IntegrationProvider;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Safe (non-secret) values
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  // Secrets (passwords/tokens). Write-only.
  @IsOptional()
  @IsObject()
  secrets?: Record<string, any>;
}


