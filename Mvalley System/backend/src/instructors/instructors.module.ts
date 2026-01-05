import { Module } from '@nestjs/common';
import { InstructorsService } from './instructors.service';
import { InstructorsController } from './instructors.controller';
import { PayrollModule } from '../payroll/payroll.module';

@Module({
  imports: [PayrollModule],
  providers: [InstructorsService],
  controllers: [InstructorsController],
  exports: [InstructorsService],
})
export class InstructorsModule {}

