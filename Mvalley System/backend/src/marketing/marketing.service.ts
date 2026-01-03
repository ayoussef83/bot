import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MarketingService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const [
      totalConversations,
      newConversations,
      inProgressConversations,
      waitingReplyConversations,
      convertedConversations,
      totalChannels,
      activeCampaigns,
      recentConversations,
    ] = await Promise.all([
      this.prisma.conversations.count(),
      this.prisma.conversations.count({ where: { status: 'new' } }),
      this.prisma.conversations.count({ where: { status: 'in_progress' } }),
      this.prisma.conversations.count({ where: { status: 'waiting_reply' } }),
      this.prisma.conversations.count({ where: { status: 'converted' } }),
      this.prisma.channel_accounts.count({ where: { status: 'connected' } }),
      this.prisma.campaigns.count({ where: { status: 'active' } }),
      this.prisma.conversations.findMany({
        take: 10,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          channel_accounts: true,
          participants: true,
          campaigns: true,
          messages: {
            orderBy: { sentAt: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    // Channel breakdown
    const channelBreakdown = await this.prisma.conversations.groupBy({
      by: ['platform'],
      _count: {
        id: true,
      },
    });

    // Campaign performance (top 5)
    const topCampaigns = await this.prisma.campaigns.findMany({
      where: { status: 'active' },
      take: 5,
      include: {
        _count: {
          select: {
            conversations: true,
          },
        },
      },
      orderBy: {
        conversations: {
          _count: 'desc',
        },
      },
    });

    return {
      metrics: {
        totalConversations,
        newConversations,
        inProgressConversations,
        waitingReplyConversations,
        convertedConversations,
        totalChannels,
        activeCampaigns,
      },
      channelBreakdown,
      topCampaigns,
      recentConversations,
    };
  }
}



