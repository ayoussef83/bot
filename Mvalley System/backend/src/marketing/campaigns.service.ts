import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto, UpdateCampaignDto } from './dto';

@Injectable()
export class CampaignsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCampaignDto) {
    return this.prisma.campaign.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status || 'active',
      },
      include: {
        channelAccount: true,
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
    return this.prisma.campaign.findMany({
      include: {
        channelAccount: true,
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
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        channelAccount: true,
        conversations: {
          take: 10,
          orderBy: { lastMessageAt: 'desc' },
          include: {
            participant: true,
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

    return this.prisma.campaign.update({
      where: { id },
      data: updateData,
      include: {
        channelAccount: true,
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
    await this.prisma.campaign.delete({
      where: { id },
    });

    return { message: 'Campaign deleted successfully' };
  }
}



