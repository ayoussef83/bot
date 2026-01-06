import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeachingSlotDto, UpdateTeachingSlotDto } from './dto';
import { TeachingSlotStatus } from '@prisma/client';

function isHHmm(v: string) {
  return /^\d{2}:\d{2}$/.test(String(v || '').trim());
}
function timeToMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
  return h * 60 + m;
}
function normalizeDateInput(value?: string | null) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const v = String(value).trim();
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(v);
  const d = isDateOnly ? new Date(`${v}T00:00:00.000Z`) : new Date(v);
  if (Number.isNaN(d.getTime())) throw new BadRequestException(`Invalid date: ${value}`);
  return d;
}

@Injectable()
export class TeachingSlotsService {
  constructor(private prisma: PrismaService) {}

  private async assertNoOverlap(params: {
    excludeId?: string;
    instructorId: string;
    roomId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }) {
    const start = timeToMinutes(params.startTime);
    const end = timeToMinutes(params.endTime);
    const overlapWhere = (base: any) => ({
      deletedAt: null,
      dayOfWeek: params.dayOfWeek,
      ...base,
      NOT: params.excludeId ? { id: params.excludeId } : undefined,
    });

    const slots = await this.prisma.teachingSlot.findMany({
      where: {
        deletedAt: null,
        dayOfWeek: params.dayOfWeek,
        OR: [{ instructorId: params.instructorId }, { roomId: params.roomId }],
      },
      select: { id: true, instructorId: true, roomId: true, startTime: true, endTime: true, status: true },
    });

    for (const s of slots) {
      if (params.excludeId && s.id === params.excludeId) continue;
      if (s.status === TeachingSlotStatus.inactive) continue;
      const s0 = timeToMinutes(String(s.startTime));
      const s1 = timeToMinutes(String(s.endTime));
      const overlaps = start < s1 && s0 < end;
      if (!overlaps) continue;
      if (s.instructorId === params.instructorId) {
        throw new BadRequestException('Instructor already has an overlapping teaching slot');
      }
      if (s.roomId === params.roomId) {
        throw new BadRequestException('Room already has an overlapping teaching slot');
      }
    }
  }

  async findAll() {
    return this.prisma.teachingSlot.findMany({
      where: { deletedAt: null },
      orderBy: [{ status: 'asc' }, { dayOfWeek: 'asc' }, { startTime: 'asc' }],
      include: {
        courseLevel: { include: { course: true } },
        instructor: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
        room: true,
        currentClass: {
          include: {
            enrollments: { where: { status: 'active' } },
          },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async findOne(id: string) {
    const slot = await this.prisma.teachingSlot.findFirst({
      where: { id, deletedAt: null },
      include: {
        courseLevel: { include: { course: true } },
        instructor: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        room: true,
        currentClass: true,
        classes: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!slot) throw new NotFoundException('Teaching slot not found');
    return slot;
  }

  async create(dto: CreateTeachingSlotDto, userId: string) {
    if (!isHHmm(dto.startTime) || !isHHmm(dto.endTime)) throw new BadRequestException('Invalid time format');
    if (timeToMinutes(dto.startTime) >= timeToMinutes(dto.endTime)) throw new BadRequestException('Invalid time range');
    if (dto.minCapacity > dto.maxCapacity) throw new BadRequestException('minCapacity cannot exceed maxCapacity');

    await this.assertNoOverlap({
      instructorId: dto.instructorId,
      roomId: dto.roomId,
      dayOfWeek: dto.dayOfWeek,
      startTime: dto.startTime,
      endTime: dto.endTime,
    });

    const created = await this.prisma.teachingSlot.create({
      data: {
        status: TeachingSlotStatus.open,
        courseLevelId: dto.courseLevelId,
        instructorId: dto.instructorId,
        roomId: dto.roomId,
        dayOfWeek: Number(dto.dayOfWeek),
        startTime: String(dto.startTime).trim(),
        endTime: String(dto.endTime).trim(),
        effectiveFrom: normalizeDateInput(dto.effectiveFrom) || undefined,
        effectiveTo: normalizeDateInput(dto.effectiveTo) || undefined,
        minCapacity: Number(dto.minCapacity),
        maxCapacity: Number(dto.maxCapacity),
        plannedSessions: Number(dto.plannedSessions),
        sessionDurationMins: Number(dto.sessionDurationMins),
        pricePerStudent: Number(dto.pricePerStudent),
        minMarginPct: Number(dto.minMarginPct ?? 0),
        currency: String(dto.currency || 'EGP').toUpperCase(),
        createdById: userId,
      },
      include: { courseLevel: { include: { course: true } }, instructor: { include: { user: true } }, room: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'create',
        entityType: 'TeachingSlot',
        entityId: created.id,
        changes: JSON.stringify(dto),
      },
    });

    return created;
  }

  async update(id: string, dto: UpdateTeachingSlotDto, userId: string) {
    const existing = await this.prisma.teachingSlot.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Teaching slot not found');
    if (existing.status === TeachingSlotStatus.occupied) {
      throw new BadRequestException('Cannot edit an occupied teaching slot (slot is locked by a confirmed group)');
    }

    const next: any = {};
    if (dto.courseLevelId !== undefined) next.courseLevelId = dto.courseLevelId;
    if (dto.instructorId !== undefined) next.instructorId = dto.instructorId;
    if (dto.roomId !== undefined) next.roomId = dto.roomId;
    if (dto.dayOfWeek !== undefined) next.dayOfWeek = Number(dto.dayOfWeek);
    if (dto.startTime !== undefined) next.startTime = String(dto.startTime).trim();
    if (dto.endTime !== undefined) next.endTime = String(dto.endTime).trim();
    if (dto.effectiveFrom !== undefined) next.effectiveFrom = normalizeDateInput(dto.effectiveFrom);
    if (dto.effectiveTo !== undefined) next.effectiveTo = normalizeDateInput(dto.effectiveTo);
    if (dto.minCapacity !== undefined) next.minCapacity = Number(dto.minCapacity);
    if (dto.maxCapacity !== undefined) next.maxCapacity = Number(dto.maxCapacity);
    if (dto.plannedSessions !== undefined) next.plannedSessions = Number(dto.plannedSessions);
    if (dto.sessionDurationMins !== undefined) next.sessionDurationMins = Number(dto.sessionDurationMins);
    if (dto.pricePerStudent !== undefined) next.pricePerStudent = Number(dto.pricePerStudent);
    if (dto.minMarginPct !== undefined) next.minMarginPct = Number(dto.minMarginPct);
    if (dto.currency !== undefined) next.currency = String(dto.currency || 'EGP').toUpperCase();

    const merged = { ...existing, ...next } as any;
    if (!isHHmm(merged.startTime) || !isHHmm(merged.endTime)) throw new BadRequestException('Invalid time format');
    if (timeToMinutes(merged.startTime) >= timeToMinutes(merged.endTime)) throw new BadRequestException('Invalid time range');
    if (Number(merged.minCapacity) > Number(merged.maxCapacity)) throw new BadRequestException('minCapacity cannot exceed maxCapacity');

    await this.assertNoOverlap({
      excludeId: id,
      instructorId: merged.instructorId,
      roomId: merged.roomId,
      dayOfWeek: merged.dayOfWeek,
      startTime: merged.startTime,
      endTime: merged.endTime,
    });

    const updated = await this.prisma.teachingSlot.update({
      where: { id },
      data: next,
      include: { courseLevel: { include: { course: true } }, instructor: { include: { user: true } }, room: true, currentClass: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'update',
        entityType: 'TeachingSlot',
        entityId: id,
        changes: JSON.stringify(dto),
      },
    });

    return updated;
  }

  async remove(id: string, reason: string, userId: string) {
    const existing = await this.prisma.teachingSlot.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Teaching slot not found');
    if (existing.status === TeachingSlotStatus.occupied) throw new BadRequestException('Cannot delete an occupied teaching slot');
    if (!String(reason || '').trim()) throw new BadRequestException('Reason is required');

    await this.prisma.teachingSlot.update({
      where: { id },
      data: { deletedAt: new Date(), status: TeachingSlotStatus.inactive },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'delete',
        entityType: 'TeachingSlot',
        entityId: id,
        changes: JSON.stringify({ reason }),
      },
    });

    return { ok: true };
  }
}


