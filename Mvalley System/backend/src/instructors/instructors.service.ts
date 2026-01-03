import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstructorDto, UpdateInstructorDto } from './dto';

@Injectable()
export class InstructorsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateInstructorDto, createdBy: string) {
    const instructor = await this.prisma.instructor.create({
      data: {
        ...data,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        classes: {
          include: {
            students: {
              where: { deletedAt: null },
            },
          },
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
        entityType: 'Instructor',
        entityId: instructor.id,
      },
    });

    return instructor;
  }

  async findAll() {
    return this.prisma.instructor.findMany({
      where: { deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        classes: {
          where: { deletedAt: null },
        },
        _count: {
          select: {
            classes: true,
            sessions: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const instructor = await this.prisma.instructor.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        classes: {
          where: { deletedAt: null },
          include: {
            students: {
              where: { deletedAt: null },
            },
          },
        },
        sessions: {
          orderBy: { scheduledDate: 'desc' },
          include: {
            class: true,
            attendances: true,
          },
        },
      },
    });

    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    return instructor;
  }

  async update(id: string, data: UpdateInstructorDto, updatedBy: string) {
    const instructor = await this.prisma.instructor.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        classes: true,
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: updatedBy,
        action: 'update',
        entityType: 'Instructor',
        entityId: id,
        changes: JSON.stringify(data),
      },
    });

    return instructor;
  }

  async remove(id: string, deletedBy: string) {
    const instructor = await this.prisma.instructor.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: deletedBy,
        action: 'delete',
        entityType: 'Instructor',
        entityId: id,
      },
    });

    return instructor;
  }
}

