import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.group.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        courseLevel: { include: { course: true } },
        defaultClass: {
          include: {
            instructor: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
          },
        },
      },
    });
  }

  async create(data: { name: string; courseLevelId: string; defaultClassId?: string | null }) {
    const name = String(data.name || '').trim();
    if (!name) throw new BadRequestException('Group name is required');

    const level = await this.prisma.courseLevel.findFirst({ where: { id: data.courseLevelId, deletedAt: null } });
    if (!level) throw new BadRequestException('Invalid course level');

    return this.prisma.group.create({
      data: {
        name,
        courseLevelId: data.courseLevelId,
        defaultClassId: data.defaultClassId || undefined,
      },
      include: {
        courseLevel: { include: { course: true } },
        defaultClass: {
          include: {
            instructor: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
          },
        },
      },
    });
  }

  async update(id: string, data: Partial<{ name: string; courseLevelId: string; defaultClassId?: string | null }>) {
    const existing = await this.prisma.group.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Group not found');

    const next: any = {};
    if (data.name !== undefined) {
      const name = String(data.name || '').trim();
      if (!name) throw new BadRequestException('Group name is required');
      next.name = name;
    }
    if (data.courseLevelId !== undefined) next.courseLevelId = data.courseLevelId;
    if (data.defaultClassId !== undefined) next.defaultClassId = data.defaultClassId || null;

    return this.prisma.group.update({
      where: { id },
      data: next,
      include: {
        courseLevel: { include: { course: true } },
        defaultClass: {
          include: {
            instructor: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
          },
        },
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.group.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Group not found');

    // Soft delete group and detach enrollments
    await this.prisma.$transaction(async (tx) => {
      await tx.studentEnrollment.updateMany({
        where: { groupId: id },
        data: { groupId: null },
      });
      await tx.group.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    });

    return { ok: true };
  }
}


