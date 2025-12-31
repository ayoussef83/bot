import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SnapshotsService {
  constructor(private prisma: PrismaService) {}

  async generateSnapshot(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get payments
    const payments = await this.prisma.payment.findMany({
      where: {
        receivedDate: {
          gte: startDate,
          lte: endDate,
        },
        status: 'received',
      },
    });

    // Get expenses
    const expenses = await this.prisma.expense.findMany({
      where: {
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { category: true },
    });

    // Calculate revenue
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    // Payment "type" is not modeled in Prisma; keep breakdowns as 0 for now.
    const subscriptionRevenue = 0;
    const campRevenue = 0;
    const b2bRevenue = 0;

    // Calculate expenses
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    // Best-effort bucketization based on expense category name/code.
    const byBucket = expenses.reduce(
      (acc, e) => {
        const key = `${e.category?.code ?? ''} ${e.category?.name ?? ''}`.toLowerCase();
        if (key.includes('rent')) acc.rent += e.amount;
        else if (key.includes('instr') || key.includes('instructor')) acc.instructor += e.amount;
        else if (key.includes('mkt') || key.includes('market')) acc.marketing += e.amount;
        else if (key.includes('oper')) acc.operations += e.amount;
        else acc.other += e.amount;
        return acc;
      },
      { rent: 0, instructor: 0, marketing: 0, operations: 0, other: 0 },
    );

    const rentExpenses = byBucket.rent;
    const instructorExpenses = byBucket.instructor;
    const marketingExpenses = byBucket.marketing;
    const operationsExpenses = byBucket.operations;

    // Get active students
    const activeStudents = await this.prisma.student.count({
      where: {
        status: 'active',
        deletedAt: null,
      },
    });

    // Calculate average students per session (from classes)
    const classes = await this.prisma.class.findMany({
      where: { deletedAt: null },
      include: {
        sessions: {
          where: {
            scheduledDate: {
              gte: startDate,
              lte: endDate,
            },
            status: 'completed',
          },
          include: {
            attendances: {
              where: { attended: true },
            },
          },
        },
      },
    });

    const allSessions = classes.flatMap((c) => c.sessions);
    const totalAttendances = allSessions.reduce(
      (sum, s) => sum + s.attendances.length,
      0,
    );
    const avgStudentsPerSession =
      allSessions.length > 0 ? totalAttendances / allSessions.length : 0;

    // Calculate instructor utilization (simplified)
    const instructors = await this.prisma.instructor.findMany({
      where: { deletedAt: null },
      include: {
        sessions: {
          where: {
            scheduledDate: {
              gte: startDate,
              lte: endDate,
            },
            status: 'completed',
          },
        },
      },
    });

    const totalInstructorSessions = instructors.reduce(
      (sum, i) => sum + i.sessions.length,
      0,
    );
    const instructorUtilization =
      instructors.length > 0 ? totalInstructorSessions / instructors.length : 0;

    // Check if snapshot exists
    const existing = await this.prisma.monthlySnapshot.findUnique({
      where: {
        year_month: {
          year,
          month,
        },
      },
    });

    const snapshotData = {
      year,
      month,
      totalRevenue,
      subscriptionRevenue,
      campRevenue,
      b2bRevenue,
      totalExpenses,
      rentExpenses,
      instructorExpenses,
      marketingExpenses,
      operationsExpenses,
      activeStudents,
      avgStudentsPerSession,
      instructorUtilization,
    };

    const snapshot = existing
      ? await this.prisma.monthlySnapshot.update({
          where: {
            year_month: {
              year,
              month,
            },
          },
          data: snapshotData,
        })
      : await this.prisma.monthlySnapshot.create({
          data: snapshotData,
        });

    return snapshot;
  }

  async getSnapshot(year: number, month: number) {
    return this.prisma.monthlySnapshot.findUnique({
      where: {
        year_month: {
          year,
          month,
        },
      },
    });
  }

  async getAllSnapshots(year?: number) {
    return this.prisma.monthlySnapshot.findMany({
      where: year ? { year } : {},
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    });
  }
}

