import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { FollowUpsService } from './follow-ups.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CreateFollowUpDto } from './dto';

@Controller('follow-ups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FollowUpsController {
  constructor(private readonly followUpsService: FollowUpsService) {}

  @Post()
  @Roles(UserRole.super_admin, UserRole.sales)
  create(@Body() createFollowUpDto: CreateFollowUpDto, @CurrentUser() user: any) {
    return this.followUpsService.create(createFollowUpDto, user.id);
  }

  @Get('lead/:leadId')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.sales)
  findByLead(@Param('leadId') leadId: string) {
    return this.followUpsService.findByLead(leadId);
  }
}

