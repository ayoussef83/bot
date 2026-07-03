import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RenewalStage, ChurnReason } from '@prisma/client';

// Workflow E — renewal engine. Session-8 trigger, stage machine, win-back feed.
@Injectable()
export class RenewalsService {
  private readonly logger = new Logger(RenewalsService.name);
  constructor(private prisma: PrismaService) {}

  /** Count attended completed sessions for an enrollment's current round. */
  private async sessionsUsed(enrollment: { studentId: string; classId: string | null }) {
    if (!enrollment.classId) return 0;
    return this.prisma.sessionAttendance.count({
      where: {
        studentId: enrollment.studentId,
        attended: true,
        session: { classId: enrollment.classId, status: 'completed', deletedAt: null },
      },
    });
  }

  /** Daily 06:00 Cairo — create renewal cases at session >= 8, refresh renewal dates. */
  @Cron('0 6 * * *', { timeZone: 'Africa/Cairo' })
  async dailyScan() {
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: { status: 'active', classId: { not: null } },
      include: { class: true },
    });
    let created = 0;
    for (const e of enrollments) {
      const used = await this.sessionsUsed(e);
      // Projected renewal date = last completed session + remaining weeks
      const lastSession = await this.prisma.session.findFirst({
        where: { classId: e.classId!, status: 'completed', deletedAt: null },
        orderBy: { scheduledDate: 'desc' },
      });
      if (lastSession) {
        const remaining = Math.max(e.sessionsPlanned - used, 0);
        const renewalDate = new Date(lastSession.scheduledDate);
        renewalDate.setDate(renewalDate.getDate() + remaining * 7);
        await this.prisma.studentEnrollment.update({ where: { id: e.id }, data: { renewalDate } });
      }
      if (used >= 8) {
        const existing = await this.prisma.renewalCase.findUnique({
          where: { enrollmentId_roundNo: { enrollmentId: e.id, roundNo: e.roundNo } },
        });
        if (!existing) {
          await this.createCase(e.id, e.roundNo);
          created++;
        }
      }
    }
    if (created) this.logger.log(`Renewal scan: ${created} new case(s)`);
    return { scanned: enrollments.length, created };
  }

  async createCase(enrollmentId: string, roundNo: number) {
    const e = await this.prisma.studentEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { student: { include: { parent: true } }, courseLevel: { include: { course: true } } },
    });
    if (!e) throw new NotFoundException('Enrollment not found');
    const dueDate = e.renewalDate ?? new Date(Date.now() + 28 * 24 * 3600 * 1000);
    const c = await this.prisma.renewalCase.create({
      data: { enrollmentId, roundNo, dueDate },
    });
    // Session-8 parent notification (channel wiring: WhatsApp via inbox later)
    if (e.student.parent?.phone) {
      await this.prisma.notification.create({
        data: {
          channel: 'whatsapp',
          recipient: e.student.parent.phone,
          template: 'renewal_session8',
          message: `تجديد ${e.courseLevel.course.name} - ${e.student.firstName}: باقي 4 حصص على نهاية المستوى. تواصلوا معنا للتجديد.`,
          studentId: e.studentId,
          parentId: e.student.parentId ?? undefined,
        },
      });
    }
    return c;
  }

  list(stage?: RenewalStage) {
    return this.prisma.renewalCase.findMany({
      where: stage ? { stage } : {},
      include: {
        enrollment: {
          include: {
            student: { include: { parent: true } },
            courseLevel: { include: { course: true } },
            class: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async setStage(
    id: string,
    dto: { stage: RenewalStage; churnReason?: ChurnReason; churnNotes?: string },
    userId: string,
  ) {
    const c = await this.prisma.renewalCase.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Renewal case not found');
    if (dto.stage === 'renewed') {
      throw new BadRequestException('Use POST /renewals/:id/renewed with the new-round invoice');
    }
    if (dto.stage === 'lost') {
      if (!dto.churnReason) throw new BadRequestException('churnReason is required to mark a renewal lost');
      if (c.attempts < 3) throw new BadRequestException('Lost requires >= 3 contact attempts (or record explicit refusal via churnNotes and 3 attempts)');
    }
    const attempts =
      dto.stage === 'reminder_sent' || dto.stage === 'negotiating' ? c.attempts + 1 : c.attempts;
    return this.prisma.renewalCase.update({
      where: { id },
      data: {
        stage: dto.stage,
        churnReason: dto.churnReason,
        churnNotes: dto.churnNotes,
        attempts,
        lastContactAt: new Date(),
        ownerId: userId,
      },
    });
  }

  /** Renewed: requires a paid invoice for the new round; resets counters. */
  async markRenewed(id: string, invoiceId: string, userId: string) {
    const c = await this.prisma.renewalCase.findUnique({
      where: { id },
      include: { enrollment: true },
    });
    if (!c) throw new NotFoundException('Renewal case not found');
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { paymentAllocations: true },
    });
    if (!invoice || invoice.studentId !== c.enrollment.studentId) {
      throw new BadRequestException('Invoice not found for this student');
    }
    const paid = invoice.paymentAllocations.reduce((s, a) => s + a.amount, 0);
    if (paid < invoice.totalAmount) {
      throw new BadRequestException('Invoice is not fully paid — register the payment first');
    }
    const nextRenewal = new Date();
    nextRenewal.setDate(nextRenewal.getDate() + c.enrollment.sessionsPlanned * 7);
    const [updated] = await this.prisma.$transaction([
      this.prisma.renewalCase.update({
        where: { id },
        data: { stage: 'renewed', ownerId: userId, lastContactAt: new Date() },
      }),
      this.prisma.studentEnrollment.update({
        where: { id: c.enrollmentId },
        data: { roundNo: c.enrollment.roundNo + 1, renewalDate: nextRenewal },
      }),
    ]);
    return updated;
  }

  setRecommendation(id: string, recommendation: string) {
    return this.prisma.renewalCase.update({
      where: { id },
      data: { instructorRecommendation: recommendation },
    });
  }

  /** Monthly win-back feed for Sales. */
  winBack(year: number, month: number) {
    const from = new Date(Date.UTC(year, month - 1, 1));
    const to = new Date(Date.UTC(year, month, 1));
    return this.prisma.renewalCase.findMany({
      where: { stage: 'lost', updatedAt: { gte: from, lt: to } },
      include: {
        enrollment: {
          include: { student: { include: { parent: true } }, courseLevel: { include: { course: true } } },
        },
      },
    });
  }

  async kpis() {
    const [due, renewed, lost] = await Promise.all([
      this.prisma.renewalCase.count(),
      this.prisma.renewalCase.count({ where: { stage: 'renewed' } }),
      this.prisma.renewalCase.count({ where: { stage: 'lost' } }),
    ]);
    return { totalCases: due, renewed, lost, renewalRate: due ? renewed / due : 0 };
  }
}
