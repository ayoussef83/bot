import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { InstructorsService } from './instructors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CreateInstructorDto, UpdateInstructorDto } from './dto';

@Controller('instructors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InstructorsController {
  constructor(private readonly instructorsService: InstructorsService) {}

  @Post()
  @Roles(UserRole.super_admin, UserRole.operations)
  create(
    @Body() createInstructorDto: CreateInstructorDto,
    @CurrentUser() users: any,
  ) {
    return this.instructorsService.create(createInstructorDto, user.id);
  }

  @Get()
  @Roles(
    UserRole.super_admin,
    UserRole.management,
    UserRole.operations,
    UserRole.accounting,
  )
  findAll() {
    return this.instructorsService.findAll();
  }

  @Get(':id')
  @Roles(
    UserRole.super_admin,
    UserRole.management,
    UserRole.operations,
    UserRole.accounting,
    UserRole.instructor,
  )
  findOne(@Param('id') id: string) {
    return this.instructorsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.super_admin, UserRole.operations)
  update(
    @Param('id') id: string,
    @Body() updateInstructorDto: UpdateInstructorDto,
    @CurrentUser() users: any,
  ) {
    return this.instructorsService.update(id, updateInstructorDto, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.super_admin)
  remove(@Param('id') id: string, @CurrentUser() users: any) {
    return this.instructorsService.remove(id, user.id);
  }
}

