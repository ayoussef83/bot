import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Location } from '@prisma/client';

export class CreateRoomDto {
  @IsString()
  name!: string;

  @IsEnum(Location)
  location!: Location;

  @IsInt()
  @Min(1)
  capacity!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}


