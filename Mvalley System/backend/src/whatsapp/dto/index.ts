import { IsString, IsBoolean, IsOptional, MinLength } from 'class-validator';

export class StartWhatsAppDto {
  @IsString()
  @IsOptional()
  phoneE164?: string; // If provided, use pairing code instead of QR
}

export class SendWhatsAppDto {
  @IsString()
  @MinLength(1)
  remoteJid: string;

  @IsString()
  @MinLength(1)
  content: string;
}

export class SaveWhatsAppSettingsDto {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  aiAutoReplyEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  aiAutoReplyGroupsOnlyWhenMentioned?: boolean;

  @IsString()
  @IsOptional()
  dedicatedGroupId?: string;

  @IsString()
  @IsOptional()
  connectedPhone?: string;
}

export class MarkReadDto {
  @IsString()
  @MinLength(1)
  remoteJid: string;
}
