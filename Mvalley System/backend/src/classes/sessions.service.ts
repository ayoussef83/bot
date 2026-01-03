import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
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

  async create(data: CreateSessionDto, createdBy: string) {
    const session = await this.prisma.sessions.create({
      data: {
        ...data,
      },
      include: {
        classes: {
          include: {
            instructors: {
              include: {
                users: {
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
        instructors: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        session_attendances: {
          include: {
            students: true,
          },
        },
      },
    });

    // Log audit
    await this.prisma.audit_logs.create({
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
    return this.prisma.sessions.findMany({
      where: {
        ...(classId && { classId }),
        ...(instructorId && { instructorId }),
        deletedAt: null,
      },
      include: {
        classes: {
          include: {
            instructors: {
              include: {
                users: {
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
        instructors: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        session_attendances: {
          include: {
            students: true,
          },
        },
        _count: {
          select: {
            session_attendances: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const session = await this.prisma.sessions.findFirst({
      where: { id, deletedAt: null },
      include: {
        classes: {
          include: {
            students: {
              where: { deletedAt: null },
            },
            instructors: {
              include: {
                users: {
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
        instructors: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        session_attendances: {
          include: {
            students: {
              include: {
                parents: true,
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
    const session = await this.prisma.sessions.update({
      where: { id },
      data,
      include: {
        classes: true,
        instructors: true,
        session_attendances: true,
      },
    });

    // If status changed to completed, recalculate class metrics
    if (data.status === 'completed' && session.classId) {
      await this.classesService.recalculateMetrics(session.classId);
    }

    // Log audit
    await this.prisma.audit_logs.create({
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
    const session = await this.prisma.sessions.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Log audit
    await this.prisma.audit_logs.create({
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
    return this.prisma.sessions.update({
      where: { id: sessionId },
      data: {
        instructorConfirmed: true,
        status: 'completed',
      },
    });
  }
}

