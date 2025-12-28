import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreatePaymentDto, createdBy: string) {
    const payment = await this.prisma.payment.create({
      data: {
        ...data,
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
    const payment = await this.prisma.payment.update({
      where: { id },
      data,
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
}

