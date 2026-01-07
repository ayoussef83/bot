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

    // Accept legacy 2-digit codes, but generate new ones as 3-digit
    const re = new RegExp(`^${prefix}-(\\d{2,3})-${levelDigit}$`);
    let max = 0;
    for (const g of existing) {
      const m = re.exec(String(g.name || '').trim());
      if (!m) continue;
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n)) max = Math.max(max, n);
    }

    const next = String(max + 1).padStart(3, '0');
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

  async create(data: {
    name?: string;
    courseLevelId: string;
    defaultClassId?: string | null;
    createdById?: string;
    location?: any;
    minCapacity?: number | null;
    maxCapacity?: number | null;
    ageMin?: number | null;
    ageMax?: number | null;
  }) {
    if (!data.courseLevelId) throw new BadRequestException('Course level is required');
    const name = String(data.name || '').trim() || (await this.generateGroupCode(data.courseLevelId));
    const minCap = data.minCapacity !== undefined && data.minCapacity !== null ? Number(data.minCapacity) : undefined;
    const maxCap = data.maxCapacity !== undefined && data.maxCapacity !== null ? Number(data.maxCapacity) : undefined;
    if (minCap !== undefined && (!Number.isFinite(minCap) || minCap < 1)) throw new BadRequestException('Invalid minimum capacity');
    if (maxCap !== undefined && (!Number.isFinite(maxCap) || maxCap < 1)) throw new BadRequestException('Invalid maximum capacity');
    if (minCap !== undefined && maxCap !== undefined && minCap > maxCap) throw new BadRequestException('Minimum capacity cannot exceed maximum capacity');
    const ageMin = data.ageMin !== undefined && data.ageMin !== null ? Number(data.ageMin) : undefined;
    const ageMax = data.ageMax !== undefined && data.ageMax !== null ? Number(data.ageMax) : undefined;
    if (ageMin !== undefined && (!Number.isFinite(ageMin) || ageMin < 0)) throw new BadRequestException('Invalid age min');
    if (ageMax !== undefined && (!Number.isFinite(ageMax) || ageMax < 0)) throw new BadRequestException('Invalid age max');
    if (ageMin !== undefined && ageMax !== undefined && ageMin > ageMax) throw new BadRequestException('Age min cannot exceed age max');

    return this.prisma.group.create({
      data: {
        name,
        courseLevelId: data.courseLevelId,
        defaultClassId: data.defaultClassId || undefined,
        createdById: data.createdById || undefined,
        location: (data as any).location || undefined,
        minCapacity: minCap,
        maxCapacity: maxCap,
        ageMin,
        ageMax,
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
    if ((data as any).location !== undefined) next.location = (data as any).location || null;
    if ((data as any).minCapacity !== undefined) next.minCapacity = (data as any).minCapacity === null ? null : Number((data as any).minCapacity);
    if ((data as any).maxCapacity !== undefined) next.maxCapacity = (data as any).maxCapacity === null ? null : Number((data as any).maxCapacity);
    if ((data as any).ageMin !== undefined) next.ageMin = (data as any).ageMin === null ? null : Number((data as any).ageMin);
    if ((data as any).ageMax !== undefined) next.ageMax = (data as any).ageMax === null ? null : Number((data as any).ageMax);

    if (next.minCapacity !== undefined && next.minCapacity !== null && (!Number.isFinite(next.minCapacity) || next.minCapacity < 1)) {
      throw new BadRequestException('Invalid minimum capacity');
    }
    if (next.maxCapacity !== undefined && next.maxCapacity !== null && (!Number.isFinite(next.maxCapacity) || next.maxCapacity < 1)) {
      throw new BadRequestException('Invalid maximum capacity');
    }
    if (
      next.minCapacity !== undefined &&
      next.maxCapacity !== undefined &&
      next.minCapacity !== null &&
      next.maxCapacity !== null &&
      next.minCapacity > next.maxCapacity
    ) {
      throw new BadRequestException('Minimum capacity cannot exceed maximum capacity');
    }
    if (next.ageMin !== undefined && next.ageMin !== null && (!Number.isFinite(next.ageMin) || next.ageMin < 0)) {
      throw new BadRequestException('Invalid age min');
    }
    if (next.ageMax !== undefined && next.ageMax !== null && (!Number.isFinite(next.ageMax) || next.ageMax < 0)) {
      throw new BadRequestException('Invalid age max');
    }
    if (
      next.ageMin !== undefined &&
      next.ageMax !== undefined &&
      next.ageMin !== null &&
      next.ageMax !== null &&
      next.ageMin > next.ageMax
    ) {
      throw new BadRequestException('Age min cannot exceed age max');
    }

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


