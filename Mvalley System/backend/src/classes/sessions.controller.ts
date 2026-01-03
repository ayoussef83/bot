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
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CreateSessionDto, UpdateSessionDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';

@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @Roles(UserRole.super_admin, UserRole.operations)
  create(@Body() createSessionDto: CreateSessionDto, @CurrentUser() users: any) {
    return this.sessionsService.create(createSessionDto, user.id);
  }

  @Get()
  @Roles(
    UserRole.super_admin,
    UserRole.management,
    UserRole.operations,
    UserRole.instructor,
  )
  async findAll(
    @Query('classId') classId?: string,
    @Query('instructorId') instructorId?: string,
    @CurrentUser() user?: any,
  ) {
    // Instructors only see their own sessions
    if (user?.role === 'instructor' && !instructorId) {
      // Get instructor ID from user
      const instructor = await this.prisma.instructorss.findUnique({
        where: { userId: user.id },
      });
      return this.sessionsService.findAll(classId, instructor?.id);
    }
    return this.sessionsService.findAll(classId, instructorId);
  }

  @Get(':id')
  @Roles(
    UserRole.super_admin,
    UserRole.management,
    UserRole.operations,
    UserRole.instructor,
  )
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.super_admin, UserRole.operations, UserRole.instructor)
  update(
    @Param('id') id: string,
    @Body() updateSessionDto: UpdateSessionDto,
    @CurrentUser() users: any,
  ) {
    return this.sessionsService.update(id, updateSessionDto, user.id);
  }

  @Post(':id/confirm')
  @Roles(UserRole.instructor, UserRole.operations)
  async confirmAttendance(@Param('id') id: string, @CurrentUser() users: any) {
    const instructor = await this.prisma.instructorss.findUnique({
      where: { userId: user.id },
    });
    return this.sessionsService.confirmAttendance(id, instructor?.id || '');
  }

  @Delete(':id')
  @Roles(UserRole.super_admin, UserRole.operations)
  remove(@Param('id') id: string, @CurrentUser() users: any) {
    return this.sessionsService.remove(id, user.id);
  }
}

