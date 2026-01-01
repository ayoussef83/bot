import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class SetRosterDto {
  @IsString()
  sessionId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  studentIds: string[];
}


