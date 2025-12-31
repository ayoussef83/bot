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
import { ChannelAccountsService } from './channel-accounts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateChannelAccountDto, UpdateChannelAccountDto } from './dto';

@Controller('marketing/channel-accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChannelAccountsController {
  constructor(private readonly channelAccountsService: ChannelAccountsService) {}

  @Post()
  @Roles(UserRole.super_admin, UserRole.management)
  create(@Body() createChannelAccountDto: CreateChannelAccountDto) {
    return this.channelAccountsService.create(createChannelAccountDto);
  }

  @Get()
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations, UserRole.sales)
  findAll() {
    return this.channelAccountsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations, UserRole.sales)
  findOne(@Param('id') id: string) {
    return this.channelAccountsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.super_admin, UserRole.management)
  update(
    @Param('id') id: string,
    @Body() updateChannelAccountDto: UpdateChannelAccountDto,
  ) {
    return this.channelAccountsService.update(id, updateChannelAccountDto);
  }

  @Delete(':id')
  @Roles(UserRole.super_admin)
  remove(@Param('id') id: string) {
    return this.channelAccountsService.remove(id);
  }
}



