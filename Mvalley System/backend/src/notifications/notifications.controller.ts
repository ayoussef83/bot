import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, NotificationChannel, NotificationStatus } from '@prisma/client';
import { SendMessageDto } from './dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  @Roles(
    UserRole.super_admin,
    UserRole.management,
    UserRole.operations,
    UserRole.sales,
  )
  sendMessage(@Body() sendMessageDto: SendMessageDto) {
    return this.notificationsService.sendMessage(sendMessageDto);
  }

  @Get()
  @Roles(
    UserRole.super_admin,
    UserRole.management,
    UserRole.operations,
    UserRole.sales,
  )
  findAll(
    @Query('channel') channel?: NotificationChannel,
    @Query('status') status?: NotificationStatus,
    @Query('studentId') studentId?: string,
    @Query('leadId') leadId?: string,
  ) {
    return this.notificationsService.findAll({
      channel,
      status,
      studentId,
      leadId,
    });
  }

  @Get(':id')
  @Roles(
    UserRole.super_admin,
    UserRole.management,
    UserRole.operations,
    UserRole.sales,
  )
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }
}

