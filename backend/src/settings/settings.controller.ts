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
import {
  UserRole,
  CustomFieldEntity,
  IntegrationProvider,
  MessageChannel,
} from '@prisma/client';
import { SettingsService } from './settings.service';
import {
  CreateCustomFieldDto,
  CreateMessageTemplateDto,
  UpdateCustomFieldDto,
  UpdateMessageTemplateDto,
  UpsertIntegrationConfigDto,
  TestSmsDto,
} from './dto';

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

  // -----------------------------
  // Integration configs
  // -----------------------------

  @Get('integrations/:provider')
  @Roles(UserRole.super_admin)
  getIntegration(@Param('provider') provider: IntegrationProvider) {
    return this.settingsService.getIntegrationConfig(provider);
  }

  @Post('integrations')
  @Roles(UserRole.super_admin)
  upsertIntegration(@Body() dto: UpsertIntegrationConfigDto) {
    return this.settingsService.upsertIntegrationConfig(dto);
  }

  // -----------------------------
  // Templates
  // -----------------------------

  @Get('templates')
  @Roles(UserRole.super_admin)
  listTemplates(@Query('channel') channel?: MessageChannel) {
    return this.settingsService.listTemplates(channel);
  }

  @Post('templates')
  @Roles(UserRole.super_admin)
  createTemplate(@Body() dto: CreateMessageTemplateDto, @CurrentUser() user: any) {
    return this.settingsService.createTemplate(dto, user?.id);
  }

  @Patch('templates/:id')
  @Roles(UserRole.super_admin)
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateMessageTemplateDto) {
    return this.settingsService.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  @Roles(UserRole.super_admin)
  deleteTemplate(@Param('id') id: string) {
    return this.settingsService.deleteTemplate(id);
  }

  @Post('test-sms')
  @Roles(UserRole.super_admin)
  sendTestSms(@Body() dto: TestSmsDto) {
    return this.settingsService.sendTestSms(dto);
  }

  @Get('smsmisr/balance')
  @Roles(UserRole.super_admin)
  getSmsMisrBalance() {
    return this.settingsService.getSmsMisrBalance();
  }
}


