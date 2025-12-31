import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ExportsService } from './exports.service';

type ExportFormat = 'xlsx' | 'pdf';

@Controller('exports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get(':entity')
  @Roles(
    UserRole.super_admin,
    UserRole.management,
    UserRole.operations,
    UserRole.accounting,
    UserRole.sales,
  )
  async exportEntity(
    @Param('entity') entity: string,
    @Query('format') format: ExportFormat = 'xlsx',
    @Res() res: Response,
  ) {
    const safeFormat: ExportFormat = format === 'pdf' ? 'pdf' : 'xlsx';

    const { filename, mimeType, buffer } = await this.exportsService.exportEntity(
      entity,
      safeFormat,
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}


