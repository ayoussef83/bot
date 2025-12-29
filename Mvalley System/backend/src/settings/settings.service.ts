import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCustomFieldDto,
  CreateMessageTemplateDto,
  UpdateCustomFieldDto,
  UpdateMessageTemplateDto,
  UpsertIntegrationConfigDto,
} from './dto';
import {
  CustomFieldEntity,
  IntegrationProvider,
  MessageChannel,
} from '@prisma/client';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async listCustomFields(entity: CustomFieldEntity) {
    return this.prisma.customFieldDefinition.findMany({
      where: {
        entity,
        deletedAt: null,
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async createCustomField(dto: CreateCustomFieldDto, createdBy?: string) {
    const key = dto.key.trim();
    if (!key) throw new BadRequestException('key is required');

    return this.prisma.customFieldDefinition.create({
      data: {
        entity: dto.entity,
        key,
        label: dto.label.trim(),
        type: dto.type,
        required: dto.required ?? false,
        options: dto.options ?? undefined,
        order: dto.order ?? 0,
        isActive: dto.isActive ?? true,
        createdBy,
      },
    });
  }

  async updateCustomField(id: string, dto: UpdateCustomFieldDto) {
    const existing = await this.prisma.customFieldDefinition.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Custom field not found');

    return this.prisma.customFieldDefinition.update({
      where: { id },
      data: {
        ...(dto.label !== undefined ? { label: dto.label.trim() } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.required !== undefined ? { required: dto.required } : {}),
        ...(dto.options !== undefined ? { options: dto.options } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async deleteCustomField(id: string) {
    const existing = await this.prisma.customFieldDefinition.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Custom field not found');

    return this.prisma.customFieldDefinition.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  // -----------------------------
  // Integration settings (Zoho / SMSMisr)
  // -----------------------------

  async getIntegrationConfig(provider: IntegrationProvider) {
    const cfg = await this.prisma.integrationConfig.findUnique({
      where: { provider },
    });
    if (!cfg) {
      return { provider, isActive: false, config: null, secrets: null, hasSecrets: false };
    }

    // Never return secrets.
    return {
      id: cfg.id,
      provider: cfg.provider,
      isActive: cfg.isActive,
      config: cfg.config,
      hasSecrets: !!cfg.secrets,
      createdAt: cfg.createdAt,
      updatedAt: cfg.updatedAt,
    };
  }

  async upsertIntegrationConfig(dto: UpsertIntegrationConfigDto) {
    const existing = await this.prisma.integrationConfig.findUnique({
      where: { provider: dto.provider },
    });

    const nextConfig = dto.config ?? undefined;
    const nextSecrets = dto.secrets ?? undefined;

    if (!existing) {
      return this.prisma.integrationConfig.create({
        data: {
          provider: dto.provider,
          isActive: dto.isActive ?? true,
          config: nextConfig,
          secrets: nextSecrets,
        },
        select: {
          id: true,
          provider: true,
          isActive: true,
          config: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    return this.prisma.integrationConfig.update({
      where: { provider: dto.provider },
      data: {
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.config !== undefined ? { config: nextConfig } : {}),
        ...(dto.secrets !== undefined ? { secrets: nextSecrets } : {}),
      },
      select: {
        id: true,
        provider: true,
        isActive: true,
        config: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // -----------------------------
  // Message templates
  // -----------------------------

  async listTemplates(channel?: MessageChannel) {
    return this.prisma.messageTemplate.findMany({
      where: {
        deletedAt: null,
        ...(channel ? { channel } : {}),
      },
      orderBy: [{ channel: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async createTemplate(dto: CreateMessageTemplateDto, createdBy?: string) {
    const key = dto.key.trim();
    if (!key) throw new BadRequestException('key is required');
    return this.prisma.messageTemplate.create({
      data: {
        channel: dto.channel,
        key,
        name: dto.name.trim(),
        subject: dto.subject?.trim() || undefined,
        body: dto.body,
        isActive: dto.isActive ?? true,
        createdBy,
      },
    });
  }

  async updateTemplate(id: string, dto: UpdateMessageTemplateDto) {
    const existing = await this.prisma.messageTemplate.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Template not found');

    return this.prisma.messageTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.subject !== undefined ? { subject: dto.subject?.trim() || null } : {}),
        ...(dto.body !== undefined ? { body: dto.body } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async deleteTemplate(id: string) {
    const existing = await this.prisma.messageTemplate.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Template not found');

    return this.prisma.messageTemplate.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}


