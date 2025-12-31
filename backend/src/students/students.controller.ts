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
    @CurrentUser() user: any,
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
  findAll(@CurrentUser() user: any) {
    return this.studentsService.findAll(user.role, user.id);
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
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.studentsService.findOne(id, user.role, user.id);
  }

  @Patch(':id')
  @Roles(
    UserRole.super_admin,
    UserRole.operations,
  )
  update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @CurrentUser() user: any,
  ) {
    return this.studentsService.update(id, updateStudentDto, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.super_admin, UserRole.operations)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.studentsService.remove(id, user.id);
  }
}

