import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ParentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { firstName: string; lastName: string; phone: string; email?: string; address?: string }) {
    return this.prisma.parents.create({ data });
  }

  async findAll() {
    return this.prisma.parents.findMany({
      where: { deletedAt: null },
      include: { students: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const parent = await this.prisma.parents.findFirst({
      where: { id, deletedAt: null },
      include: { students: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } } },
    });
    if (!parent) throw new NotFoundException('Contact not found');
    return parent;
  }

  async update(id: string, data: Partial<{ firstName: string; lastName: string; phone: string; email?: string; address?: string }>) {
    return this.prisma.parents.update({ where: { id }, data });
  }

  async lookupByPhone(phone: string) {
    const p = String(phone || '').trim();
    if (!p) return { found: false };

    const parent = await this.prisma.parents.findFirst({
      where: { phone: p, deletedAt: null },
      include: { students: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });

    if (!parent) return { found: false };
    return { found: true, parent };
  }
}


