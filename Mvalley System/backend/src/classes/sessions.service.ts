import { BadRequestException, Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto, UpdateSessionDto } from './dto';
import { ClassesService } from './classes.service';

@Injectable()
export class SessionsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ClassesService))
    private classesService: ClassesService,
  ) {}

  private timeToMinutes(hhmm: string) {
    const m = /^(\d{2}):(\d{2})$/.exec(hhmm || '');
    if (!m) return null;
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    return hh * 60 + mm;
  }

  private cairoDayOfWeek(date: Date) {
    const s = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Cairo', weekday: 'short' }).format(date);
    const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return map[s] ?? date.getUTCDay();
  }

  private cairoHHMM(date: Date) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Cairo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
    return parts; // "HH:mm"
  }

  private async assertInstructorAvailable(instructorId: string, classId: string, start: Date, end: Date) {
    if (!instructorId) return;
    const cls = await this.prisma.class.findFirst({ where: { id: classId, deletedAt: null }, select: { location: true } });
    if (!cls) throw new BadRequestException('Invalid class');

    // Instructor must be active to be scheduled/allocated
    const instructor = await this.prisma.instructor.findFirst({
      where: { id: instructorId, deletedAt: null },
      include: { user: { select: { status: true } } },
    });
    if (!instructor) throw new BadRequestException('Invalid instructor');
    if (instructor.user?.status !== 'active') {
      throw new BadRequestException('Instructor is not active');
    }

    // Blackout check
    const blackout = await this.prisma.instructorBlackoutDate.findFirst({
      where: {
        instructorId,
        deletedAt: null,
        startDate: { lte: end },
        endDate: { gte: start },
      },
    });
    if (blackout) throw new BadRequestException('Instructor is not available (blackout date)');

    const day = this.cairoDayOfWeek(start);
    const sMin = this.timeToMinutes(this.cairoHHMM(start));
    const eMin = this.timeToMinutes(this.cairoHHMM(end));
    if (sMin === null || eMin === null || sMin >= eMin) throw new BadRequestException('Invalid session time');

    const avails = await this.prisma.instructorAvailability.findMany({
      where: {
        instructorId,
        deletedAt: null,
        isActive: true,
        dayOfWeek: day,
        OR: [{ location: null }, { location: cls.location }],
        AND: [
          { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: start } }] },
          { OR: [{ effectiveTo: null }, { effectiveTo: { gte: end } }] },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!avails || avails.length === 0) throw new BadRequestException('Instructor is not available (no availability defined)');

    const ok = avails.some((avail) => {
      const aStart = this.timeToMinutes(avail.startTime) ?? 0;
      const aEnd = this.timeToMinutes(avail.endTime) ?? 0;
      return aStart <= sMin && eMin <= aEnd;
    });
    if (!ok) throw new BadRequestException('Instructor is not available at this time');
  }

  async create(data: CreateSessionDto, createdBy: string) {
    if ((data as any).instructorId) {
      await this.assertInstructorAvailable(
        (data as any).instructorId,
        (data as any).classId,
        new Date((data as any).startTime),
        new Date((data as any).endTime),
      );
    }
    const session = await this.prisma.session.create({
      data: {
        ...data,
      },
      include: {
        class: {
          include: {
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
        attendances: {
          include: {
            student: true,
          },
        },
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: createdBy,
        action: 'create',
        entityType: 'Session',
        entityId: session.id,
      },
    });

    return session;
  }

  async findAll(classId?: string, instructorId?: string) {
    return this.prisma.session.findMany({
      where: {
        ...(classId && { classId }),
        ...(instructorId && { instructorId }),
        deletedAt: null,
      },
      include: {
        class: {
          include: {
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
        attendances: {
          include: {
            student: true,
          },
        },
        _count: {
          select: {
            attendances: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const session = await this.prisma.session.findFirst({
      where: { id, deletedAt: null },
      include: {
        class: {
          include: {
            students: {
              where: { deletedAt: null },
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
        attendances: {
          include: {
            student: {
              include: {
                parent: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  async update(id: string, data: UpdateSessionDto, updatedBy: string) {
    if ((data as any).instructorId || (data as any).startTime || (data as any).endTime) {
      const existing = await this.prisma.session.findFirst({ where: { id, deletedAt: null }, select: { classId: true, instructorId: true, startTime: true, endTime: true } });
      if (!existing) throw new NotFoundException('Session not found');
      const instructorId = (data as any).instructorId ?? existing.instructorId;
      const start = new Date((data as any).startTime ?? existing.startTime);
      const end = new Date((data as any).endTime ?? existing.endTime);
      if (instructorId) await this.assertInstructorAvailable(instructorId, existing.classId, start, end);
    }
    const session = await this.prisma.session.update({
      where: { id },
      data,
      include: {
        class: true,
        instructor: true,
        attendances: true,
      },
    });

    // If status changed to completed, recalculate class metrics
    if (data.status === 'completed' && session.classId) {
      await this.classesService.recalculateMetrics(session.classId);
    }

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: updatedBy,
        action: 'update',
        entityType: 'Session',
        entityId: id,
        changes: JSON.stringify(data),
      },
    });

    return session;
  }

  async remove(id: string, deletedBy: string) {
    const session = await this.prisma.session.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: deletedBy,
        action: 'delete',
        entityType: 'Session',
        entityId: id,
      },
    });

    return session;
  }

  async confirmAttendance(sessionId: string, instructorId: string) {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: {
        instructorConfirmed: true,
        status: 'completed',
      },
    });
  }
}

