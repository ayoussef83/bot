import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { RoomsService } from './rooms.service';
import { CreateRoomAvailabilityDto, CreateRoomDto, UpdateRoomAvailabilityDto, UpdateRoomDto } from './dto';

@Controller('rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations)
  findAll() {
    return this.roomsService.findAll();
  }

  @Post()
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations)
  create(@Body() dto: CreateRoomDto, @CurrentUser() user: any) {
    return this.roomsService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations)
  update(@Param('id') id: string, @Body() dto: UpdateRoomDto, @CurrentUser() user: any) {
    return this.roomsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.roomsService.remove(id, user.id);
  }

  @Post(':id/availability')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations)
  addAvailability(@Param('id') roomId: string, @Body() dto: CreateRoomAvailabilityDto, @CurrentUser() user: any) {
    return this.roomsService.addAvailability(roomId, dto, user.id);
  }

  @Patch('availability/:id')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations)
  updateAvailability(@Param('id') id: string, @Body() dto: UpdateRoomAvailabilityDto, @CurrentUser() user: any) {
    return this.roomsService.updateAvailability(id, dto, user.id);
  }

  @Delete('availability/:id')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations)
  deleteAvailability(@Param('id') id: string, @CurrentUser() user: any) {
    return this.roomsService.deleteAvailability(id, user.id);
  }
}


