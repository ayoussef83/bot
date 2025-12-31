import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getManagementDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Revenue
    const payments = await this.prisma.payment.findMany({
      where: {
        receivedDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: 'received',
      },
    });
    const monthlyRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    // Active students
    const activeStudents = await this.prisma.student.count({
      where: {
        status: 'active',
        deletedAt: null,
      },
    });

    // Average students per session
    const classes = await this.prisma.class.findMany({
      where: { deletedAt: null },
      include: {
        sessions: {
          where: {
            scheduledDate: {
              gte: startOfMonth,
              lte: endOfMonth,
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

    // Instructor utilization
    const instructors = await this.prisma.instructor.findMany({
      where: { deletedAt: null },
      include: {
        sessions: {
          where: {
            scheduledDate: {
              gte: startOfMonth,
              lte: endOfMonth,
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

    // Class fill rate
    const underfilledClasses = await this.prisma.class.count({
      where: {
        isUnderfilled: true,
        deletedAt: null,
      },
    });
    const totalClasses = await this.prisma.class.count({
      where: { deletedAt: null },
    });
    const classFillRate =
      totalClasses > 0
        ? ((totalClasses - underfilledClasses) / totalClasses) * 100
        : 0;

    // Cash in/out
    const expenses = await this.prisma.expense.findMany({
      where: {
        expenseDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });
    const cashOut = expenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      monthlyRevenue,
      activeStudents,
      avgStudentsPerSession: Math.round(avgStudentsPerSession * 100) / 100,
      instructorUtilization: Math.round(instructorUtilization * 100) / 100,
      classFillRate: Math.round(classFillRate * 100) / 100,
      cashIn: monthlyRevenue,
      cashOut,
      net: monthlyRevenue - cashOut,
    };
  }

  async getOpsDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Daily sessions
    const dailySessions = await this.prisma.session.findMany({
      where: {
        scheduledDate: {
          gte: today,
          lt: tomorrow,
        },
        deletedAt: null,
      },
      include: {
        class: {
          include: {
            instructor: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        attendances: {
          include: {
            student: true,
          },
        },
      },
    });

    // Underfilled classes
    const underfilledClasses = await this.prisma.class.findMany({
      where: {
        isUnderfilled: true,
        deletedAt: null,
      },
      include: {
        instructor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        students: {
          where: { deletedAt: null },
        },
      },
    });

    // Instructor schedule
    const instructors = await this.prisma.instructor.findMany({
      where: { deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        classes: {
          where: { deletedAt: null },
        },
        sessions: {
          where: {
            scheduledDate: {
              gte: today,
            },
          },
          orderBy: {
            scheduledDate: 'asc',
          },
          take: 10,
        },
      },
    });

    return {
      dailySessions,
      underfilledClasses,
      instructorSchedule: instructors.map((i) => ({
        instructor: i.user,
        classes: i.classes,
        upcomingSessions: i.sessions,
      })),
    };
  }

  async getAccountingDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Payments received
    const payments = await this.prisma.payment.findMany({
      where: {
        receivedDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: 'received',
      },
      include: {
        Student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        receivedDate: 'desc',
      },
    });

    // Outstanding balances
    const outstanding = await this.prisma.student.findMany({
      where: { deletedAt: null },
      include: {
        payments: {
          where: {
            status: 'pending',
          },
        },
      },
    });

    const outstandingBalances = outstanding
      .map((student) => ({
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        outstandingAmount: student.payments.reduce(
          (sum, p) => sum + p.amount,
          0,
        ),
        pendingPayments: student.payments.length,
      }))
      .filter((s) => s.outstandingAmount > 0)
      .sort((a, b) => b.outstandingAmount - a.outstandingAmount);

    // Expense breakdown
    const expenses = await this.prisma.expense.findMany({
      where: {
        expenseDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: { category: true },
    });

    const expenseBreakdown = expenses.reduce((acc, expense) => {
      const key = expense.category?.name || expense.categoryId;
      if (!acc[key]) {
        acc[key] = 0;
      }
      acc[key] += expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      paymentsReceived: payments,
      totalReceived: payments.reduce((sum, p) => sum + p.amount, 0),
      outstandingBalances,
      totalOutstanding: outstandingBalances.reduce(
        (sum, s) => sum + s.outstandingAmount,
        0,
      ),
      expenseBreakdown,
      totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
    };
  }

  async getInstructorDashboard(instructorId: string) {
    const instructor = await this.prisma.instructor.findUnique({
      where: { id: instructorId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        classes: {
          where: { deletedAt: null },
          include: {
            students: {
              where: { deletedAt: null },
            },
          },
        },
        sessions: {
          where: {
            scheduledDate: {
              gte: new Date(),
            },
          },
          orderBy: {
            scheduledDate: 'asc',
          },
          include: {
            class: true,
            attendances: {
              include: {
                student: true,
              },
            },
          },
        },
      },
    });

    if (!instructor) {
      return null;
    }

    // Get recent attendance
    const recentSessions = await this.prisma.session.findMany({
      where: {
        instructorId: instructor.id,
        status: 'completed',
      },
      orderBy: {
        scheduledDate: 'desc',
      },
      take: 5,
      include: {
        class: true,
        attendances: {
          include: {
            student: true,
          },
        },
      },
    });

    return {
      instructor: instructor.user,
      assignedClasses: instructor.classes,
      upcomingSessions: instructor.sessions,
      recentSessions,
    };
  }
}

