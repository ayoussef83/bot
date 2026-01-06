import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TeachingSlotsController } from './teaching-slots.controller';
import { TeachingSlotsService } from './teaching-slots.service';

@Module({
  imports: [PrismaModule],
  controllers: [TeachingSlotsController],
  providers: [TeachingSlotsService],
  exports: [TeachingSlotsService],
})
export class TeachingSlotsModule {}


