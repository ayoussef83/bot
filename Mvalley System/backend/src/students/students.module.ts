import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { ClassesModule } from '../classes/classes.module';

@Module({
  imports: [ClassesModule],
  providers: [StudentsService],
  controllers: [StudentsController],
  exports: [StudentsService],
})
export class StudentsModule {}

