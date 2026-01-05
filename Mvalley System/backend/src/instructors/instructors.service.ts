import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstructorAvailabilityDto, CreateInstructorDto, UpdateInstructorDto } from './dto';

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
          },
        },
        classes: {
          where: { deletedAt: null },
          include: {
            students: {
              where: { deletedAt: null },
            },
          },
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
}

