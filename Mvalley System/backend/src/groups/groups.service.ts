import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  private toGroupPrefix(courseName: string) {
    const words = String(courseName || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    const w = words[0] || 'G';
    return w.slice(0, 2).toUpperCase();
  }

  private async generateGroupCode(courseLevelId: string) {
    const level = await this.prisma.courseLevel.findFirst({
      where: { id: courseLevelId, deletedAt: null },
      include: { course: true },
    });
    if (!level) throw new BadRequestException('Invalid course level');

    const prefix = this.toGroupPrefix(level.course?.name || '');
    const levelDigit = Number(level.sortOrder || 1);

    const existing = await this.prisma.group.findMany({
      where: { courseLevelId, deletedAt: null },
      select: { name: true },
    });

    const re = new RegExp(`^${prefix}-(\\d{2})-${levelDigit}$`);
    let max = 0;
    for (const g of existing) {
      const m = re.exec(String(g.name || '').trim());
      if (!m) continue;
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n)) max = Math.max(max, n);
    }

    const next = String(max + 1).padStart(2, '0');
    return `${prefix}-${next}-${levelDigit}`;
  }

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
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async create(data: { name?: string; courseLevelId: string; defaultClassId?: string | null; createdById?: string }) {
    if (!data.courseLevelId) throw new BadRequestException('Course level is required');
    const name = String(data.name || '').trim() || (await this.generateGroupCode(data.courseLevelId));

    return this.prisma.group.create({
      data: {
        name,
        courseLevelId: data.courseLevelId,
        defaultClassId: data.defaultClassId || undefined,
        createdById: data.createdById || undefined,
      },
      include: {
        courseLevel: { include: { course: true } },
        defaultClass: {
          include: {
            instructor: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
          },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
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
    if (data.courseLevelId !== undefined) {
      next.courseLevelId = data.courseLevelId;
      // If caller didn't explicitly set name, regenerate code for the new level
      if (data.name === undefined) next.name = await this.generateGroupCode(data.courseLevelId);
    }
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
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
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


