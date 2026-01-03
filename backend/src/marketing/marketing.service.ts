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
      this.prisma.conversation.count(),
      this.prisma.conversation.count({ where: { status: 'new' } }),
      this.prisma.conversation.count({ where: { status: 'in_progress' } }),
      this.prisma.conversation.count({ where: { status: 'waiting_reply' } }),
      this.prisma.conversation.count({ where: { status: 'converted' } }),
      this.prisma.channelAccount.count({ where: { status: 'connected' } }),
      this.prisma.campaign.count({ where: { status: 'active' } }),
      this.prisma.conversation.findMany({
        take: 10,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          channelAccount: true,
          participant: true,
          campaign: true,
          messages: {
            orderBy: { sentAt: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    // Channel breakdown
    const channelBreakdown = await this.prisma.conversation.groupBy({
      by: ['platform'],
      _count: {
        id: true,
      },
    });

    // Campaign performance (top 5)
    const topCampaigns = await this.prisma.campaign.findMany({
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







