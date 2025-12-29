import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  private normalizeDateInput(value?: string) {
    if (!value) return undefined;
    // Accept both full ISO datetime and HTML date input (YYYY-MM-DD).
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
    const date = isDateOnly ? new Date(`${value}T00:00:00.000Z`) : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid date: ${value}`);
    }
    return date;
  }

  async create(data: CreatePaymentDto, createdBy: string) {
    const studentId = data.studentId?.trim();
    if (!studentId) {
      throw new BadRequestException('studentId is required');
    }

    const student = await this.prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
      select: { id: true },
    });
    if (!student) {
      throw new BadRequestException('Student not found');
    }

    const paymentDate = this.normalizeDateInput(data.paymentDate);
    const dueDate = this.normalizeDateInput(data.dueDate);

    const payment = await this.prisma.payment.create({
      data: {
        ...data,
        studentId,
        paymentDate,
        dueDate,
        createdBy,
      },
      include: {
        student: {
          include: {
            parent: true,
            class: true,
          },
        },
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: createdBy,
        action: 'create',
        entityType: 'Payment',
        entityId: payment.id,
      },
    });

    return payment;
  }

  async findAll(studentId?: string, status?: string) {
    return this.prisma.payment.findMany({
      where: {
        ...(studentId && { studentId }),
        ...(status && { status: status as any }),
        deletedAt: null,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, deletedAt: null },
      include: {
        student: {
          include: {
            parent: true,
            class: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async update(id: string, data: UpdatePaymentDto, updatedBy: string) {
    const studentId = data.studentId?.trim();
    if (studentId) {
      const student = await this.prisma.student.findFirst({
        where: { id: studentId, deletedAt: null },
        select: { id: true },
      });
      if (!student) {
        throw new BadRequestException('Student not found');
      }
    }

    const paymentDate = this.normalizeDateInput(data.paymentDate);
    const dueDate = this.normalizeDateInput(data.dueDate);

    const payment = await this.prisma.payment.update({
      where: { id },
      data: {
        ...data,
        ...(studentId ? { studentId } : {}),
        ...(data.paymentDate !== undefined ? { paymentDate } : {}),
        ...(data.dueDate !== undefined ? { dueDate } : {}),
      },
      include: {
        student: true,
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: updatedBy,
        action: 'update',
        entityType: 'Payment',
        entityId: id,
        changes: JSON.stringify(data),
      },
    });

    return payment;
  }

  async remove(id: string, deletedBy: string) {
    const payment = await this.prisma.payment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: deletedBy,
        action: 'delete',
        entityType: 'Payment',
        entityId: id,
      },
    });

    return payment;
  }

  async getOutstandingBalances() {
    const students = await this.prisma.student.findMany({
      where: { deletedAt: null },
      include: {
        payments: {
          where: {
            status: 'pending',
            deletedAt: null,
          },
        },
      },
    });

    return students
      .map((student) => ({
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        outstandingAmount: student.payments.reduce(
          (sum, p) => sum + p.amount,
          0,
        ),
        pendingPayments: student.payments.length,
      }))
      .filter((s) => s.outstandingAmount > 0);
  }

  async getStudentSummary(studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!student) throw new NotFoundException('Student not found');

    const payments = await this.prisma.payment.findMany({
      where: { studentId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    const totalCompleted = payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    const totalPending = payments
      .filter((p) => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);

    const duePayments = payments
      .filter((p) => p.status === 'pending' && p.dueDate)
      .sort((a, b) => (a.dueDate!.getTime() ?? 0) - (b.dueDate!.getTime() ?? 0));

    return {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      totalCompleted,
      totalPending,
      duePayments,
      payments,
    };
  }
}

