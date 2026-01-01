import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChannelAccountDto, UpdateChannelAccountDto } from './dto';

@Injectable()
export class ChannelAccountsService {
  constructor(private prisma: PrismaService) {}

  private sanitize(account: any) {
    if (!account) return account;
    // Never return tokens to the client
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accessToken, refreshToken, ...rest } = account;
    return rest;
  }

  async create(data: CreateChannelAccountDto) {
    const created = await this.prisma.channelAccount.create({
      data: {
        ...data,
        status: data.status || 'connected',
        lastSyncAt: new Date(),
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
    return this.sanitize(created);
  }

  async findAll() {
    const rows = await this.prisma.channelAccount.findMany({
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
    return rows.map((r) => this.sanitize(r));
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

    return this.sanitize(account);
  }

  async update(id: string, data: UpdateChannelAccountDto) {
    const account = await this.prisma.channelAccount.update({
      where: { id },
      data: {
        ...data,
        lastSyncAt: new Date(),
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

    return this.sanitize(account);
  }

  async remove(id: string) {
    await this.prisma.channelAccount.delete({
      where: { id },
    });

    return { message: 'Channel account deleted successfully' };
  }
}






