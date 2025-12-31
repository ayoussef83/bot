import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttendanceDto, UpdateAttendanceDto } from './dto';
import { SessionsService } from './sessions.service';
import { ClassesService } from './classes.service';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => SessionsService))
    private sessionsService: SessionsService,
    @Inject(forwardRef(() => ClassesService))
    private classesService: ClassesService,
  ) {}

  async create(data: CreateAttendanceDto, createdBy: string) {
    const attendance = await this.prisma.sessionAttendance.create({
      data: {
        ...data,
      },
      include: {
        session: {
          include: {
            class: true,
          },
        },
        student: {
          include: {
            parent: true,
          },
        },
      },
    });

    // Recalculate class metrics if session is completed
    if (attendance.session.status === 'completed') {
      await this.classesService.recalculateMetrics(attendance.session.classId);
    }

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: createdBy,
        action: 'create',
        entityType: 'SessionAttendance',
        entityId: attendance.id,
      },
    });

    return attendance;
  }

  async update(id: string, data: UpdateAttendanceDto, updatedBy: string) {
    const attendance = await this.prisma.sessionAttendance.update({
      where: { id },
      data,
      include: {
        session: {
          include: {
            class: true,
          },
        },
        student: true,
      },
    });

    // Recalculate class metrics if session is completed
    if (attendance.session.status === 'completed') {
      await this.classesService.recalculateMetrics(attendance.session.classId);
    }

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: updatedBy,
        action: 'update',
        entityType: 'SessionAttendance',
        entityId: id,
        changes: JSON.stringify(data),
      },
    });

    return attendance;
  }

  async bulkUpdate(sessionId: string, attendances: Array<{ studentId: string; attended: boolean; notes?: string }>, updatedBy: string) {
    // Delete existing attendances for this session
    await this.prisma.sessionAttendance.deleteMany({
      where: { sessionId },
    });

    // Create new attendances
    const created = await this.prisma.sessionAttendance.createMany({
      data: attendances.map((att) => ({
        sessionId,
        studentId: att.studentId,
        attended: att.attended,
        notes: att.notes,
      })),
    });

    // Update session status and get classId for recalculation
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        instructorConfirmed: true,
      },
    });

    // Recalculate class metrics
    if (session) {
      await this.classesService.recalculateMetrics(session.classId);
    }

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: updatedBy,
        action: 'update',
        entityType: 'Session',
        entityId: sessionId,
        changes: JSON.stringify({ bulkAttendanceUpdate: true }),
      },
    });

    return { count: created.count };
  }

  async findBySession(sessionId: string) {
    return this.prisma.sessionAttendance.findMany({
      where: { sessionId },
      include: {
        student: {
          include: {
            parent: true,
          },
        },
      },
    });
  }
}

