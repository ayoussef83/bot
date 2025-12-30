import { PartialType } from '@nestjs/mapped-types';
import { CreateChannelAccountDto } from './create-channel-account.dto';
import { IsOptional, IsString, IsObject, IsEnum } from 'class-validator';
import { ChannelAccountStatus } from '@prisma/client';

export class UpdateChannelAccountDto extends PartialType(CreateChannelAccountDto) {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsEnum(ChannelAccountStatus)
  status?: ChannelAccountStatus;

  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}

