import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChannelAccountDto, UpdateChannelAccountDto } from './dto';

@Injectable()
export class ChannelAccountsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateChannelAccountDto) {
    return this.prisma.channelAccount.create({
      data: {
        ...data,
        status: data.status || 'connected',
      },
      include: {
        _count: {
          select: {
            conversations: true,
            campaigns: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.channelAccount.findMany({
      include: {
        _count: {
          select: {
            conversations: true,
            campaigns: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const account = await this.prisma.channelAccount.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            conversations: true,
            campaigns: true,
          },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Channel account not found');
    }

    return account;
  }

  async update(id: string, data: UpdateChannelAccountDto) {
    const account = await this.prisma.channelAccount.update({
      where: { id },
      data: {
        ...data,
        ...(data.status && { lastSyncAt: new Date() }),
      },
      include: {
        _count: {
          select: {
            conversations: true,
            campaigns: true,
          },
        },
      },
    });

    return account;
  }

  async remove(id: string) {
    await this.prisma.channelAccount.delete({
      where: { id },
    });

    return { message: 'Channel account deleted successfully' };
  }
}

