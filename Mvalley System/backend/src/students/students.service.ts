import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { CreateStudentDto, UpdateStudentDto } from './dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateStudentDto, createdBy: string) {
    const student = await this.prisma.student.create({
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
        parent: true,
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

  async update(id: string, data: UpdateStudentDto, updatedBy: string) {
    const student = await this.prisma.student.update({
      where: { id },
      data,
      include: {
        class: true,
        parent: true,
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

