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
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import {
  CreateConversationDto,
  UpdateConversationDto,
  ConvertToLeadDto,
  GetConversationsQueryDto,
} from './dto';

@Controller('marketing/conversations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations)
  create(@Body() createConversationDto: CreateConversationDto) {
    return this.conversationsService.create(createConversationDto);
  }

  @Get()
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations, UserRole.sales)
  findAll(@Query() query: GetConversationsQueryDto) {
    return this.conversationsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations, UserRole.sales)
  findOne(@Param('id') id: string) {
    return this.conversationsService.findOne(id);
  }

  @Post(':id/mark-viewed')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations, UserRole.sales)
  markViewed(@Param('id') id: string) {
    return this.conversationsService.markViewed(id);
  }

  @Patch(':id')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations)
  update(
    @Param('id') id: string,
    @Body() updateConversationDto: UpdateConversationDto,
  ) {
    return this.conversationsService.update(id, updateConversationDto);
  }

  @Post(':id/convert-to-lead')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations)
  convertToLead(
    @Param('id') id: string,
    @Body() convertToLeadDto: ConvertToLeadDto,
    @CurrentUser() user: any,
  ) {
    return this.conversationsService.convertToLead(id, convertToLeadDto, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.super_admin)
  remove(@Param('id') id: string) {
    return this.conversationsService.remove(id);
  }
}



