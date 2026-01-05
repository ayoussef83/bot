import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateInstructorAvailabilityDto,
  CreateInstructorCostModelDto,
  CreateInstructorDto,
  UpdateInstructorAvailabilityDto,
  UpdateInstructorCostModelDto,
  UpdateInstructorDto,
} from './dto';

@Injectable()
export class InstructorsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateInstructorDto, createdBy: string) {
    const instructor = await this.prisma.instructor.create({
      data: {
        ...data,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        classes: {
          include: {
            students: {
              where: { deletedAt: null },
            },
          },
        },
        sessions: {
          orderBy: { scheduledDate: 'desc' },
          take: 10,
        },
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: createdBy,
        action: 'create',
        entityType: 'Instructor',
        entityId: instructor.id,
      },
    });

    return instructor;
  }

  async findAll() {
    return this.prisma.instructor.findMany({
      where: { deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        classes: {
          where: { deletedAt: null },
        },
        _count: {
          select: {
            classes: true,
            sessions: true,
            availability: true,
            payrolls: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const instructor = await this.prisma.instructor.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
        skills: {
          where: { deletedAt: null },
          orderBy: [{ name: 'asc' }],
        },
        contracts: {
          where: { deletedAt: null },
          orderBy: [{ startDate: 'desc' }],
          take: 5,
        },
        classes: {
          where: { deletedAt: null },
          include: {
            students: {
              where: { deletedAt: null },
            },
          },
        },
        availability: {
          where: { deletedAt: null },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
        blackoutDates: {
          where: { deletedAt: null },
          orderBy: [{ startDate: 'asc' }],
        },
        costModels: {
          where: { deletedAt: null },
          orderBy: [{ effectiveFrom: 'desc' }],
        },
        payrolls: {
          where: { deletedAt: null },
          orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
          take: 12,
        },
        documents: {
          where: { deletedAt: null },
          orderBy: [{ createdAt: 'desc' }],
        },
        feedbackSummaries: {
          where: { deletedAt: null },
          orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
          take: 12,
        },
        sessions: {
          orderBy: { scheduledDate: 'desc' },
          include: {
            class: true,
            attendances: true,
          },
        },
      },
    });

    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    return instructor;
  }

  async findOneForUser(instructorId: string, user: any) {
    const instructor = await this.findOne(instructorId);
    if (user?.role === 'instructor' && instructor.userId !== user.id) {
      throw new NotFoundException('Instructor not found');
    }
    return instructor;
  }

  async update(id: string, data: UpdateInstructorDto, updatedBy: string) {
    const instructor = await this.prisma.instructor.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        classes: true,
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: updatedBy,
        action: 'update',
        entityType: 'Instructor',
        entityId: id,
        changes: JSON.stringify(data),
      },
    });

    return instructor;
  }

  async remove(id: string, deletedBy: string) {
    const instructor = await this.prisma.instructor.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: deletedBy,
        action: 'delete',
        entityType: 'Instructor',
        entityId: id,
      },
    });

    return instructor;
  }

  private parseTimeToMinutes(value: string) {
    const m = /^(\d{2}):(\d{2})$/.exec(value || '');
    if (!m) return null;
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    if (!Number.isFinite(hh) || !Number.isFinite(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    return hh * 60 + mm;
  }

  async addAvailability(instructorId: string, dto: CreateInstructorAvailabilityDto, createdBy: string) {
    const existing = await this.prisma.instructor.findFirst({ where: { id: instructorId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Instructor not found');

    const start = this.parseTimeToMinutes(dto.startTime);
    const end = this.parseTimeToMinutes(dto.endTime);
    if (start === null || end === null || start >= end) {
      throw new BadRequestException('Invalid availability time range');
    }

    // Prevent overlapping active availabilities for same day + (same location or both null)
    const overlaps = await this.prisma.instructorAvailability.findFirst({
      where: {
        instructorId,
        deletedAt: null,
        isActive: true,
        dayOfWeek: dto.dayOfWeek,
        OR: [
          { location: dto.location ?? null },
          ...(dto.location ? [{ location: null }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (overlaps) {
      const oStart = this.parseTimeToMinutes(overlaps.startTime) ?? 0;
      const oEnd = this.parseTimeToMinutes(overlaps.endTime) ?? 0;
      const isOverlap = Math.max(start, oStart) < Math.min(end, oEnd);
      if (isOverlap) throw new BadRequestException('Availability overlaps an existing availability');
    }

    const availability = await this.prisma.instructorAvailability.create({
      data: {
        instructorId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        location: dto.location ?? null,
        isActive: dto.isActive ?? true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: createdBy,
        action: 'create',
        entityType: 'InstructorAvailability',
        entityId: availability.id,
        changes: JSON.stringify(dto),
      },
    });

    return availability;
  }

  async listAvailability(instructorId: string, user: any) {
    await this.findOneForUser(instructorId, user);
    return this.prisma.instructorAvailability.findMany({
      where: { instructorId, deletedAt: null },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async updateAvailability(availabilityId: string, dto: UpdateInstructorAvailabilityDto, updatedBy: string) {
    const existing = await this.prisma.instructorAvailability.findFirst({ where: { id: availabilityId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Availability not found');

    const startTime = dto.startTime ?? existing.startTime;
    const endTime = dto.endTime ?? existing.endTime;
    const start = this.parseTimeToMinutes(startTime);
    const end = this.parseTimeToMinutes(endTime);
    if (start === null || end === null || start >= end) throw new BadRequestException('Invalid availability time range');

    const updated = await this.prisma.instructorAvailability.update({
      where: { id: availabilityId },
      data: {
        ...dto,
        startTime,
        endTime,
        location: dto.location === undefined ? existing.location : dto.location,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: updatedBy,
        action: 'update',
        entityType: 'InstructorAvailability',
        entityId: updated.id,
        changes: JSON.stringify(dto),
      },
    });

    return updated;
  }

  async deleteAvailability(availabilityId: string, deletedBy: string) {
    const existing = await this.prisma.instructorAvailability.findFirst({ where: { id: availabilityId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Availability not found');
    const deleted = await this.prisma.instructorAvailability.update({
      where: { id: availabilityId },
      data: { deletedAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: deletedBy,
        action: 'delete',
        entityType: 'InstructorAvailability',
        entityId: deleted.id,
      },
    });
    return deleted;
  }

  private parseDateOrThrow(value: string, label: string) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) throw new BadRequestException(`Invalid ${label}`);
    return d;
  }

  async listCostModels(instructorId: string, user: any) {
    await this.findOneForUser(instructorId, user);
    return this.prisma.instructorCostModel.findMany({
      where: { instructorId, deletedAt: null },
      orderBy: [{ effectiveFrom: 'desc' }],
    });
  }

  async createCostModel(instructorId: string, dto: CreateInstructorCostModelDto, createdBy: string) {
    const existing = await this.prisma.instructor.findFirst({ where: { id: instructorId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Instructor not found');

    const effectiveFrom = this.parseDateOrThrow(dto.effectiveFrom, 'effectiveFrom');
    const effectiveTo = dto.effectiveTo ? this.parseDateOrThrow(dto.effectiveTo, 'effectiveTo') : null;
    if (effectiveTo && effectiveFrom > effectiveTo) throw new BadRequestException('effectiveFrom must be before effectiveTo');

    const costModel = await this.prisma.instructorCostModel.create({
      data: {
        instructorId,
        type: dto.type,
        amount: dto.amount,
        currency: (dto.currency || 'EGP').toUpperCase(),
        effectiveFrom,
        effectiveTo,
        notes: dto.notes,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: createdBy,
        action: 'create',
        entityType: 'InstructorCostModel',
        entityId: costModel.id,
        changes: JSON.stringify(dto),
      },
    });

    return costModel;
  }

  async updateCostModel(costModelId: string, dto: UpdateInstructorCostModelDto, updatedBy: string) {
    const existing = await this.prisma.instructorCostModel.findFirst({ where: { id: costModelId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Cost model not found');

    const effectiveFrom = dto.effectiveFrom ? this.parseDateOrThrow(dto.effectiveFrom, 'effectiveFrom') : existing.effectiveFrom;
    const effectiveTo =
      dto.effectiveTo === undefined
        ? existing.effectiveTo
        : dto.effectiveTo === null
          ? null
          : this.parseDateOrThrow(dto.effectiveTo, 'effectiveTo');
    if (effectiveTo && effectiveFrom > effectiveTo) throw new BadRequestException('effectiveFrom must be before effectiveTo');

    const updated = await this.prisma.instructorCostModel.update({
      where: { id: costModelId },
      data: {
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.currency !== undefined ? { currency: String(dto.currency || 'EGP').toUpperCase() } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        effectiveFrom,
        effectiveTo,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: updatedBy,
        action: 'update',
        entityType: 'InstructorCostModel',
        entityId: updated.id,
        changes: JSON.stringify(dto),
      },
    });

    return updated;
  }

  async deleteCostModel(costModelId: string, deletedBy: string) {
    const existing = await this.prisma.instructorCostModel.findFirst({ where: { id: costModelId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Cost model not found');
    const deleted = await this.prisma.instructorCostModel.update({
      where: { id: costModelId },
      data: { deletedAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: deletedBy,
        action: 'delete',
        entityType: 'InstructorCostModel',
        entityId: deleted.id,
      },
    });
    return deleted;
  }
}

