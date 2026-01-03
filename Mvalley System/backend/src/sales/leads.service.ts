import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto, UpdateLeadDto } from './dto';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateLeadDto, createdBy: string) {
    const lead = await this.prisma.lead.create({
      data: {
        ...data,
        createdBy,
      },
      include: {
        followUps: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: createdBy,
        action: 'create',
        entityType: 'Lead',
        entityId: lead.id,
      },
    });

    return lead;
  }

  async findAll(status?: string, source?: string) {
    return this.prisma.lead.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(source && { source: source as any }),
        deletedAt: null,
      },
      include: {
        followUps: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, deletedAt: null },
      include: {
        followUps: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }

  async update(id: string, data: UpdateLeadDto, updatedBy: string) {
    const lead = await this.prisma.lead.update({
      where: { id },
      data,
      include: {
        followUps: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: updatedBy,
        action: 'update',
        entityType: 'Lead',
        entityId: id,
        changes: JSON.stringify(data),
      },
    });

    return lead;
  }

  async convertToStudent(leadId: string, studentData: any, convertedBy: string) {
    // This would typically create a student from the lead
    // For now, just mark as converted
    const lead = await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        status: 'converted',
        convertedAt: new Date(),
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: convertedBy,
        action: 'update',
        entityType: 'Lead',
        entityId: leadId,
        changes: JSON.stringify({ converted: true }),
      },
    });

    return lead;
  }

  async convertToContact(leadId: string, convertedBy: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, deletedAt: null },
    });
    if (!lead) throw new NotFoundException('Lead not found');

    // If already linked, return the lead (idempotent)
    if (lead.convertedToParentId) {
      return this.prisma.lead.update({
        where: { id: leadId },
        data: { status: 'converted', convertedAt: lead.convertedAt ?? new Date() },
        include: { convertedParent: true },
      });
    }

    // Try to match an existing parent contact by phone (primary identifier)
    let parent = await this.prisma.parent.findFirst({
      where: { phone: lead.phone, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!parent) {
      parent = await this.prisma.parent.create({
        data: {
          firstName: lead.firstName,
          lastName: lead.lastName,
          phone: lead.phone,
          email: lead.email || undefined,
        },
      });
    }

    const updatedLead = await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        status: 'converted',
        convertedAt: new Date(),
        convertedToParentId: parent.id,
      },
      include: { convertedParent: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: convertedBy,
        action: 'update',
        entityType: 'Lead',
        entityId: leadId,
        changes: JSON.stringify({ convertedToParentId: parent.id }),
      },
    });

    return updatedLead;
  }

  async remove(id: string, deletedBy: string) {
    const lead = await this.prisma.lead.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: deletedBy,
        action: 'delete',
        entityType: 'Lead',
        entityId: id,
      },
    });

    return lead;
  }
}

