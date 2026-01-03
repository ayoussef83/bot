import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto, UpdateCampaignDto } from './dto';

@Injectable()
export class CampaignsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCampaignDto) {
    return this.prisma.campaigns.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status || 'active',
      },
      include: {
        channel_accounts: true,
        _count: {
          select: {
            conversations: true,
            attributions: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.campaigns.findMany({
      include: {
        channel_accounts: true,
        _count: {
          select: {
            conversations: true,
            attributions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const campaign = await this.prisma.campaigns.findUnique({
      where: { id },
      include: {
        channel_accounts: true,
        conversations: {
          take: 10,
          orderBy: { lastMessageAt: 'desc' },
          include: {
            participants: true,
            _count: {
              select: {
                messages: true,
              },
            },
          },
        },
        _count: {
          select: {
            conversations: true,
            attributions: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  async update(id: string, data: UpdateCampaignDto) {
    const updateData: any = { ...data };
    
    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      updateData.endDate = new Date(data.endDate);
    }

    return this.prisma.campaigns.update({
      where: { id },
      data: updateData,
      include: {
        channel_accounts: true,
        _count: {
          select: {
            conversations: true,
            attributions: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.prisma.campaigns.delete({
      where: { id },
    });

    return { message: 'Campaign deleted successfully' };
  }
}



