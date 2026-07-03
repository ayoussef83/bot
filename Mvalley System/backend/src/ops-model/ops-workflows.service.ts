import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SlotRequestStatus, AuditFlagType, Location } from '@prisma/client';

@Injectable()
export class OpsWorkflowsService {
  private readonly logger = new Logger(OpsWorkflowsService.name);
  constructor(private prisma: PrismaService) {}

  // ── Slot requests (Workflow A trigger) ─────────────────────────────
  createSlotRequest(dto: {
    parentId?: string; studentId?: string; courseId: string; courseLevelId?: string;
    preferredDay?: number; timeWindow?: string; location?: Location; notes?: string;
  }, userId: string) {
    return this.prisma.slotRequest.create({ data: { ...dto, createdById: userId } });
  }

  listSlotRequests(status?: SlotRequestStatus) {
    return this.prisma.slotRequest.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Sunday demand meeting view: open requests grouped by course+level+day. 3+ = open a group. */
  async demand() {
    const open = await this.prisma.slotRequest.findMany({ where: { status: 'open' } });
    const groups = new Map<string, { courseId: string; courseLevelId: string | null; preferredDay: number | null; count: number; requestIds: string[] }>();
    for (const r of open) {
      const key = `${r.courseId}|${r.courseLevelId ?? '-'}|${r.preferredDay ?? '-'}`;
      const g = groups.get(key) ?? { courseId: r.courseId, courseLevelId: r.courseLevelId, preferredDay: r.preferredDay, count: 0, requestIds: [] };
      g.count++; g.requestIds.push(r.id);
      groups.set(key, g);
    }
    const courses = await this.prisma.course.findMany({ select: { id: true, name: true } });
    const nameOf = new Map(courses.map((c) => [c.id, c.name]));
    return [...groups.values()]
      .map((g) => ({ ...g, courseName: nameOf.get(g.courseId) ?? g.courseId, readyToOpen: g.count >= 3 }))
      .sort((a, b) => b.count - a.count);
  }

  /** When a group opens: mark matching requests + notify request owners (sales). */
  async matchSlotRequests(classId: string, requestIds: string[], userId: string) {
    const cls = await this.prisma.class.findFirst({ where: { id: classId, deletedAt: null } });
    if (!cls) throw new NotFoundException('Class not found');
    await this.prisma.slotRequest.updateMany({
      where: { id: { in: requestIds }, status: 'open' },
      data: { status: 'matched', matchedClassId: classId },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: 'update', entityType: 'SlotRequest', entityId: classId, changes: JSON.stringify({ matched: requestIds }) },
    });
    return { matched: requestIds.length, classId };
  }

  // ── Onboarding (Workflow B) ─────────────────────────────────────────
  /** Called after a payment allocation fully pays an enrollment's invoice. */
  async markPaidUnverified(enrollmentId: string) {
    return this.prisma.studentEnrollment.updateMany({
      where: { id: enrollmentId, onboardingStatus: 'pending_payment' },
      data: { onboardingStatus: 'paid_unverified' },
    });
  }

  async onboard(enrollmentId: string, userId: string) {
    const e = await this.prisma.studentEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { student: { include: { parent: true } }, courseLevel: { include: { course: true } } },
    });
    if (!e) throw new NotFoundException('Enrollment not found');
    if (e.onboardingStatus === 'onboarded') throw new BadRequestException('Already onboarded');
    const updated = await this.prisma.studentEnrollment.update({
      where: { id: enrollmentId },
      data: { onboardingStatus: 'onboarded', onboardedAt: new Date(), onboardedById: userId },
    });
    // Welcome message (bilingual, template key for later WhatsApp wiring)
    if (e.student.parent?.phone) {
      await this.prisma.notification.create({
        data: {
          channel: 'whatsapp',
          recipient: e.student.parent.phone,
          template: 'welcome_onboarding',
          message: `أهلاً بيكم في Mindvalley! تم تسجيل ${e.student.firstName} في ${e.courseLevel.course.name}. Welcome aboard!`,
          studentId: e.studentId,
          parentId: e.student.parentId ?? undefined,
        },
      });
    }
    return updated;
  }

  // ── Daily audits (Operations doc §2) ────────────────────────────────
  @Cron('30 5 * * *', { timeZone: 'Africa/Cairo' })
  async runAudits() {
    let flags = 0;
    // (a) unpaid booking: active enrollment in a class, but no fully-allocated invoice for the student
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: { status: 'active', classId: { not: null } },
      include: { student: { include: { invoices: { include: { paymentAllocations: true } }, parent: true } } },
    });
    for (const e of enrollments) {
      const paidTotal = e.student.invoices.reduce(
        (s, inv) => s + inv.paymentAllocations.reduce((x, a) => x + a.amount, 0), 0);
      if (paidTotal <= 0) {
        flags += await this.flag('unpaid_booking', 'enrollment', e.id,
          `Seat booked with no payment: ${e.student.firstName} ${e.student.lastName}`);
      }
      // (b) incomplete profile on paid students
      if (paidTotal > 0 && (!e.student.parent?.phone || !e.student.age)) {
        flags += await this.flag('incomplete_profile', 'student', e.studentId,
          `Paid student missing required fields (parent phone / age): ${e.student.firstName}`);
      }
    }
    // (c) yesterday's sessions without any attendance recorded
    const y0 = new Date(); y0.setDate(y0.getDate() - 1); y0.setHours(0, 0, 0, 0);
    const y1 = new Date(y0); y1.setDate(y1.getDate() + 1);
    const sessions = await this.prisma.session.findMany({
      where: { scheduledDate: { gte: y0, lt: y1 }, status: { not: 'cancelled' }, deletedAt: null },
      include: { attendances: true, class: true },
    });
    for (const s of sessions) {
      if (s.attendances.length === 0) {
        flags += await this.flag('missing_attendance', 'session', s.id,
          `No attendance recorded for ${s.class?.name ?? 'class'} on ${s.scheduledDate.toISOString().slice(0, 10)}`);
      }
    }
    if (flags) this.logger.warn(`Daily audit: ${flags} open flag(s)`);
    return { flags };
  }

  private async flag(type: AuditFlagType, entityType: string, entityId: string, message: string) {
    try {
      await this.prisma.auditFlag.create({ data: { type, entityType, entityId, message } });
      return 1;
    } catch {
      return 0; // unique(open) constraint — already flagged
    }
  }

  listFlags(status?: 'open' | 'resolved') {
    return this.prisma.auditFlag.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async resolveFlag(id: string, note: string, userId: string) {
    if (!note?.trim()) throw new BadRequestException('A resolution note is required');
    return this.prisma.auditFlag.update({
      where: { id },
      data: { status: 'resolved', resolvedById: userId, resolvedAt: new Date(), resolutionNote: note },
    });
  }
}
