import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateParticipantDto, UpdateParticipantDto } from './dto';

@Injectable()
export class ParticipantsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateParticipantDto) {
    return this.prisma.participants.create({
      data: {
        ...data,
        type: data.type || 'unknown',
      },
      include: {
        _count: {
          select: {
            conversations: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.participants.findMany({
      include: {
        _count: {
          select: {
            conversations: true,
          },
        },
        lead: true,
      },
      orderBy: {
        lastSeenAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const participant = await this.prisma.participants.findUnique({
      where: { id },
      include: {
        conversations: {
          orderBy: { lastMessageAt: 'desc' },
          include: {
            channel_accounts: true,
            campaigns: true,
            _count: {
              select: {
                messages: true,
              },
            },
          },
        },
        lead: true,
      },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    return participant;
  }

  async update(id: string, data: UpdateParticipantDto) {
    return this.prisma.participants.update({
      where: { id },
      data: {
        ...data,
        lastSeenAt: new Date(),
      },
      include: {
        _count: {
          select: {
            conversations: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.prisma.participants.delete({
      where: { id },
    });

    return { message: 'Participant deleted successfully' };
  }
}



