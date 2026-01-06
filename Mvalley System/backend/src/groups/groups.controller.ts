import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { GroupsService } from './groups.service';

@Controller('groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations, UserRole.sales)
  findAll() {
    return this.groupsService.findAll();
  }

  @Post()
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations)
  create(
    @Body() body: { name?: string; courseLevelId: string; defaultClassId?: string | null },
    @CurrentUser() user: any,
  ) {
    return this.groupsService.create({ ...body, createdById: user?.id });
  }

  @Patch(':id')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations)
  update(@Param('id') id: string, @Body() body: Partial<{ name: string; courseLevelId: string; defaultClassId?: string | null }>) {
    return this.groupsService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations)
  remove(@Param('id') id: string) {
    return this.groupsService.remove(id);
  }
}


