import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { TeachingSlotsService } from './teaching-slots.service';
import { CreateTeachingSlotDto, UpdateTeachingSlotDto } from './dto';

@Controller('teaching-slots')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachingSlotsController {
  constructor(private readonly teachingSlotsService: TeachingSlotsService) {}

  @Get()
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations, UserRole.sales)
  findAll() {
    return this.teachingSlotsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations, UserRole.sales)
  findOne(@Param('id') id: string) {
    return this.teachingSlotsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.super_admin, UserRole.operations)
  create(@Body() dto: CreateTeachingSlotDto, @CurrentUser() user: any) {
    return this.teachingSlotsService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(UserRole.super_admin, UserRole.operations)
  update(@Param('id') id: string, @Body() dto: UpdateTeachingSlotDto, @CurrentUser() user: any) {
    return this.teachingSlotsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.super_admin, UserRole.operations)
  remove(@Param('id') id: string, @Body() body: { reason: string }, @CurrentUser() user: any) {
    return this.teachingSlotsService.remove(id, body?.reason, user.id);
  }
}


