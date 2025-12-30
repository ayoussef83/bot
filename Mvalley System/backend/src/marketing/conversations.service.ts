import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto, UpdateConversationDto, ConvertToLeadDto } from './dto';
import { ConversationStatus } from '@prisma/client';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateConversationDto) {
    return this.prisma.conversation.create({
      data: {
        ...data,
        status: data.status || 'new',
      },
      include: {
        channelAccount: true,
        participant: true,
        campaign: true,
        lead: true,
        messages: {
          orderBy: { sentAt: 'asc' },
          take: 20,
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });
  }

  async findAll(query: {
    status?: ConversationStatus;
    platform?: string;
    channelAccountId?: string;
    campaignId?: string;
    assignedTo?: string;
    participantId?: string;
  }) {
    return this.prisma.conversation.findMany({
      where: {
        ...(query.status && { status: query.status }),
        ...(query.platform && { platform: query.platform as any }),
        ...(query.channelAccountId && { channelAccountId: query.channelAccountId }),
        ...(query.campaignId && { campaignId: query.campaignId }),
        ...(query.assignedTo && { assignedTo: query.assignedTo }),
        ...(query.participantId && { participantId: query.participantId }),
      },
      include: {
        channelAccount: true,
        participant: true,
        campaign: true,
        lead: true,
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1, // Latest message only
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        channelAccount: true,
        participant: true,
        campaign: true,
        lead: true,
        messages: {
          orderBy: { sentAt: 'asc' },
        },
        attributions: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async update(id: string, data: UpdateConversationDto) {
    return this.prisma.conversation.update({
      where: { id },
      data,
      include: {
        channelAccount: true,
        participant: true,
        campaign: true,
        lead: true,
        messages: {
          orderBy: { sentAt: 'asc' },
        },
      },
    });
  }

  async convertToLead(id: string, data: ConvertToLeadDto, userId: string) {
    const conversation = await this.findOne(id);

    if (conversation.leadId) {
      throw new BadRequestException('Conversation already converted to lead');
    }

    // Check if linking to existing lead
    if (data.existingLeadId) {
      const existingLead = await this.prisma.lead.findUnique({
        where: { id: data.existingLeadId },
      });

      if (!existingLead) {
        throw new NotFoundException('Lead not found');
      }

      // Update lead with marketing attribution
      await this.prisma.lead.update({
        where: { id: data.existingLeadId },
        data: {
          marketingConversationId: conversation.id,
          marketingParticipantId: conversation.participantId,
          marketingCampaignId: conversation.campaignId || undefined,
          marketingSource: conversation.source || undefined,
          marketingMedium: 'social', // Default for social conversations
        },
      });

      // Link conversation to lead
      await this.prisma.conversation.update({
        where: { id },
        data: {
          leadId: data.existingLeadId,
          status: 'converted',
        },
      });

      return { message: 'Conversation linked to existing lead', leadId: data.existingLeadId };
    }

    // Create new lead
    if (!data.firstName || !data.lastName || (!data.email && !data.phone)) {
      throw new BadRequestException('First name, last name, and either email or phone are required');
    }

    const participant = conversation.participant;
    const lead = await this.prisma.lead.create({
      data: {
        firstName: data.firstName || participant.name?.split(' ')[0] || 'Unknown',
        lastName: data.lastName || participant.name?.split(' ').slice(1).join(' ') || 'Unknown',
        email: data.email || participant.email || undefined,
        phone: data.phone || participant.phone || '',
        source: 'social', // Default source
        status: 'new',
        notes: data.notes || `Converted from ${conversation.platform} conversation`,
        marketingConversationId: conversation.id,
        marketingParticipantId: conversation.participantId,
        marketingCampaignId: conversation.campaignId || undefined,
        marketingSource: conversation.source || conversation.platform,
        marketingMedium: 'social',
        createdBy: userId,
      },
      include: {
        marketingConversation: true,
        marketingParticipant: true,
      },
    });

    // Link conversation to lead
    await this.prisma.conversation.update({
      where: { id },
      data: {
        leadId: lead.id,
        status: 'converted',
      },
    });

    return lead;
  }

  async remove(id: string) {
    await this.prisma.conversation.delete({
      where: { id },
    });

    return { message: 'Conversation deleted successfully' };
  }
}

