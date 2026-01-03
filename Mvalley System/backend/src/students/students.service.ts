import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { CreateStudentDto, UpdateStudentDto, UpdateEnrollmentDto } from './dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

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

  async updateEnrollment(enrollmentId: string, dto: UpdateEnrollmentDto, updatedBy: string) {
    const existing = await this.prisma.studentEnrollment.findFirst({ where: { id: enrollmentId } });
    if (!existing) throw new NotFoundException('Enrollment not found');

    const updated = await this.prisma.studentEnrollment.update({
      where: { id: enrollmentId },
      data: {
        ...(dto.classId !== undefined ? { classId: dto.classId as any } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      include: {
        courseLevel: { include: { course: true } },
        class: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: updatedBy,
        action: 'update',
        entityType: 'StudentEnrollment',
        entityId: enrollmentId,
        changes: JSON.stringify(dto),
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
    const student = await this.prisma.student.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: deletedBy,
        action: 'delete',
        entityType: 'Student',
        entityId: id,
      },
    });

    return student;
  }
}

