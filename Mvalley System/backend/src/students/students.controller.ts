import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CreateStudentDto, UpdateStudentDto } from './dto';
import { CreateEnrollmentDto, UpdateEnrollmentDto } from './dto';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(
    UserRole.super_admin,
    UserRole.operations,
    UserRole.sales,
  )
  create(
    @Body() createStudentDto: CreateStudentDto,
    @CurrentUser() users: any,
  ) {
    return this.studentsService.create(createStudentDto, user.id);
  }

  @Get()
  @Roles(
    UserRole.super_admin,
    UserRole.management,
    UserRole.operations,
    UserRole.accounting,
    UserRole.sales,
    UserRole.instructor,
  )
  findAll(@CurrentUser() users: any) {
    return this.studentsService.findAll(user.role, user.id);
  }

  @Get('insights/unallocated-paid')
  @Roles(
    UserRole.super_admin,
    UserRole.management,
    UserRole.operations,
    UserRole.accounting,
    UserRole.sales,
  )
  getUnallocatedPaidInsight() {
    return this.studentsService.getUnallocatedPaidInsight();
  }

  @Get(':id')
  @Roles(
    UserRole.super_admin,
    UserRole.management,
    UserRole.operations,
    UserRole.accounting,
    UserRole.sales,
    UserRole.instructor,
  )
  findOne(@Param('id') id: string, @CurrentUser() users: any) {
    return this.studentsService.findOne(id, user.role, user.id);
  }

  @Get(':id/enrollments')
  @Roles(
    UserRole.super_admin,
    UserRole.management,
    UserRole.operations,
    UserRole.accounting,
    UserRole.sales,
    UserRole.instructor,
  )
  listEnrollments(@Param('id') id: string, @CurrentUser() users: any) {
    return this.studentsService.listEnrollments(id, user.role, user.id);
  }

  @Get(':id/sessions')
  @Roles(
    UserRole.super_admin,
    UserRole.management,
    UserRole.operations,
    UserRole.accounting,
    UserRole.sales,
    UserRole.instructor,
  )
  listSessions(@Param('id') id: string, @CurrentUser() users: any) {
    return this.studentsService.listSessions(id, user.role, user.id);
  }

  @Post(':id/enrollments')
  @Roles(UserRole.super_admin, UserRole.operations, UserRole.sales)
  addEnrollment(@Param('id') id: string, @Body() body: Omit<CreateEnrollmentDto, 'studentId'>, @CurrentUser() users: any) {
    return this.studentsService.addEnrollment(id, body.courseLevelId, body.classId, user.id);
  }

  @Patch('enrollments/:enrollmentId')
  @Roles(UserRole.super_admin, UserRole.operations, UserRole.instructor)
  updateEnrollment(
    @Param('enrollmentId') enrollmentId: string,
    @Body() body: UpdateEnrollmentDto,
    @CurrentUser() users: any,
  ) {
    return this.studentsService.updateEnrollment(enrollmentId, body, user.id);
  }

  @Delete('enrollments/:enrollmentId')
  @Roles(UserRole.super_admin, UserRole.operations)
  removeEnrollment(@Param('enrollmentId') enrollmentId: string, @CurrentUser() users: any) {
    return this.studentsService.removeEnrollment(enrollmentId, user.id);
  }

  @Patch(':id')
  @Roles(
    UserRole.super_admin,
    UserRole.operations,
  )
  update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @CurrentUser() users: any,
  ) {
    return this.studentsService.update(id, updateStudentDto, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.super_admin, UserRole.operations)
  remove(@Param('id') id: string, @CurrentUser() users: any) {
    return this.studentsService.remove(id, user.id);
  }
}

