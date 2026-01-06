import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomAvailabilityDto, CreateRoomDto, UpdateRoomAvailabilityDto, UpdateRoomDto } from './dto';

function normalizeDateInput(value?: string | null) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const v = String(value).trim();
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(v);
  const d = isDateOnly ? new Date(`${v}T00:00:00.000Z`) : new Date(v);
  if (Number.isNaN(d.getTime())) throw new BadRequestException(`Invalid date: ${value}`);
  return d;
}

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.room.findMany({
      where: { deletedAt: null },
      orderBy: [{ location: 'asc' }, { name: 'asc' }],
      include: { availabilities: { where: { deletedAt: null }, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] } },
    });
  }

  async create(dto: CreateRoomDto, userId: string) {
    const name = String(dto.name || '').trim();
    if (!name) throw new BadRequestException('Room name is required');
    const room = await this.prisma.room.create({
      data: {
        name,
        location: dto.location,
        capacity: Number(dto.capacity),
        isActive: dto.isActive ?? true,
      },
      include: { availabilities: true },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: 'create', entityType: 'Room', entityId: room.id },
    });
    return room;
  }

  async update(id: string, dto: UpdateRoomDto, userId: string) {
    const existing = await this.prisma.room.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Room not found');

    const next: any = {};
    if (dto.name !== undefined) {
      const name = String(dto.name || '').trim();
      if (!name) throw new BadRequestException('Room name is required');
      next.name = name;
    }
    if (dto.location !== undefined) next.location = dto.location;
    if (dto.capacity !== undefined) next.capacity = Number(dto.capacity);
    if (dto.isActive !== undefined) next.isActive = dto.isActive;

    const room = await this.prisma.room.update({
      where: { id },
      data: next,
      include: { availabilities: { where: { deletedAt: null } } },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: 'update', entityType: 'Room', entityId: id, changes: JSON.stringify(dto) },
    });
    return room;
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.room.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Room not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.roomAvailability.updateMany({ where: { roomId: id }, data: { deletedAt: new Date() } });
      await tx.room.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    });

    await this.prisma.auditLog.create({
      data: { userId, action: 'delete', entityType: 'Room', entityId: id },
    });
    return { ok: true };
  }

  async addAvailability(roomId: string, dto: CreateRoomAvailabilityDto, userId: string) {
    const room = await this.prisma.room.findFirst({ where: { id: roomId, deletedAt: null } });
    if (!room) throw new NotFoundException('Room not found');

    const av = await this.prisma.roomAvailability.create({
      data: {
        roomId,
        dayOfWeek: Number(dto.dayOfWeek),
        startTime: String(dto.startTime || '').trim(),
        endTime: String(dto.endTime || '').trim(),
        effectiveFrom: normalizeDateInput(dto.effectiveFrom) || undefined,
        effectiveTo: normalizeDateInput(dto.effectiveTo) || undefined,
      },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: 'create', entityType: 'RoomAvailability', entityId: av.id, changes: JSON.stringify(dto) },
    });
    return av;
  }

  async updateAvailability(id: string, dto: UpdateRoomAvailabilityDto, userId: string) {
    const existing = await this.prisma.roomAvailability.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Availability not found');

    const next: any = {};
    if (dto.dayOfWeek !== undefined) next.dayOfWeek = Number(dto.dayOfWeek);
    if (dto.startTime !== undefined) next.startTime = String(dto.startTime || '').trim();
    if (dto.endTime !== undefined) next.endTime = String(dto.endTime || '').trim();
    if (dto.effectiveFrom !== undefined) next.effectiveFrom = normalizeDateInput(dto.effectiveFrom);
    if (dto.effectiveTo !== undefined) next.effectiveTo = normalizeDateInput(dto.effectiveTo);

    const av = await this.prisma.roomAvailability.update({ where: { id }, data: next });
    await this.prisma.auditLog.create({
      data: { userId, action: 'update', entityType: 'RoomAvailability', entityId: id, changes: JSON.stringify(dto) },
    });
    return av;
  }

  async deleteAvailability(id: string, userId: string) {
    const existing = await this.prisma.roomAvailability.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Availability not found');
    await this.prisma.roomAvailability.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.prisma.auditLog.create({
      data: { userId, action: 'delete', entityType: 'RoomAvailability', entityId: id },
    });
    return { ok: true };
  }
}


