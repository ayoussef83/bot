import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomFieldDto, UpdateCustomFieldDto } from './dto';
import { CustomFieldEntity } from '@prisma/client';

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
}


