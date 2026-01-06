import { IsOptional, IsString } from 'class-validator';

export class CreateClassFromSlotDto {
  @IsString()
  teachingSlotId!: string;

  // Optional friendly name override; schedule/instructor/room always come from the slot
  @IsOptional()
  @IsString()
  name?: string;
}


