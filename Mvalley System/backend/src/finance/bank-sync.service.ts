import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BankSyncSource, CashAccountType } from '@prisma/client';

function normalizeHeader(s: string) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[_-]+/g, ' ');
}

function parseNumberLoose(v: string): number | null {
  const raw = String(v || '').trim();
  if (!raw) return null;
  // Remove currency symbols and spaces, keep digits, dot, comma, minus
  const cleaned = raw.replace(/[^\d,.\-]/g, '');
  if (!cleaned) return null;
  // If both comma and dot exist, assume comma is thousands separator -> remove commas
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');
  const normalized = hasComma && hasDot ? cleaned.replace(/,/g, '') : cleaned.replace(/,/g, '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function detectDelimiter(line: string): ',' | ';' | '\t' {
  const comma = (line.match(/,/g) || []).length;
  const semi = (line.match(/;/g) || []).length;
  const tab = (line.match(/\t/g) || []).length;
  if (tab >= comma && tab >= semi && tab > 0) return '\t';
  if (semi > comma) return ';';
  return ',';
}

// Minimal CSV parser with quoted fields support (no multiline quotes).
function parseCsv(text: string): string[][] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const delim = detectDelimiter(lines[0]);
  const rows: string[][] = [];

  for (const line of lines) {
    const row: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        // escaped quote
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
          continue;
        }
        inQuotes = !inQuotes;
        continue;
      }
      if (!inQuotes && ch === delim) {
        row.push(cur);
        cur = '';
        continue;
      }
      cur += ch;
    }
    row.push(cur);
    rows.push(row.map((c) => c.trim()));
  }

  return rows;
}

@Injectable()
export class BankSyncService {
  constructor(private readonly prisma: PrismaService) {}

  async setManualBalance(params: {
    cashAccountId: string;
    balance: number;
    asOfDate?: Date;
    notes?: string;
    createdBy?: string;
  }) {
    const acc = await this.prisma.cashAccount.findUnique({ where: { id: params.cashAccountId } });
    if (!acc) throw new NotFoundException('Cash account not found');
    if (acc.type !== CashAccountType.bank) {
      throw new BadRequestException('Bank sync is only available for cash accounts of type "bank"');
    }

    const asOfDate = params.asOfDate ?? new Date();
    const endingBalance = params.balance;

    const run = await this.prisma.bankSyncRun.create({
      data: {
        cashAccountId: acc.id,
        source: BankSyncSource.manual,
        asOfDate,
        endingBalance,
        notes: params.notes,
        createdBy: params.createdBy,
      },
    });

    const updated = await this.prisma.cashAccount.update({
      where: { id: acc.id },
      data: { balance: endingBalance },
    });

    return { cashAccount: updated, run };
  }

  async uploadCsv(params: {
    cashAccountId: string;
    fileName?: string;
    csvText: string;
    asOfDate?: Date;
    notes?: string;
    createdBy?: string;
  }) {
    const acc = await this.prisma.cashAccount.findUnique({ where: { id: params.cashAccountId } });
    if (!acc) throw new NotFoundException('Cash account not found');
    if (acc.type !== CashAccountType.bank) {
      throw new BadRequestException('Bank sync is only available for cash accounts of type "bank"');
    }

    const rows = parseCsv(params.csvText);
    if (rows.length < 2) {
      throw new BadRequestException('CSV appears empty or missing header row');
    }

    const header = rows[0].map(normalizeHeader);
    let effectiveBalanceIdx = header.findIndex((h) => h === 'balance');
    if (effectiveBalanceIdx === -1) effectiveBalanceIdx = header.findIndex((h) => h === 'ending balance');
    if (effectiveBalanceIdx === -1) {
      throw new BadRequestException(
        'CSV must include a Balance column (header "Balance"). If you share a sample header row, we can support your exact CIB export format.',
      );
    }

    let endingBalance: number | null = null;
    for (let i = rows.length - 1; i >= 1; i--) {
      const v = rows[i]?.[effectiveBalanceIdx];
      const n = parseNumberLoose(v || '');
      if (n !== null) {
        endingBalance = n;
        break;
      }
    }
    if (endingBalance === null) {
      throw new BadRequestException('Could not find a numeric ending balance in the Balance column');
    }

    const asOfDate = params.asOfDate ?? new Date();

    const run = await this.prisma.bankSyncRun.create({
      data: {
        cashAccountId: acc.id,
        source: BankSyncSource.csv_upload,
        asOfDate,
        endingBalance,
        fileName: params.fileName,
        rowCount: Math.max(0, rows.length - 1),
        notes: params.notes,
        createdBy: params.createdBy,
      },
    });

    const updated = await this.prisma.cashAccount.update({
      where: { id: acc.id },
      data: { balance: endingBalance },
    });

    return { cashAccount: updated, run };
  }

  async listRuns(cashAccountId?: string) {
    return this.prisma.bankSyncRun.findMany({
      where: cashAccountId ? { cashAccountId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}


