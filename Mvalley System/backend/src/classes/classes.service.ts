import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto, UpdateClassDto } from './dto';

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

    const classEntity = await this.prisma.class.update({
      where: { id },
      data: {
        ...data,
        ...(courseLevelIdToSet ? { courseLevelId: courseLevelIdToSet } : {}),
        instructorId: data.instructorId?.trim() ? data.instructorId.trim() : undefined,
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

