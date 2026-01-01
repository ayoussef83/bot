import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ParentsService } from './parents.service';

@Controller('parents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Post()
  @Roles(UserRole.super_admin, UserRole.operations, UserRole.sales)
  create(@Body() body: { firstName: string; lastName: string; phone: string; email?: string; address?: string }) {
    return this.parentsService.create(body);
  }

  @Get()
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations, UserRole.sales)
  findAll() {
    return this.parentsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations, UserRole.sales)
  findOne(@Param('id') id: string) {
    return this.parentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.super_admin, UserRole.operations, UserRole.sales)
  update(
    @Param('id') id: string,
    @Body() body: Partial<{ firstName: string; lastName: string; phone: string; email?: string; address?: string }>,
  ) {
    return this.parentsService.update(id, body);
  }
}


