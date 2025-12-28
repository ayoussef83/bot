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
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
        status: 'completed',
        deletedAt: null,
      },
    });

    // Get expenses
    const expenses = await this.prisma.expense.findMany({
      where: {
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
    });

    // Calculate revenue
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const subscriptionRevenue = payments
      .filter((p) => p.type === 'subscription')
      .reduce((sum, p) => sum + p.amount, 0);
    const campRevenue = payments
      .filter((p) => p.type === 'camp')
      .reduce((sum, p) => sum + p.amount, 0);
    const b2bRevenue = payments
      .filter((p) => p.type === 'b2b')
      .reduce((sum, p) => sum + p.amount, 0);

    // Calculate expenses
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const rentExpenses = expenses
      .filter((e) => e.category === 'rent')
      .reduce((sum, e) => sum + e.amount, 0);
    const instructorExpenses = expenses
      .filter((e) => e.category === 'instructor')
      .reduce((sum, e) => sum + e.amount, 0);
    const marketingExpenses = expenses
      .filter((e) => e.category === 'marketing')
      .reduce((sum, e) => sum + e.amount, 0);
    const operationsExpenses = expenses
      .filter((e) => e.category === 'operations')
      .reduce((sum, e) => sum + e.amount, 0);

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

