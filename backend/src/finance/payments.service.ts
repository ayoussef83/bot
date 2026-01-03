import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreatePaymentAllocationDto } from './dto/create-payment-allocation.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(createPaymentDto: CreatePaymentDto, userId?: string) {
    // Generate payment number
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const count = await this.prisma.payment.count({
      where: {
        receivedDate: {
          gte: new Date(year, now.getMonth(), 1),
          lt: new Date(year, now.getMonth() + 1, 1),
        },
      },
    });
    const paymentNumber = `PAY-${year}-${month}-${String(count + 1).padStart(4, '0')}`;

    // Update cash account balance if payment is received
    if (createPaymentDto.status === 'received') {
      await this.prisma.cashAccount.update({
        where: { id: createPaymentDto.cashAccountId },
        data: {
          balance: {
            increment: createPaymentDto.amount,
          },
        },
      });
    }

    return this.prisma.payment.create({
      data: {
        ...createPaymentDto,
        paymentNumber,
        receivedDate: createPaymentDto.receivedDate ? new Date(createPaymentDto.receivedDate) : new Date(),
        receivedBy: userId,
      },
      include: {
        cashAccount: true,
        allocations: {
          include: {
            invoice: {
              include: {
                student: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(studentId?: string) {
    return this.prisma.payment.findMany({
      where: studentId 
        ? { 
            studentId: {
              equals: studentId, // Exact match required
              not: null, // Explicitly exclude null values
            },
          } 
        : undefined,
      orderBy: { receivedDate: 'desc' },
      include: {
        cashAccount: true,
        student: true, // Include student directly
        allocations: {
          include: {
            invoice: {
              include: {
                student: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.payment.findUnique({
      where: { id },
      include: {
        cashAccount: true,
        allocations: {
          include: {
            invoice: {
              include: {
                student: true,
              },
            },
          },
        },
      },
    });
  }

  async createAllocation(createAllocationDto: CreatePaymentAllocationDto, userId?: string) {
    // Verify payment exists and has enough unallocated amount
    const payment = await this.prisma.payment.findUnique({
      where: { id: createAllocationDto.paymentId },
      include: {
        allocations: true,
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    const totalAllocated = payment.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
    const unallocated = payment.amount - totalAllocated;

    if (createAllocationDto.amount > unallocated) {
      throw new Error(`Insufficient unallocated amount. Available: ${unallocated}`);
    }

    // Create allocation
    const allocation = await this.prisma.paymentAllocation.create({
      data: {
        ...createAllocationDto,
        allocatedBy: userId,
      },
      include: {
        payment: true,
        invoice: {
          include: {
            student: true,
          },
        },
      },
    });

    // Update invoice status
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: createAllocationDto.invoiceId },
      include: {
        paymentAllocations: true,
      },
    });

    if (invoice) {
      const totalPaid = invoice.paymentAllocations.reduce((sum, alloc) => sum + alloc.amount, 0);
      let newStatus = invoice.status;

      if (totalPaid >= invoice.totalAmount) {
        newStatus = 'paid';
      } else if (totalPaid > 0) {
        newStatus = 'partially_paid';
      }

      // Check if overdue
      if (newStatus !== 'paid' && invoice.dueDate < new Date()) {
        newStatus = 'overdue';
      }

      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: newStatus },
      });
    }

    return allocation;
  }

  async reverse(id: string, reason: string, userId?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        allocations: true,
        cashAccount: true,
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status === 'reversed') {
      throw new Error('Payment already reversed');
    }

    // Reverse cash account balance if payment was received
    if (payment.status === 'received' && payment.cashAccount) {
      await this.prisma.cashAccount.update({
        where: { id: payment.cashAccountId },
        data: {
          balance: {
            decrement: payment.amount,
          },
        },
      });
    }

    // Reverse invoice statuses
    for (const allocation of payment.allocations) {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: allocation.invoiceId },
        include: {
          paymentAllocations: true,
        },
      });

      if (invoice) {
        const remainingAllocations = invoice.paymentAllocations.filter(
          (alloc) => alloc.paymentId !== payment.id,
        );
        const totalPaid = remainingAllocations.reduce((sum, alloc) => sum + alloc.amount, 0);

        let newStatus = 'issued';
        if (totalPaid > 0) {
          newStatus = 'partially_paid';
        }
        if (invoice.dueDate < new Date() && newStatus !== 'paid') {
          newStatus = 'overdue';
        }

        await this.prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: newStatus },
        });
      }
    }

    // Delete allocations
    await this.prisma.paymentAllocation.deleteMany({
      where: { paymentId: id },
    });

    // Update payment status
    return this.prisma.payment.update({
      where: { id },
      data: {
        status: 'reversed',
        reversedAt: new Date(),
        reversalReason: reason,
      },
    });
  }
}
