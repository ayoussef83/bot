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

