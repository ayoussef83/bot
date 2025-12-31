import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateMessageDto } from './dto';

@Controller('marketing/messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations)
  create(@Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(createMessageDto);
  }

  @Get('conversation/:conversationId')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations, UserRole.sales)
  findAll(@Param('conversationId') conversationId: string) {
    return this.messagesService.findAll(conversationId);
  }

  @Get(':id')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations, UserRole.sales)
  findOne(@Param('id') id: string) {
    return this.messagesService.findOne(id);
  }
}



