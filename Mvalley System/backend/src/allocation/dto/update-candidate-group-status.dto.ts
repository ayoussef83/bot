import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateCandidateGroupStatusDto {
  @IsIn(['hold', 'reject'])
  action!: 'hold' | 'reject';

  @IsString()
  reason!: string;
}

export class ConfirmCandidateGroupDto {
  @IsString()
  reason!: string;

  @IsOptional()
  @IsString()
  instructorId?: string;

  @IsOptional()
  @IsString()
  roomId?: string;
}


