import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto, UpdateClassDto } from './dto';
import { ClassLifecycleStatus, ProfitabilityStatus, TeachingSlotStatus } from '@prisma/client';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  private normalizeDateInput(value?: string) {
    if (!value) return undefined;
    // Accept both full ISO datetime and HTML date input (YYYY-MM-DD).
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
    const date = isDateOnly ? new Date(`${value}T00:00:00.000Z`) : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid date: ${value}`);
    }
    return date;
  }

  async create(data: CreateClassDto, createdBy: string) {
    const courseName = (data.name || '').trim();
    if (!courseName) throw new BadRequestException('Course name is required');

    const levelNumber = Number((data as any).levelNumber);
    if (!Number.isFinite(levelNumber) || levelNumber < 1) {
      throw new BadRequestException('Level number is required');
    }

    // Allow omitting schedule fields (course definition flow). Provide safe defaults.
    const startDate = this.normalizeDateInput(data.startDate) || new Date();
    const endDate = this.normalizeDateInput(data.endDate);
    const dayOfWeek = (data as any).dayOfWeek ?? 0;
    const startTime = (data as any).startTime || '00:00';
    const endTime = (data as any).endTime || '00:00';

    const minCapacity = Number((data as any).minCapacity);
    const maxCapacity = Number((data as any).maxCapacity);
    if (!Number.isFinite(minCapacity) || !Number.isFinite(maxCapacity) || minCapacity < 1 || maxCapacity < 1) {
      throw new BadRequestException('Minimum and maximum capacity are required');
    }
    if (minCapacity > maxCapacity) {
      throw new BadRequestException('Minimum capacity cannot be greater than maximum capacity');
    }

    // Map (Course name + Level number) -> CourseLevel. Auto-create if missing.
    const course = await this.prisma.course.upsert({
      where: { name: courseName },
      update: { deletedAt: null, isActive: true },
      create: { name: courseName, isActive: true },
    });
    const levelName = `Level ${levelNumber}`;
    const level = await this.prisma.courseLevel.upsert({
      where: { courseId_name: { courseId: course.id, name: levelName } },
      update: { deletedAt: null, isActive: true },
      create: { courseId: course.id, name: levelName, sortOrder: levelNumber, isActive: true },
    });

    const classEntity = await this.prisma.class.create({
      data: {
        ...data,
        capacity: maxCapacity,
        minCapacity,
        maxCapacity,
        courseLevelId: level.id,
        levelNumber,
        dayOfWeek,
        startTime,
        endTime,
        locationName: (data as any).locationName || String((data as any).location || ''),
        instructorId: data.instructorId?.trim() ? data.instructorId.trim() : undefined,
        startDate,
        endDate,
      },
      include: {
        instructor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        students: {
          where: { deletedAt: null },
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
        entityType: 'Class',
        entityId: classEntity.id,
      },
    });

    return classEntity;
  }

  // TeachingSlot-driven flow: Sales creates a Class inside an existing TeachingSlot.
  async createFromTeachingSlot(dto: { teachingSlotId: string; name?: string }, createdBy: string) {
    const slot = await this.prisma.teachingSlot.findFirst({
      where: { id: dto.teachingSlotId, deletedAt: null },
      include: {
        courseLevel: { include: { course: true } },
        room: true,
        instructor: true,
      },
    });
    if (!slot) throw new NotFoundException('Teaching slot not found');
    if (slot.status === TeachingSlotStatus.occupied) throw new BadRequestException('Teaching slot is occupied');
    if (slot.status === TeachingSlotStatus.inactive) throw new BadRequestException('Teaching slot is inactive');

    // Only one filling/draft group per slot at a time
    if (slot.currentClassId) {
      const current = await this.prisma.class.findFirst({ where: { id: slot.currentClassId, deletedAt: null } });
      if (current && current.lifecycleStatus !== ClassLifecycleStatus.completed) {
        throw new BadRequestException('Teaching slot already has an active group');
      }
    }

    const name = String(dto.name || '').trim() || `${slot.courseLevel.course.name} (Slot)`;

    const classEntity = await this.prisma.class.create({
      data: {
        name,
        location: slot.room.location,
        locationName: slot.room.name,
        roomId: slot.roomId,
        teachingSlotId: slot.id,
        lifecycleStatus: ClassLifecycleStatus.filling,
        profitabilityStatus: ProfitabilityStatus.red,
        marginThresholdPct: slot.minMarginPct,
        capacity: slot.maxCapacity,
        minCapacity: slot.minCapacity,
        maxCapacity: slot.maxCapacity,
        code: undefined,
        courseLevelId: slot.courseLevelId,
        levelNumber: slot.courseLevel.sortOrder,
        plannedSessions: slot.plannedSessions,
        price: slot.pricePerStudent,
        instructorId: slot.instructorId,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        startDate: slot.effectiveFrom || new Date(),
        endDate: slot.effectiveTo,
      } as any,
      include: {
        courseLevel: { include: { course: true } },
        instructor: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        room: true,
        students: { where: { deletedAt: null } },
      },
    });

    // Reserve slot
    await this.prisma.teachingSlot.update({
      where: { id: slot.id },
      data: { status: TeachingSlotStatus.reserved, currentClassId: classEntity.id },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: createdBy,
        action: 'create',
        entityType: 'Class',
        entityId: classEntity.id,
        changes: JSON.stringify({ createFromTeachingSlot: true, teachingSlotId: slot.id }),
      },
    });

    return classEntity;
  }

  async findAll() {
    return this.prisma.class.findMany({
      where: { deletedAt: null },
      include: {
        courseLevel: {
          include: {
            course: true,
          },
        },
        instructor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        students: {
          where: { deletedAt: null },
        },
        _count: {
          select: {
            sessions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const classEntity = await this.prisma.class.findFirst({
      where: { id, deletedAt: null },
      include: {
        courseLevel: {
          include: {
            course: true,
          },
        },
        instructor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        students: {
          where: { deletedAt: null },
          include: {
            parent: true,
          },
        },
        sessions: {
          orderBy: { scheduledDate: 'desc' },
          include: {
            attendances: {
              include: {
                student: true,
              },
            },
          },
        },
      },
    });

    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    return classEntity;
  }

  async update(id: string, data: UpdateClassDto, updatedBy: string) {
    const startDate = this.normalizeDateInput(data.startDate);
    const endDate = this.normalizeDateInput(data.endDate);

    const nextName = typeof (data as any).name === 'string' ? (data as any).name.trim() : undefined;
    const nextLevelNumber =
      (data as any).levelNumber !== undefined ? Number((data as any).levelNumber) : undefined;
    if (nextLevelNumber !== undefined && (!Number.isFinite(nextLevelNumber) || nextLevelNumber < 1)) {
      throw new BadRequestException('Invalid level number');
    }

    const nextMinCapacity = (data as any).minCapacity !== undefined ? Number((data as any).minCapacity) : undefined;
    const nextMaxCapacity = (data as any).maxCapacity !== undefined ? Number((data as any).maxCapacity) : undefined;
    if (nextMinCapacity !== undefined && (!Number.isFinite(nextMinCapacity) || nextMinCapacity < 1)) {
      throw new BadRequestException('Invalid minimum capacity');
    }
    if (nextMaxCapacity !== undefined && (!Number.isFinite(nextMaxCapacity) || nextMaxCapacity < 1)) {
      throw new BadRequestException('Invalid maximum capacity');
    }
    if (nextMinCapacity !== undefined && nextMaxCapacity !== undefined && nextMinCapacity > nextMaxCapacity) {
      throw new BadRequestException('Minimum capacity cannot be greater than maximum capacity');
    }

    // If name or levelNumber changes, remap to CourseLevel (auto-create).
    let courseLevelIdToSet: string | undefined = undefined;
    if (nextName !== undefined || nextLevelNumber !== undefined) {
      const existing = await this.prisma.class.findFirst({
        where: { id, deletedAt: null },
        select: { name: true, levelNumber: true },
      });
      if (!existing) throw new NotFoundException('Class not found');
      const courseName = (nextName ?? existing.name).trim();
      const levelNumber = Number(nextLevelNumber ?? existing.levelNumber ?? 1);
      const course = await this.prisma.course.upsert({
        where: { name: courseName },
        update: { deletedAt: null, isActive: true },
        create: { name: courseName, isActive: true },
      });
      const levelName = `Level ${levelNumber}`;
      const level = await this.prisma.courseLevel.upsert({
        where: { courseId_name: { courseId: course.id, name: levelName } },
        update: { deletedAt: null, isActive: true },
        create: { courseId: course.id, name: levelName, sortOrder: levelNumber, isActive: true },
      });
      courseLevelIdToSet = level.id;
      (data as any).levelNumber = levelNumber;
    }

    const existing = await this.prisma.class.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        teachingSlotId: true,
        lifecycleStatus: true,
      },
    });
    if (!existing) throw new NotFoundException('Class not found');

    // Slot-driven: instructor/room/time edits must go through TeachingSlot, not Class.
    if (existing.teachingSlotId) {
      const forbidden: string[] = [];
      const dAny: any = data as any;
      if (dAny.instructorId !== undefined) forbidden.push('instructorId');
      if (dAny.roomId !== undefined) forbidden.push('roomId');
      if (dAny.dayOfWeek !== undefined) forbidden.push('dayOfWeek');
      if (dAny.startTime !== undefined) forbidden.push('startTime');
      if (dAny.endTime !== undefined) forbidden.push('endTime');
      if (dAny.location !== undefined) forbidden.push('location');
      if (dAny.locationName !== undefined) forbidden.push('locationName');
      if (dAny.startDate !== undefined || dAny.endDate !== undefined) forbidden.push('dateWindow');
      if (forbidden.length) {
        throw new BadRequestException(`This group is slot-driven. Edit TeachingSlot instead (${forbidden.join(', ')})`);
      }

      // Once confirmed/active/completed, further edits should be restricted to safe fields only.
      if (
        existing.lifecycleStatus === ClassLifecycleStatus.confirmed ||
        existing.lifecycleStatus === ClassLifecycleStatus.active ||
        existing.lifecycleStatus === ClassLifecycleStatus.completed
      ) {
        // Allow only description/customData in legacy; keep strict for now.
      }
    }

    // Prevent setting `instructorId: undefined` when slot-driven
    const nextInstructorId =
      existing.teachingSlotId ? undefined : (data.instructorId?.trim() ? data.instructorId.trim() : undefined);

    const classEntity = await this.prisma.class.update({
      where: { id },
      data: {
        ...data,
        ...(data.maxCapacity !== undefined
          ? {
              capacity: Number(data.maxCapacity),
              maxCapacity: Number(data.maxCapacity),
              ...(data.minCapacity !== undefined ? { minCapacity: Number(data.minCapacity) } : {}),
            }
          : data.minCapacity !== undefined
            ? { minCapacity: Number(data.minCapacity) }
            : {}),
        ...(courseLevelIdToSet ? { courseLevelId: courseLevelIdToSet } : {}),
        ...(existing.teachingSlotId ? {} : { instructorId: nextInstructorId }),
        startDate,
        endDate,
      },
      include: {
        courseLevel: {
          include: { course: true },
        },
        instructor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        students: {
          where: { deletedAt: null },
        },
      },
    });

    // Recalculate metrics
    await this.recalculateMetrics(id);
    // Recalculate profitability (live guardrail)
    await this.recalculateProfitability(id);

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: updatedBy,
        action: 'update',
        entityType: 'Class',
        entityId: id,
        changes: JSON.stringify(data),
      },
    });

    return classEntity;
  }

  async recalculateProfitability(classId: string) {
    const classEntity = await this.prisma.class.findFirst({
      where: { id: classId, deletedAt: null },
      include: {
        teachingSlot: true,
        instructor: { include: { costModels: true, availability: true, user: { select: { status: true } } } },
        enrollments: { where: { status: 'active' } },
      },
    });
    if (!classEntity) return;

    const studentCount = classEntity.enrollments.length;
    const price = Number(classEntity.price ?? classEntity.teachingSlot?.pricePerStudent ?? 0);
    const revenue = Math.max(0, price * studentCount);

    const plannedSessions = Number(classEntity.plannedSessions ?? classEntity.teachingSlot?.plannedSessions ?? 0);
    const sessionDurationMins = Number(classEntity.teachingSlot?.sessionDurationMins ?? 60);
    const totalMinutes = Math.max(0, plannedSessions * sessionDurationMins);

    // Cost estimate (simple, deterministic): use the currently effective cost model if present; fallback to legacy.
    const models = (classEntity.instructor?.costModels || []).filter((m: any) => !m.deletedAt);
    const pickModelAt = (d: Date) => {
      const t = d.getTime();
      const candidates = models.filter((m: any) => {
        const start = m.effectiveFrom ? new Date(m.effectiveFrom).getTime() : -Infinity;
        const end = m.effectiveTo ? new Date(m.effectiveTo).getTime() : Infinity;
        return t >= start && t <= end;
      });
      candidates.sort((a: any, b: any) => new Date(b.effectiveFrom || 0).getTime() - new Date(a.effectiveFrom || 0).getTime());
      return candidates[0] || null;
    };
    const refDate = classEntity.startDate || new Date();
    const model = pickModelAt(refDate);
    const type = String(model?.type || classEntity.instructor?.costType || 'hourly').toLowerCase();
    const amount = Number(model?.amount ?? classEntity.instructor?.costAmount ?? 0);
    let cost = 0;
    if (Number.isFinite(amount) && amount > 0) {
      if (type === 'per_session' || type === 'per-session') cost = amount * plannedSessions;
      else if (type === 'hourly') cost = amount * (totalMinutes / 60);
      else if (type === 'monthly') cost = amount; // conservative: full monthly cost
      else cost = amount * (totalMinutes / 60);
    }

    const margin = revenue - cost;
    const threshold = Number(classEntity.marginThresholdPct ?? classEntity.teachingSlot?.minMarginPct ?? 0);
    const marginPct = revenue > 0 ? margin / revenue : -1;
    const minCap = Number(classEntity.minCapacity ?? classEntity.teachingSlot?.minCapacity ?? 0);

    let profitabilityStatus: ProfitabilityStatus = ProfitabilityStatus.red;
    if (studentCount < minCap || margin < 0) profitabilityStatus = ProfitabilityStatus.red;
    else if (marginPct < threshold) profitabilityStatus = ProfitabilityStatus.yellow;
    else profitabilityStatus = ProfitabilityStatus.green;

    await this.prisma.class.update({
      where: { id: classId },
      data: {
        expectedRevenue: revenue,
        expectedCost: cost,
        expectedMargin: margin,
        profitabilityStatus,
        marginThresholdPct: threshold,
      },
    });
  }

  async confirmClass(classId: string, reason: string, confirmedBy: string) {
    if (!String(reason || '').trim()) throw new BadRequestException('Reason is required');
    const classEntity = await this.prisma.class.findFirst({
      where: { id: classId, deletedAt: null },
      include: { teachingSlot: true, enrollments: { where: { status: 'active' } } },
    });
    if (!classEntity) throw new NotFoundException('Class not found');
    if (!classEntity.teachingSlotId) throw new BadRequestException('Cannot confirm a group without a TeachingSlot');
    if (classEntity.lifecycleStatus !== ClassLifecycleStatus.filling) throw new BadRequestException('Only filling groups can be confirmed');

    await this.recalculateProfitability(classId);
    const refreshed = await this.prisma.class.findFirst({ where: { id: classId } });
    const minCap = Number(refreshed?.minCapacity ?? classEntity.teachingSlot?.minCapacity ?? 0);
    const studentCount = classEntity.enrollments.length;

    if (studentCount < minCap) throw new BadRequestException('Minimum capacity not met');
    if (refreshed?.profitabilityStatus !== ProfitabilityStatus.green) throw new BadRequestException('Group is not profitable');

    // Occupy slot and lock class
    await this.prisma.$transaction(async (tx) => {
      await tx.class.update({
        where: { id: classId },
        data: {
          lifecycleStatus: ClassLifecycleStatus.confirmed,
          confirmedAt: new Date(),
          confirmedById: confirmedBy,
          confirmReason: reason,
        },
      });
      await tx.teachingSlot.update({
        where: { id: classEntity.teachingSlotId! },
        data: { status: TeachingSlotStatus.occupied, currentClassId: classId },
      });
      await tx.auditLog.create({
        data: {
          userId: confirmedBy,
          action: 'update',
          entityType: 'Class',
          entityId: classId,
          changes: JSON.stringify({ confirm: true, reason }),
        },
      });
    });

    return this.findOne(classId);
  }

  async remove(id: string, deletedBy: string) {
    const classEntity = await this.prisma.class.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: deletedBy,
        action: 'delete',
        entityType: 'Class',
        entityId: id,
      },
    });

    return classEntity;
  }

  async recalculateMetrics(classId: string) {
    const classEntity = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        sessions: {
          include: {
            attendances: {
              where: { attended: true },
            },
          },
        },
      },
    });

    if (!classEntity) return;

    const sessions = classEntity.sessions.filter((s) => s.status === 'completed');
    if (sessions.length === 0) {
      await this.prisma.class.update({
        where: { id: classId },
        data: {
          avgStudentsPerSession: 0,
          utilizationPercentage: 0,
          isUnderfilled: false,
        },
      });
      return;
    }

    const totalAttendances = sessions.reduce(
      (sum, session) => sum + session.attendances.length,
      0,
    );
    const avgStudentsPerSession = totalAttendances / sessions.length;
    const utilizationPercentage = (avgStudentsPerSession / classEntity.capacity) * 100;
    const isUnderfilled = utilizationPercentage < 60; // Flag if less than 60% capacity

    await this.prisma.class.update({
      where: { id: classId },
      data: {
        avgStudentsPerSession,
        utilizationPercentage,
        isUnderfilled,
      },
    });
  }
}

