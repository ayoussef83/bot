import { IsString } from 'class-validator';

export class ConfirmClassDto {
  @IsString()
  reason!: string;
}


