import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { CreateStudentDto, UpdateStudentDto, UpdateEnrollmentDto } from './dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async getUnallocatedPaidInsight() {
    const count = await this.prisma.students.count({
      where: {
        deletedAt: null,
        classId: null,
        payments: {
          some: { status: 'received' },
        },
      },
    });

    // Sum payments for unallocated students (best-effort with current schema naming)
    const sum = await this.prisma.payments.aggregate({
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
    const sample = await this.prisma.students.findMany({
      where: {
        deletedAt: null,
        classId: null,
        payments: { some: { status: 'received' } },
      },
      include: {
        parents: true,
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
    const student = await this.prisma.students.create({
      data: {
        ...data,
        learningTrack: (data as any).learningTrack || 'general',
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
        parents: true,
        enrollments: {
          include: {
            course_levels: { include: { courses: true } },
            classes: true,
          },
        },
      },
    });

    // Log audit
    await this.prisma.audit_logs.create({
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
      const instructor = await this.prisma.instructors.findUnique({
        where: { userId },
        include: {
          classes: {
            include: {
              students: {
                where: { deletedAt: null },
                include: {
                  parents: true,
                  classes: true,
                  enrollments: {
                    include: {
                      course_levels: { include: { courses: true } },
                      classes: true,
                    },
                  },
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
    return this.prisma.students.findMany({
      where: { deletedAt: null },
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
        parents: true,
        enrollments: {
          include: {
            course_levels: { include: { courses: true } },
            classes: true,
          },
        },
      },
    });
  }

  async findOne(id: string, userRole: UserRole, userId?: string) {
    const student = await this.prisma.students.findFirst({
      where: { id, deletedAt: null },
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
        parents: true,
        enrollments: {
          include: {
            course_levels: { include: { courses: true } },
            classes: true,
          },
        },
        payments: userRole !== 'instructor', // Hide payments from instructors
        session_attendances: {
          include: {
            session: {
              include: {
                classes: true,
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
      const instructor = await this.prisma.instructors.findUnique({
        where: { userId },
      });

      if (!instructor || student.class?.instructorId !== instructor.id) {
        throw new ForbiddenException('Access denied');
      }
    }

    return student;
  }

  async listEnrollments(studentId: string, userRole: UserRole, userId?: string) {
    // Basic access check for instructors: only if the student is in any of their classes OR any enrollment class is theirs
    if (userRole === 'instructor') {
      const instructor = await this.prisma.instructors.findUnique({ where: { userId } });
      if (!instructor) return [];

      const student = await this.prisma.students.findFirst({
        where: { id: studentId, deletedAt: null },
        select: { classes: { select: { instructorId: true } } },
      });
      const baseOk = student?.class?.instructorId === instructor.id;

      const enrollmentOk = await this.prisma.studentsEnrollment.findFirst({
        where: {
          studentId,
          classes: { instructorId: instructor.id },
        },
        select: { id: true },
      });

      if (!baseOk && !enrollmentOk) {
        throw new ForbiddenException('Access denied');
      }
    }

    return this.prisma.studentsEnrollment.findMany({
      where: { studentId },
      include: {
        course_levels: { include: { courses: true } },
        classes: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listSessions(studentId: string, userRole: UserRole, userId?: string) {
    // Get sessions where the student has attendances OR where the student is enrolled in the class
    const enrollments = await this.prisma.studentsEnrollment.findMany({
      where: { studentId },
      select: { classId: true },
    });
    const classIds = enrollments.map((e) => e.classId).filter(Boolean) as string[];

    // Also check legacy direct class assignment
    const student = await this.prisma.students.findFirst({
      where: { id: studentId, deletedAt: null },
      select: { classId: true },
    });
    if (student?.classId && !classIds.includes(student.classId)) {
      classIds.push(student.classId);
    }

    if (classIds.length === 0) {
      return [];
    }

    return this.prisma.sessions.findMany({
      where: {
        classId: { in: classIds },
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
          where: { studentId },
          include: {
            students: {
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
    const student = await this.prisma.students.findFirst({ where: { id: studentId, deletedAt: null } });
    if (!student) throw new NotFoundException('Student not found');

    const level = await this.prisma.courses_levels.findFirst({ where: { id: courseLevelId, deletedAt: null } });
    if (!level) throw new NotFoundException('Course level not found');

    // Check if student is already enrolled in this course level
    const existing = await this.prisma.studentsEnrollment.findFirst({
      where: {
        studentId,
        courseLevelId,
        deletedAt: null,
      },
      include: {
        course_levels: { include: { courses: true } },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Student is already enrolled in ${existing.courseLevel.course.name} - ${existing.courseLevel.name}`,
      );
    }

    const created = await this.prisma.studentsEnrollment.create({
      data: {
        studentId,
        courseLevelId,
        classId: classId || undefined,
      },
      include: {
        course_levels: { include: { courses: true } },
        classes: true,
      },
    });

    await this.prisma.audit_logs.create({
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
    const existing = await this.prisma.studentsEnrollment.findFirst({ where: { id: enrollmentId } });
    if (!existing) throw new NotFoundException('Enrollment not found');

    const updated = await this.prisma.studentsEnrollment.update({
      where: { id: enrollmentId },
      data: {
        ...(dto.classId !== undefined ? { classId: dto.classId as any } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      include: {
        course_levels: { include: { courses: true } },
        classes: true,
      },
    });

    await this.prisma.audit_logs.create({
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
    const existing = await this.prisma.studentsEnrollment.findFirst({ where: { id: enrollmentId } });
    if (!existing) throw new NotFoundException('Enrollment not found');

    await this.prisma.studentsEnrollment.delete({ where: { id: enrollmentId } });
    await this.prisma.audit_logs.create({
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
    const student = await this.prisma.students.update({
      where: { id },
      data,
      include: {
        classes: true,
        parents: true,
        enrollments: {
          include: {
            course_levels: { include: { courses: true } },
            classes: true,
          },
        },
      },
    });

    // Log audit
    await this.prisma.audit_logs.create({
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
    const student = await this.prisma.students.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Log audit
    await this.prisma.audit_logs.create({
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

