import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CoursesService } from './courses.service';
import { CreateCourseDto, CreateCourseLevelDto, UpdateCourseDto, UpdateCourseLevelDto } from './dto';

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations, UserRole.sales, UserRole.instructor)
  list() {
    return this.coursesService.listCourses();
  }

  @Get('levels')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations, UserRole.sales, UserRole.instructor)
  listLevels() {
    return this.coursesService.listLevels();
  }

  @Post()
  @Roles(UserRole.super_admin, UserRole.operations)
  create(@Body() dto: CreateCourseDto) {
    return this.coursesService.createCourse(dto);
  }

  @Get(':id')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations, UserRole.sales, UserRole.instructor)
  get(@Param('id') id: string) {
    return this.coursesService.getCourse(id);
  }

  @Patch(':id')
  @Roles(UserRole.super_admin, UserRole.operations)
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.updateCourse(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.super_admin, UserRole.operations)
  remove(@Param('id') id: string) {
    return this.coursesService.deleteCourse(id);
  }

  @Post('levels')
  @Roles(UserRole.super_admin, UserRole.operations)
  createLevel(@Body() dto: CreateCourseLevelDto) {
    return this.coursesService.createLevel(dto);
  }

  @Patch('levels/:id')
  @Roles(UserRole.super_admin, UserRole.operations)
  updateLevel(@Param('id') id: string, @Body() dto: UpdateCourseLevelDto) {
    return this.coursesService.updateLevel(id, dto);
  }

  @Delete('levels/:id')
  @Roles(UserRole.super_admin, UserRole.operations)
  deleteLevel(@Param('id') id: string) {
    return this.coursesService.deleteLevel(id);
  }
}


