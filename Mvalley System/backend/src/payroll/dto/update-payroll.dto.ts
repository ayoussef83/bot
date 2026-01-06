import { IsEnum } from 'class-validator';
import { InstructorPayrollStatus } from '@prisma/client';

export class UpdatePayrollDto {
  @IsEnum(InstructorPayrollStatus)
  status!: InstructorPayrollStatus;
}


