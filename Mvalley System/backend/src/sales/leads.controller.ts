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
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CreateLeadDto, UpdateLeadDto } from './dto';
import { GetLeadsQueryDto } from './dto/get-leads-query.dto';

@Controller('leads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @Roles(UserRole.super_admin, UserRole.sales)
  create(@Body() createLeadDto: CreateLeadDto, @CurrentUser() user: any) {
    return this.leadsService.create(createLeadDto, user.id);
  }

  @Get()
  @Roles(UserRole.super_admin, UserRole.management, UserRole.sales)
  findAll(@Query() query: GetLeadsQueryDto) {
    return this.leadsService.findAll(query.status, query.source);
  }

  @Get(':id')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.sales)
  findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.super_admin, UserRole.sales)
  update(
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
    @CurrentUser() user: any,
  ) {
    return this.leadsService.update(id, updateLeadDto, user.id);
  }

  @Post(':id/convert')
  @Roles(UserRole.super_admin, UserRole.sales)
  convertToStudent(
    @Param('id') id: string,
    @Body() studentData: any,
    @CurrentUser() user: any,
  ) {
    return this.leadsService.convertToStudent(id, studentData, user.id);
  }

  @Post(':id/convert-to-contact')
  @Roles(UserRole.super_admin, UserRole.sales)
  convertToContact(@Param('id') id: string, @CurrentUser() user: any) {
    return this.leadsService.convertToContact(id, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.super_admin, UserRole.sales)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.leadsService.remove(id, user.id);
  }
}

