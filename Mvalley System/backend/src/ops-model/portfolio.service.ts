import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PortfolioItemType } from '@prisma/client';

// Workflow D — milestone reports (4/8/12) + student portfolio (the renewal pitch)
@Injectable()
export class PortfolioService {
  constructor(private prisma: PrismaService) {}

  async createReport(dto: {
    enrollmentId: string; milestone: number; content: string; strengths?: string; nextFocus?: string;
  }, authorId: string) {
    if (![4, 8, 12].includes(dto.milestone)) {
      throw new BadRequestException('Milestone must be 4, 8 or 12');
    }
    return this.prisma.progressReport.create({ data: { ...dto, authorId } });
  }

  listReports(status?: 'draft' | 'approved' | 'published') {
    return this.prisma.progressReport.findMany({
      where: status ? { status } : {},
      include: {
        enrollment: {
          include: { student: true, courseLevel: { include: { course: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveReport(id: string, approverId: string) {
    const r = await this.prisma.progressReport.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Report not found');
    if (r.authorId === approverId) throw new BadRequestException('Author cannot approve their own report');
    if (r.status !== 'draft') throw new BadRequestException(`Report is ${r.status}`);
    return this.prisma.progressReport.update({
      where: { id },
      data: { status: 'approved', approvedById: approverId, approvedAt: new Date() },
    });
  }

  async publishReport(id: string) {
    const r = await this.prisma.progressReport.findUnique({
      where: { id },
      include: { enrollment: { include: { student: { include: { parent: true } } } } },
    });
    if (!r) throw new NotFoundException('Report not found');
    if (r.status !== 'approved') throw new BadRequestException('Only approved reports can be published');
    const updated = await this.prisma.progressReport.update({
      where: { id },
      data: { status: 'published', publishedAt: new Date() },
    });
    const parent = r.enrollment.student.parent;
    if (parent?.phone) {
      await this.prisma.notification.create({
        data: {
          channel: 'sms',
          recipient: parent.phone,
          template: 'progress_report_published',
          message: `تقرير جديد عن تقدم ${r.enrollment.student.firstName} متاح الآن في ملفه — اسألونا عنه!`,
          studentId: r.enrollment.studentId,
          parentId: r.enrollment.student.parentId ?? undefined,
        },
      });
    }
    return updated;
  }

  addItem(dto: { studentId: string; type: PortfolioItemType; url?: string; caption?: string }, userId: string) {
    return this.prisma.portfolioItem.create({ data: { ...dto, createdById: userId } });
  }

  /** Full portfolio payload — student profile tab, renewal pitch, parent app (S7 contract). */
  async getPortfolio(studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
      include: {
        parent: true,
        enrollments: {
          include: {
            courseLevel: { include: { course: true } },
            class: true,
            progressReports: { where: { status: 'published' } },
            renewalCases: { orderBy: { roundNo: 'desc' }, take: 1 },
          },
        },
        invoices: { include: { paymentAllocations: true }, orderBy: { issueDate: 'desc' } },
        attendances: { where: { attended: true } },
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    const items = await this.prisma.portfolioItem.findMany({
      where: { studentId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    const paymentStatement = student.invoices.map((inv) => ({
      invoiceNumber: inv.invoiceNumber,
      total: inv.totalAmount,
      paid: inv.paymentAllocations.reduce((s, a) => s + a.amount, 0),
      status: inv.status,
      issueDate: inv.issueDate,
    }));
    return {
      student: { id: student.id, name: `${student.firstName} ${student.lastName}`, age: student.age },
      parent: student.parent ? { name: `${student.parent.firstName} ${student.parent.lastName}`, phone: student.parent.phone } : null,
      enrollments: student.enrollments.map((e) => ({
        id: e.id,
        course: e.courseLevel.course.name,
        level: e.courseLevel.name,
        group: e.class?.name ?? null,
        startDate: e.createdAt,
        roundNo: e.roundNo,
        sessionsPlanned: e.sessionsPlanned,
        renewalDate: e.renewalDate,
        onboardingStatus: e.onboardingStatus,
        publishedReports: e.progressReports,
        latestRenewalCase: e.renewalCases[0] ?? null,
      })),
      attendedSessions: student.attendances.length,
      paymentStatement,
      items,
    };
  }
}
