import { Module } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';

@Module({
  providers: [ClassesService, SessionsService, AttendanceService],
  controllers: [ClassesController, SessionsController, AttendanceController],
  exports: [ClassesService, SessionsService, AttendanceService],
})
export class ClassesModule {}

