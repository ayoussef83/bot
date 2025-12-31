import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CreateAttendanceDto, UpdateAttendanceDto, BulkAttendanceDto } from './dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(UserRole.super_admin, UserRole.operations, UserRole.instructor)
  create(
    @Body() createAttendanceDto: CreateAttendanceDto,
    @CurrentUser() user: any,
  ) {
    return this.attendanceService.create(createAttendanceDto, user.id);
  }

  @Post('bulk')
  @Roles(UserRole.super_admin, UserRole.operations, UserRole.instructor)
  bulkUpdate(
    @Body() bulkAttendanceDto: BulkAttendanceDto,
    @CurrentUser() user: any,
  ) {
    return this.attendanceService.bulkUpdate(
      bulkAttendanceDto.sessionId,
      bulkAttendanceDto.attendances,
      user.id,
    );
  }

  @Patch(':id')
  @Roles(UserRole.super_admin, UserRole.operations, UserRole.instructor)
  update(
    @Param('id') id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
    @CurrentUser() user: any,
  ) {
    return this.attendanceService.update(id, updateAttendanceDto, user.id);
  }

  @Get('session/:sessionId')
  @Roles(
    UserRole.super_admin,
    UserRole.management,
    UserRole.operations,
    UserRole.instructor,
  )
  findBySession(@Param('sessionId') sessionId: string) {
    return this.attendanceService.findBySession(sessionId);
  }
}

