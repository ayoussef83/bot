import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ParticipantType } from '@prisma/client';

export class CreateParticipantDto {
  @IsOptional()
  @IsEnum(ParticipantType)
  type?: ParticipantType;

  @IsOptional()
  @IsString()
  platformUserId?: string; // Meta user ID, WhatsApp number

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  profilePictureUrl?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;
}







