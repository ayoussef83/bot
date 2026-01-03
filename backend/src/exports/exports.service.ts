import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import PDFDocument = require('pdfkit');

type ExportFormat = 'xlsx' | 'pdf';

function toSafeFilename(s: string) {
  return s.replace(/[^a-zA-Z0-9._-]+/g, '_');
}

function toTitle(s: string) {
  return s
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .trim();
}

async function pdfToBuffer(render: (doc: any) => void): Promise<Buffer> {
  return await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    render(doc);
    doc.end();
  });
}

@Injectable()
export class ExportsService {
  constructor(private prisma: PrismaService) {}

  async exportEntity(entity: string, format: ExportFormat) {
    const { sheetName, rows } = await this.getRowsForEntity(entity);

    if (format === 'pdf') {
      const title = `MV-OS Export: ${toTitle(sheetName)}`;
      const buffer = await pdfToBuffer((doc) => {
        doc.fontSize(16).text(title, { align: 'left' });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#444').text(`Rows: ${rows.length}`);
        doc.moveDown(1);

        if (rows.length === 0) {
          doc.fillColor('#111').text('No data.');
          return;
        }

        const columns = Object.keys(rows[0]);
        doc.fillColor('#111').fontSize(9).text(columns.join(' | '));
        doc.moveDown(0.25);
        doc.fillColor('#666').text('-'.repeat(120));
        doc.moveDown(0.25);

        for (const row of rows.slice(0, 2000)) {
          const line = columns
            .map((c) => {
              const v = (row as any)[c];
              if (v === null || v === undefined) return '';
              if (v instanceof Date) return v.toISOString();
              return String(v);
            })
            .join(' | ');
          doc.fillColor('#111').text(line);
        }

        if (rows.length > 2000) {
          doc.moveDown(1);
          doc.fillColor('#999').text(`Truncated: showing first 2000 rows.`);
        }
      });

      return {
        filename: `${toSafeFilename(sheetName)}.pdf`,
        mimeType: 'application/pdf',
        buffer,
      };
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MV-OS';
    workbook.created = new Date();
    const ws = workbook.addWorksheet(toTitle(sheetName));

    const columns = rows.length > 0 ? Object.keys(rows[0]) : ['empty'];
    ws.columns = columns.map((c) => ({
      header: c,
      key: c,
      width: Math.min(40, Math.max(12, c.length + 2)),
    }));

    if (rows.length === 0) {
      ws.addRow({ empty: 'No data' });
    } else {
      for (const r of rows) {
        ws.addRow(r as any);
      }
      ws.getRow(1).font = { bold: true };
      ws.views = [{ state: 'frozen', ySplit: 1 }];
      ws.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: columns.length },
      };
    }

    // exceljs typings vary by environment (Buffer vs ArrayBuffer); normalize to Node Buffer.
    const xlsxOut = (await workbook.xlsx.writeBuffer()) as unknown;
    const buffer = Buffer.isBuffer(xlsxOut)
      ? xlsxOut
      : Buffer.from(xlsxOut as ArrayBuffer);
    return {
      filename: `${toSafeFilename(sheetName)}.xlsx`,
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer,
    };
  }

  private async getRowsForEntity(entityRaw: string): Promise<{
    sheetName: string;
    rows: Record<string, any>[];
  }> {
    const entity = (entityRaw || '').toLowerCase();

    switch (entity) {
      case 'students': {
        const students = await this.prisma.student.findMany({
          where: { deletedAt: null },
          include: { class: true, parent: true },
          orderBy: { createdAt: 'desc' },
        });
        return {
          sheetName: 'students',
          rows: students.map((s) => ({
            id: s.id,
            firstName: s.firstName,
            lastName: s.lastName,
            age: s.age,
            learningTrack: s.learningTrack,
            status: s.status,
            email: s.email,
            phone: s.phone,
            className: s.class?.name,
            parentName: s.parent ? `${s.parent.firstName} ${s.parent.lastName}` : null,
            createdAt: s.createdAt,
          })),
        };
      }

      case 'classes': {
        const classes = await this.prisma.class.findMany({
          where: { deletedAt: null },
          include: { instructor: { include: { user: true } } },
          orderBy: { createdAt: 'desc' },
        });
        return {
          sheetName: 'classes',
          rows: classes.map((c) => ({
            id: c.id,
            name: c.name,
            location: c.location,
            capacity: c.capacity,
            instructor: c.instructor?.user
              ? `${c.instructor.user.firstName} ${c.instructor.user.lastName}`
              : null,
            dayOfWeek: c.dayOfWeek,
            startTime: c.startTime,
            endTime: c.endTime,
            startDate: c.startDate,
            endDate: c.endDate,
            utilizationPercentage: c.utilizationPercentage,
            isUnderfilled: c.isUnderfilled,
            createdAt: c.createdAt,
          })),
        };
      }

      case 'payments': {
        const payments = await this.prisma.payment.findMany({
          include: { Student: true },
          orderBy: { createdAt: 'desc' },
        });
        return {
          sheetName: 'payments',
          rows: payments.map((p) => ({
            id: p.id,
            studentName: p.Student ? `${p.Student.firstName} ${p.Student.lastName}` : null,
            amount: p.amount,
            method: p.method,
            status: p.status,
            receivedDate: p.receivedDate,
            paymentNumber: p.paymentNumber,
            notes: p.notes,
            createdAt: p.createdAt,
          })),
        };
      }

      case 'expenses': {
        const expenses = await this.prisma.expense.findMany({
          include: {
            category: true,
            instructor: {
              include: {
                user: true,
              },
            },
          },
          orderBy: { paidDate: 'desc' },
        });
        return {
          sheetName: 'expenses',
          rows: expenses.map((e) => ({
            id: e.id,
            category: e.category?.name || null,
            amount: e.amount,
            description: e.notes || null,
            instructor: e.instructor?.user
              ? `${e.instructor.user.firstName} ${e.instructor.user.lastName}`
              : null,
            paidDate: e.paidDate,
            createdAt: e.createdAt,
          })),
        };
      }

      case 'leads': {
        const leads = await this.prisma.lead.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        });
        return {
          sheetName: 'leads',
          rows: leads.map((l) => ({
            id: l.id,
            firstName: l.firstName,
            lastName: l.lastName,
            phone: l.phone,
            email: l.email,
            source: l.source,
            status: l.status,
            interestedIn: l.interestedIn,
            notes: l.notes,
            createdAt: l.createdAt,
          })),
        };
      }

      case 'instructors': {
        const instructors = await this.prisma.instructor.findMany({
          where: { deletedAt: null },
          include: { user: true, _count: { select: { classes: true, sessions: true } } },
          orderBy: { createdAt: 'desc' },
        });
        return {
          sheetName: 'instructors',
          rows: instructors.map((i) => ({
            id: i.id,
            name: `${i.user.firstName} ${i.user.lastName}`,
            email: i.user.email,
            costType: i.costType,
            costAmount: i.costAmount,
            classesCount: (i as any)._count?.classes ?? 0,
            sessionsCount: (i as any)._count?.sessions ?? 0,
            createdAt: i.createdAt,
          })),
        };
      }

      case 'sessions': {
        const sessions = await this.prisma.session.findMany({
          where: { deletedAt: null },
          include: { class: true, instructor: { include: { user: true } } },
          orderBy: { scheduledDate: 'desc' },
          take: 5000,
        });
        return {
          sheetName: 'sessions',
          rows: sessions.map((s) => ({
            id: s.id,
            className: s.class?.name,
            location: s.class?.location,
            scheduledDate: s.scheduledDate,
            startTime: s.startTime,
            endTime: s.endTime,
            status: s.status,
            instructor: s.instructor?.user
              ? `${s.instructor.user.firstName} ${s.instructor.user.lastName}`
              : null,
            createdAt: s.createdAt,
          })),
        };
      }

      default:
        throw new BadRequestException(
          `Unknown export entity: ${entityRaw}. Allowed: students, classes, payments, expenses, leads, instructors, sessions`,
        );
    }
  }
}


