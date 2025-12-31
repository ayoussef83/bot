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
import { ClassesService } from './classes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CreateClassDto, UpdateClassDto } from './dto';

@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @Roles(UserRole.super_admin, UserRole.operations)
  create(@Body() createClassDto: CreateClassDto, @CurrentUser() user: any) {
    return this.classesService.create(createClassDto, user.id);
  }

  @Get()
  @Roles(
    UserRole.super_admin,
    UserRole.management,
    UserRole.operations,
    UserRole.instructor,
  )
  findAll() {
    return this.classesService.findAll();
  }

  @Get(':id')
  @Roles(
    UserRole.super_admin,
    UserRole.management,
    UserRole.operations,
    UserRole.instructor,
  )
  findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.super_admin, UserRole.operations)
  update(
    @Param('id') id: string,
    @Body() updateClassDto: UpdateClassDto,
    @CurrentUser() user: any,
  ) {
    return this.classesService.update(id, updateClassDto, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.super_admin, UserRole.operations)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.classesService.remove(id, user.id);
  }
}

