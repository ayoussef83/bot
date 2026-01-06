import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InstructorCostModelType, InstructorPayrollStatus } from '@prisma/client';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  private monthRangeUtc(year: number, month: number) {
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 1, 0, 0, 0)); // exclusive
    return { start, end };
  }

  private minutesBetween(a: Date, b: Date) {
    return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
  }

  private async pickCostModel(instructorId: string, at: Date) {
    return this.prisma.instructorCostModel.findFirst({
      where: {
        instructorId,
        deletedAt: null,
        effectiveFrom: { lte: at },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: at } }],
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async generate(dto: GeneratePayrollDto, generatedBy: string) {
    const { start, end } = this.monthRangeUtc(dto.year, dto.month);

    const instructors = dto.instructorId
      ? await this.prisma.instructor.findMany({ where: { id: dto.instructorId, deletedAt: null } })
      : await this.prisma.instructor.findMany({ where: { deletedAt: null } });
    if (dto.instructorId && instructors.length === 0) throw new NotFoundException('Instructor not found');

    const results: any[] = [];
    for (const instructor of instructors) {
      const existing = await this.prisma.instructorPayroll.findFirst({
        where: {
          instructorId: instructor.id,
          periodYear: dto.year,
          periodMonth: dto.month,
          deletedAt: null,
          status: { not: InstructorPayrollStatus.void },
        },
      });
      if (existing) {
        results.push({ instructorId: instructor.id, payrollId: existing.id, status: 'exists' });
        continue;
      }

      const sessions = await this.prisma.session.findMany({
        where: {
          deletedAt: null,
          instructorId: instructor.id,
          status: 'completed',
          scheduledDate: { gte: start, lt: end },
        },
        include: {
          class: true,
          _count: { select: { attendances: true } },
        },
        orderBy: { scheduledDate: 'asc' },
      });

      // If there are no completed sessions in the period, don't create empty payrolls (unless a monthly model applies).
      const monthlyModel = await this.prisma.instructorCostModel.findFirst({
        where: {
          instructorId: instructor.id,
          deletedAt: null,
          type: InstructorCostModelType.monthly,
          effectiveFrom: { lte: end },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: start } }],
        },
        orderBy: { effectiveFrom: 'desc' },
      });

      if (sessions.length === 0 && !monthlyModel) {
        results.push({ instructorId: instructor.id, payrollId: null, status: 'no_sessions' });
        continue;
      }

      // Validation: no payroll generation without attendance
      const missingAttendance = sessions.filter((s) => (s as any)._count?.attendances === 0);
      if (missingAttendance.length > 0) {
        throw new BadRequestException(
          `Cannot generate payroll: ${missingAttendance.length} session(s) are missing attendance for instructor ${instructor.id}`,
        );
      }

      // Build InstructorSession rows (auto-calc cost)
      const instructorSessionRows: any[] = [];
      let totalFromSessions = 0;
      for (const s of sessions) {
        const durationMinutes = this.minutesBetween(new Date(s.startTime), new Date(s.endTime));
        const model = await this.pickCostModel(instructor.id, new Date(s.startTime));
        const attendanceComplete = (s as any)._count?.attendances > 0;

        let costAmount = 0;
        let currency = 'EGP';
        let costModelId: string | null = null;

        if (model) {
          currency = model.currency || 'EGP';
          costModelId = model.id;
          if (model.type === InstructorCostModelType.hourly) {
            costAmount = (durationMinutes / 60) * model.amount;
          } else if (model.type === InstructorCostModelType.per_session) {
            costAmount = model.amount;
          } else if (model.type === InstructorCostModelType.monthly) {
            costAmount = 0; // handled at payroll level
          }
        }

        totalFromSessions += costAmount;
        instructorSessionRows.push({
          sessionId: s.id,
          costModelId,
          costAmount,
          currency,
          durationMinutes,
          attendanceComplete,
          calculatedAt: new Date(),
        });
      }

      const totalAmount = monthlyModel ? monthlyModel.amount : totalFromSessions;
      const currency = monthlyModel?.currency || (instructorSessionRows[0]?.currency ?? 'EGP');

      const snapshot = {
        period: { year: dto.year, month: dto.month },
        instructorId: instructor.id,
        generatedAt: new Date().toISOString(),
        currency,
        totals: { totalAmount },
        sessions: sessions.map((s) => ({
          id: s.id,
          scheduledDate: s.scheduledDate,
          startTime: s.startTime,
          endTime: s.endTime,
          classId: s.classId,
          className: (s as any).class?.name,
          attendanceCount: (s as any)._count?.attendances ?? 0,
        })),
        calculations: instructorSessionRows,
        monthlyModel: monthlyModel
          ? { id: monthlyModel.id, amount: monthlyModel.amount, currency: monthlyModel.currency }
          : null,
      };

      // Write payroll + instructorSessions atomically
      const payroll = await this.prisma.$transaction(async (tx) => {
        const payrollRow = await tx.instructorPayroll.create({
          data: {
            instructorId: instructor.id,
            periodYear: dto.year,
            periodMonth: dto.month,
            status: InstructorPayrollStatus.draft,
            currency,
            totalAmount,
            snapshot,
            generatedBy,
          },
        });

        for (const row of instructorSessionRows) {
          await tx.instructorSession.upsert({
            where: { sessionId: row.sessionId },
            update: {
              instructorId: instructor.id,
              costModelId: row.costModelId,
              costAmount: row.costAmount,
              currency: row.currency,
              durationMinutes: row.durationMinutes,
              attendanceComplete: row.attendanceComplete,
              calculatedAt: row.calculatedAt,
              payrollId: payrollRow.id,
              deletedAt: null,
            },
            create: {
              instructorId: instructor.id,
              sessionId: row.sessionId,
              costModelId: row.costModelId,
              costAmount: row.costAmount,
              currency: row.currency,
              durationMinutes: row.durationMinutes,
              attendanceComplete: row.attendanceComplete,
              calculatedAt: row.calculatedAt,
              payrollId: payrollRow.id,
            },
          });
        }

        await tx.auditLog.create({
          data: {
            userId: generatedBy,
            action: 'create',
            entityType: 'InstructorPayroll',
            entityId: payrollRow.id,
            changes: JSON.stringify({ instructorId: instructor.id, year: dto.year, month: dto.month }),
          },
        });

        return payrollRow;
      });

      results.push({ instructorId: instructor.id, payrollId: payroll.id, status: 'created' });
    }

    return { year: dto.year, month: dto.month, results };
  }

  async listInstructorPayroll(instructorId: string, user: any) {
    const instructor = await this.prisma.instructor.findFirst({ where: { id: instructorId, deletedAt: null } });
    if (!instructor) throw new NotFoundException('Instructor not found');
    if (user?.role === 'instructor' && instructor.userId !== user.id) {
      throw new NotFoundException('Instructor not found');
    }

    return this.prisma.instructorPayroll.findMany({
      where: { instructorId, deletedAt: null },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    });
  }
}


