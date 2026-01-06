import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClassLifecycleStatus, UserRole } from '@prisma/client';
import { CreateStudentDto, UpdateStudentDto, UpdateEnrollmentDto } from './dto';
import { ClassesService } from '../classes/classes.service';

function isHHmm(v: string) {
  return /^\d{2}:\d{2}$/.test(String(v || '').trim());
}
function timeToMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
  return h * 60 + m;
}
function overlapsTime(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  const a0 = timeToMinutes(aStart);
  const a1 = timeToMinutes(aEnd);
  const b0 = timeToMinutes(bStart);
  const b1 = timeToMinutes(bEnd);
  return a0 < b1 && b0 < a1;
}

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService, private classesService: ClassesService) {}

  async getUnallocatedPaidInsight() {
    const count = await this.prisma.student.count({
      where: {
        deletedAt: null,
        classId: null,
        payments: {
          some: { status: 'received' },
        },
      },
    });

    // Sum payments for unallocated students (best-effort with current schema naming)
    const sum = await this.prisma.payment.aggregate({
      where: {
        status: 'received',
        studentId: { not: null },
        Student: {
          is: {
            deletedAt: null,
            classId: null,
          },
        },
      } as any,
      _sum: { amount: true },
    });

    // Provide a small sample list for UI drill-in if needed
    const sample = await this.prisma.student.findMany({
      where: {
        deletedAt: null,
        classId: null,
        payments: { some: { status: 'received' } },
      },
      include: {
        parent: true,
        payments: {
          where: { status: 'received' },
          orderBy: { receivedDate: 'desc' },
          take: 1,
        },
      },
      take: 20,
      orderBy: { updatedAt: 'desc' },
    });

    return {
      count,
      totalPaid: sum?._sum?.amount || 0,
      sample,
    };
  }

  async create(data: CreateStudentDto, createdBy: string) {
    const student = await this.prisma.student.create({
      data: {
        ...data,
        learningTrack: (data as any).learningTrack || 'general',
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
        parent: true,
        enrollments: {
          include: {
            courseLevel: { include: { course: true } },
            class: true,
          },
        },
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: createdBy,
        action: 'create',
        entityType: 'Student',
        entityId: student.id,
      },
    });

    return student;
  }

  async findAll(userRole: UserRole, userId?: string) {
    // Instructors only see students in their classes
    if (userRole === 'instructor') {
      const instructor = await this.prisma.instructor.findUnique({
        where: { userId },
        include: {
          classes: {
            include: {
              students: {
                where: { deletedAt: null },
                include: {
                  parent: true,
                  class: true,
                },
              },
            },
          },
        },
      });

      if (!instructor) {
        return [];
      }

      const students = instructor.classes.flatMap((c) => c.students);
      return students;
    }

    // Other roles see all students
    return this.prisma.student.findMany({
      where: { deletedAt: null },
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
        parent: true,
        enrollments: {
          include: {
            courseLevel: { include: { course: true } },
            class: true,
          },
        },
      },
    });
  }

  async findOne(id: string, userRole: UserRole, userId?: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, deletedAt: null },
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
        parent: true,
        enrollments: {
          include: {
            courseLevel: { include: { course: true } },
            class: true,
          },
        },
        payments: userRole !== 'instructor', // Hide payments from instructors
        attendances: {
          include: {
            session: {
              include: {
                class: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Instructors can only see students in their classes
    if (userRole === 'instructor') {
      const instructor = await this.prisma.instructor.findUnique({
        where: { userId },
      });

      if (!instructor || student.class?.instructorId !== instructor.id) {
        throw new ForbiddenException('Access denied');
      }
    }

    return student;
  }

  async listEnrollments(studentId: string, userRole: UserRole, userId?: string) {
    // Basic access check for instructor: only if the student is in any of their classes OR any enrollment class is theirs
    if (userRole === 'instructor') {
      const instructor = await this.prisma.instructor.findUnique({ where: { userId } });
      if (!instructor) return [];

      const student = await this.prisma.student.findFirst({
        where: { id: studentId, deletedAt: null },
        select: { class: { select: { instructorId: true } } },
      });
      const baseOk = student?.class?.instructorId === instructor.id;

      const enrollmentOk = await this.prisma.studentEnrollment.findFirst({
        where: {
          studentId,
          class: { instructorId: instructor.id },
        },
        select: { id: true },
      });

      if (!baseOk && !enrollmentOk) {
        throw new ForbiddenException('Access denied');
      }
    }

    return this.prisma.studentEnrollment.findMany({
      where: { studentId },
      include: {
        courseLevel: { include: { course: true } },
        class: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listSessions(studentId: string, userRole: UserRole, userId?: string) {
    // Get sessions where the student has attendances OR where the student is enrolled in the class
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: { studentId },
      select: { classId: true },
    });
    const classIds = enrollments.map((e) => e.classId).filter(Boolean) as string[];

    // Also check legacy direct class assignment
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
      select: { classId: true },
    });
    if (student?.classId && !classIds.includes(student.classId)) {
      classIds.push(student.classId);
    }

    if (classIds.length === 0) {
      return [];
    }

    return this.prisma.session.findMany({
      where: {
        classId: { in: classIds },
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
          where: { studentId },
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledDate: 'desc',
      },
    });
  }

  async addEnrollment(studentId: string, courseLevelId: string, classId: string | undefined, createdBy: string) {
    const student = await this.prisma.student.findFirst({ where: { id: studentId, deletedAt: null } });
    if (!student) throw new NotFoundException('Student not found');

    const level = await this.prisma.courseLevel.findFirst({ where: { id: courseLevelId, deletedAt: null } });
    if (!level) throw new NotFoundException('Course level not found');

    const created = await this.prisma.studentEnrollment.create({
      data: {
        studentId,
        courseLevelId,
        classId: classId || undefined,
      },
      include: {
        courseLevel: { include: { course: true } },
        class: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: createdBy,
        action: 'create',
        entityType: 'StudentEnrollment',
        entityId: created.id,
        changes: JSON.stringify({ studentId, courseLevelId, classId }),
      },
    });
    return created;
  }

  async updateEnrollment(enrollmentId: string, dto: UpdateEnrollmentDto, updatedBy: string, role: UserRole) {
    const existing = await this.prisma.studentEnrollment.findFirst({ where: { id: enrollmentId } });
    if (!existing) throw new NotFoundException('Enrollment not found');

    const nextClassId = dto.classId !== undefined ? (dto.classId as any) : undefined;
    const prevClassId = existing.classId || null;

    // Slot-driven rules for filling (Sales-driven):
    // - Students can only be assigned to slot-driven groups while the group is in 'filling'
    // - Capacity and schedule compatibility are enforced at assignment time
    // - Profitability is recalculated live (guardrail for confirmation)
    if (nextClassId !== undefined) {
      if (nextClassId) {
        const student = await this.prisma.student.findFirst({
          where: { id: existing.studentId, deletedAt: null },
          select: { id: true, availability: true },
        });
        if (!student) throw new NotFoundException('Student not found');

        const target = await this.prisma.class.findFirst({
          where: { id: String(nextClassId), deletedAt: null },
          include: {
            teachingSlot: true,
            enrollments: { where: { status: 'active' } },
          },
        });
        if (!target) throw new NotFoundException('Class not found');

        // Course eligibility: enrollment course level must match the class course level
        if (target.courseLevelId && String(target.courseLevelId) !== String(existing.courseLevelId)) {
          throw new BadRequestException('Student course level does not match the selected group');
        }

        // If slot-driven, enforce lifecycle rules strictly (only filling accepts students)
        if (target.teachingSlotId) {
          if (target.lifecycleStatus !== ClassLifecycleStatus.filling) {
            // Allow management/super_admin override only with reason (but still discourage)
            const canOverride = role === UserRole.super_admin || role === UserRole.management;
            if (!canOverride || !String(dto.reason || '').trim()) {
              throw new BadRequestException('This group is locked. Only filling groups accept students (override requires reason).');
            }
          }

          // Capacity guardrail
          const maxCap = Number(target.maxCapacity ?? target.capacity ?? 0);
          const currentCount = target.enrollments.length;
          if (maxCap > 0 && currentCount >= maxCap) {
            throw new BadRequestException('Group is full (capacity reached)');
          }

          // Student availability compatibility (if provided)
          const av: any = student.availability;
          const slotOk =
            !av ||
            (Array.isArray(av) &&
              av.some((s: any) => {
                const day = Number(s?.dayOfWeek);
                const from = String(s?.from || '').trim();
                const to = String(s?.to || '').trim();
                if (!Number.isFinite(day) || day < 0 || day > 6) return false;
                if (!isHHmm(from) || !isHHmm(to)) return false;
                if (day !== Number(target.dayOfWeek)) return false;
                // require slot to cover class time
                return timeToMinutes(from) <= timeToMinutes(String(target.startTime)) && timeToMinutes(to) >= timeToMinutes(String(target.endTime));
              }));
          if (!slotOk) throw new BadRequestException('Student is not available in this teaching slot time');

          // Schedule conflicts with other assigned classes (guarded, not automatic)
          const otherEnrollments = await this.prisma.studentEnrollment.findMany({
            where: { studentId: existing.studentId, status: 'active', classId: { not: null }, id: { not: enrollmentId } },
            include: { class: true },
          });
          for (const e of otherEnrollments) {
            const c: any = e.class;
            if (!c || c.deletedAt) continue;
            if (Number(c.dayOfWeek) !== Number(target.dayOfWeek)) continue;
            if (!c.startTime || !c.endTime) continue;
            if (overlapsTime(String(c.startTime), String(c.endTime), String(target.startTime), String(target.endTime))) {
              throw new BadRequestException('Student has a schedule conflict with another group');
            }
          }
        }
      }
    }

    const updated = await this.prisma.studentEnrollment.update({
      where: { id: enrollmentId },
      data: {
        ...(dto.classId !== undefined ? { classId: dto.classId as any } : {}),
        ...(dto.groupId !== undefined ? { groupId: dto.groupId as any } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      include: {
        courseLevel: { include: { course: true } },
        class: true,
        group: true,
      },
    });

    // Live profitability recalculation on add/remove (guardrail for later confirmation)
    const classIdsToRecalc = new Set<string>();
    if (prevClassId) classIdsToRecalc.add(prevClassId);
    if (updated.classId) classIdsToRecalc.add(String(updated.classId));
    for (const cid of classIdsToRecalc) {
      try {
        await this.classesService.recalculateProfitability(cid);
      } catch {
        // best-effort; profitability will also be recalculated on class update/confirm
      }
    }

    await this.prisma.auditLog.create({
      data: {
        userId: updatedBy,
        action: 'update',
        entityType: 'StudentEnrollment',
        entityId: enrollmentId,
        changes: JSON.stringify({ ...dto, role }),
      },
    });
    return updated;
  }

  async removeEnrollment(enrollmentId: string, deletedBy: string) {
    const existing = await this.prisma.studentEnrollment.findFirst({ where: { id: enrollmentId } });
    if (!existing) throw new NotFoundException('Enrollment not found');

    await this.prisma.studentEnrollment.delete({ where: { id: enrollmentId } });
    await this.prisma.auditLog.create({
      data: {
        userId: deletedBy,
        action: 'delete',
        entityType: 'StudentEnrollment',
        entityId: enrollmentId,
      },
    });
    return { ok: true };
  }

  async update(id: string, data: UpdateStudentDto, updatedBy: string) {
    const student = await this.prisma.student.update({
      where: { id },
      data,
      include: {
        class: true,
        parent: true,
        enrollments: {
          include: {
            courseLevel: { include: { course: true } },
            class: true,
          },
        },
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: updatedBy,
        action: 'update',
        entityType: 'Student',
        entityId: id,
        changes: JSON.stringify(data),
      },
    });

    return student;
  }

  async remove(id: string, deletedBy: string) {
    const now = new Date();

    const { student } = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.student.findFirst({
        where: { id, deletedAt: null },
        select: { id: true, parentId: true },
      });
      if (!existing) {
        throw new NotFoundException('Student not found');
      }

      const student = await tx.student.update({
        where: { id },
        data: { deletedAt: now },
      });

      // Log audit (student)
      await tx.auditLog.create({
        data: {
          userId: deletedBy,
          action: 'delete',
          entityType: 'Student',
          entityId: id,
        },
      });

      // If this student was the last active student for the parent, soft-delete the parent too.
      if (existing.parentId) {
        const remaining = await tx.student.count({
          where: { parentId: existing.parentId, deletedAt: null },
        });

        if (remaining === 0) {
          await tx.parent.update({
            where: { id: existing.parentId },
            data: { deletedAt: now },
          });

          // Log audit (parent)
          await tx.auditLog.create({
            data: {
              userId: deletedBy,
              action: 'delete',
              entityType: 'Parent',
              entityId: existing.parentId,
              changes: JSON.stringify({ reason: 'Auto-delete parent (no remaining students)' }),
            },
          });
        }
      }

      return { student };
    });

    return student;
  }
}

