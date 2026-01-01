import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { BankSyncService } from './bank-sync.service';
import { ManualBankBalanceDto } from './dto';
import { Request } from 'express';

@Controller('finance/bank-sync')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BankSyncController {
  constructor(private readonly bankSyncService: BankSyncService) {}

  @Post('manual')
  @Roles('super_admin', 'accounting')
  async manual(@Body() dto: ManualBankBalanceDto, @Req() req: Request) {
    const createdBy = (req as any)?.user?.sub || (req as any)?.user?.userId;
    const asOfDate = dto.asOfDate ? new Date(dto.asOfDate) : undefined;
    return this.bankSyncService.setManualBalance({
      cashAccountId: dto.cashAccountId,
      balance: dto.balance,
      asOfDate,
      notes: dto.notes,
      createdBy,
    });
  }

  @Post('upload')
  @Roles('super_admin', 'accounting')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: any,
    @Body('cashAccountId') cashAccountId: string,
    @Body('asOfDate') asOfDateStr: string | undefined,
    @Body('notes') notes: string | undefined,
    @Req() req: Request,
  ) {
    if (!cashAccountId) throw new BadRequestException('cashAccountId is required');
    if (!file?.buffer) throw new BadRequestException('CSV file is required');

    const createdBy = (req as any)?.user?.sub || (req as any)?.user?.userId;
    const asOfDate =
      asOfDateStr && String(asOfDateStr).trim() ? new Date(String(asOfDateStr).trim()) : undefined;
    const csvText = file.buffer.toString('utf-8');

    return this.bankSyncService.uploadCsv({
      cashAccountId,
      fileName: file.originalname,
      csvText,
      asOfDate,
      notes,
      createdBy,
    });
  }

  @Get('runs')
  @Roles('super_admin', 'management', 'accounting', 'operations')
  async runs(@Query('cashAccountId') cashAccountId?: string) {
    return this.bankSyncService.listRuns(cashAccountId);
  }
}


