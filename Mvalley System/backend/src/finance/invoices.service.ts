import { Injectable } from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async create(createInvoiceDto: CreateInvoiceDto) {
    // Generate invoice number
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const count = await this.prisma.invoices.count({
      where: {
        issueDate: {
          gte: new Date(year, now.getMonth(), 1),
          lt: new Date(year, now.getMonth() + 1, 1),
        },
      },
    });
    const invoiceNumber = `INV-${year}-${month}-${String(count + 1).padStart(4, '0')}`;

    // Calculate total if not provided
    const totalAmount =
      createInvoiceDto.totalAmount ||
      createInvoiceDto.subtotal -
        (createInvoiceDto.discountAmount || 0) +
        (createInvoiceDto.taxAmount || 0);

    // Determine initial status
    let status = createInvoiceDto.status || 'issued';
    const dueDate = new Date(createInvoiceDto.dueDate);
    if (dueDate < new Date() && status === 'issued') {
      status = 'overdue';
    }

    return this.prisma.invoices.create({
      data: {
        ...createInvoiceDto,
        invoiceNumber,
        issueDate: new Date(),
        dueDate,
        subtotal: createInvoiceDto.subtotal,
        discountAmount: createInvoiceDto.discountAmount || 0,
        taxAmount: createInvoiceDto.taxAmount || 0,
        totalAmount,
        status,
      },
      include: {
        students: true,
        paymentAllocations: {
          include: {
            payment: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.invoices.findMany({
      orderBy: { issueDate: 'desc' },
      include: {
        students: true,
        paymentAllocations: {
          include: {
            payment: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.invoices.findUnique({
      where: { id },
      include: {
        students: true,
        paymentAllocations: {
          include: {
            payment: {
              include: {
                cash_accounts: true,
              },
            },
          },
        },
      },
    });
  }

  async findByStudent(studentId: string) {
    return this.prisma.invoices.findMany({
      where: { studentId },
      orderBy: { issueDate: 'desc' },
      include: {
        paymentAllocations: {
          include: {
            payment: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, status: InvoiceStatus) {
    const invoice = await this.prisma.invoices.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Check if overdue
    let newStatus: InvoiceStatus = status;
    if (status === 'issued' && invoice.dueDate < new Date()) {
      newStatus = 'overdue';
    }

    return this.prisma.invoices.update({
      where: { id },
      data: { status: newStatus },
      include: {
        students: true,
        paymentAllocations: {
          include: {
            payment: true,
          },
        },
      },
    });
  }

  async cancel(id: string) {
    const invoice = await this.prisma.invoices.findUnique({
      where: { id },
      include: {
        paymentAllocations: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'cancelled') {
      throw new Error('Invoice already cancelled');
    }

    if (invoice.paymentAllocations.length > 0) {
      throw new Error('Cannot cancel invoice with payments allocated');
    }

    return this.prisma.invoices.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }
}



