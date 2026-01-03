import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFollowUpDto } from './dto';

@Injectable()
export class FollowUpsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateFollowUpDto, createdBy: string) {
    const followUp = await this.prisma.leadsFollowUp.create({
      data: {
        ...data,
        createdBy,
      },
      include: {
        lead: true,
      },
    });

    return followUp;
  }

  async findByLead(leadId: string) {
    return this.prisma.leadsFollowUp.findMany({
      where: { leadId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

