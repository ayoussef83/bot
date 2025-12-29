import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, CustomFieldEntity } from '@prisma/client';
import { SettingsService } from './settings.service';
import { CreateCustomFieldDto, UpdateCustomFieldDto } from './dto';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('custom-fields')
  @Roles(UserRole.super_admin)
  listCustomFields(@Query('entity') entity: CustomFieldEntity) {
    return this.settingsService.listCustomFields(entity);
  }

  @Post('custom-fields')
  @Roles(UserRole.super_admin)
  createCustomField(@Body() dto: CreateCustomFieldDto, @CurrentUser() user: any) {
    return this.settingsService.createCustomField(dto, user?.id);
  }

  @Patch('custom-fields/:id')
  @Roles(UserRole.super_admin)
  updateCustomField(@Param('id') id: string, @Body() dto: UpdateCustomFieldDto) {
    return this.settingsService.updateCustomField(id, dto);
  }

  @Delete('custom-fields/:id')
  @Roles(UserRole.super_admin)
  deleteCustomField(@Param('id') id: string) {
    return this.settingsService.deleteCustomField(id);
  }
}


