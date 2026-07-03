import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RenewalsService } from './renewals.service';
import { OpsWorkflowsService } from './ops-workflows.service';
import { PortfolioService } from './portfolio.service';
import { RenewalStage, ChurnReason, SlotRequestStatus, Location, PortfolioItemType } from '@prisma/client';

@Controller('renewals')
@UseGuards(JwtAuthGuard)
export class RenewalsController {
  constructor(private renewals: RenewalsService) {}

  @Get() list(@Query('stage') stage?: RenewalStage) { return this.renewals.list(stage); }
  @Get('kpis') kpis() { return this.renewals.kpis(); }
  @Get('win-back') winBack(@Query('year') year: string, @Query('month') month: string) {
    return this.renewals.winBack(Number(year), Number(month));
  }
  @Post('scan') scan() { return this.renewals.dailyScan(); }
  @Patch(':id/stage') setStage(
    @Param('id') id: string,
    @Body() dto: { stage: RenewalStage; churnReason?: ChurnReason; churnNotes?: string },
    @Request() req: any,
  ) { return this.renewals.setStage(id, dto, req.user?.userId ?? req.user?.id); }
  @Post(':id/renewed') renewed(@Param('id') id: string, @Body() dto: { invoiceId: string }, @Request() req: any) {
    return this.renewals.markRenewed(id, dto.invoiceId, req.user?.userId ?? req.user?.id);
  }
  @Patch(':id/recommendation') recommend(@Param('id') id: string, @Body() dto: { recommendation: string }) {
    return this.renewals.setRecommendation(id, dto.recommendation);
  }
}

@Controller('slot-requests')
@UseGuards(JwtAuthGuard)
export class SlotRequestsController {
  constructor(private ops: OpsWorkflowsService) {}

  @Post() create(
    @Body() dto: { parentId?: string; studentId?: string; courseId: string; courseLevelId?: string; preferredDay?: number; timeWindow?: string; location?: Location; notes?: string },
    @Request() req: any,
  ) { return this.ops.createSlotRequest(dto, req.user?.userId ?? req.user?.id); }
  @Get() list(@Query('status') status?: SlotRequestStatus) { return this.ops.listSlotRequests(status); }
  @Get('demand') demand() { return this.ops.demand(); }
  @Post('match') match(@Body() dto: { classId: string; requestIds: string[] }, @Request() req: any) {
    return this.ops.matchSlotRequests(dto.classId, dto.requestIds, req.user?.userId ?? req.user?.id);
  }
}

@Controller('ops')
@UseGuards(JwtAuthGuard)
export class OpsAuditsController {
  constructor(private ops: OpsWorkflowsService) {}

  @Get('audits') flags(@Query('status') status?: 'open' | 'resolved') { return this.ops.listFlags(status); }
  @Post('audits/run') run() { return this.ops.runAudits(); }
  @Patch('audits/:id/resolve') resolve(@Param('id') id: string, @Body() dto: { note: string }, @Request() req: any) {
    return this.ops.resolveFlag(id, dto.note, req.user?.userId ?? req.user?.id);
  }
  @Post('enrollments/:id/onboard') onboard(@Param('id') id: string, @Request() req: any) {
    return this.ops.onboard(id, req.user?.userId ?? req.user?.id);
  }
}

@Controller('portfolio')
@UseGuards(JwtAuthGuard)
export class PortfolioController {
  constructor(private portfolio: PortfolioService) {}

  @Get('reports') reports(@Query('status') status?: 'draft' | 'approved' | 'published') {
    return this.portfolio.listReports(status);
  }
  @Post('reports') createReport(
    @Body() dto: { enrollmentId: string; milestone: number; content: string; strengths?: string; nextFocus?: string },
    @Request() req: any,
  ) { return this.portfolio.createReport(dto, req.user?.userId ?? req.user?.id); }
  @Post('reports/:id/approve') approve(@Param('id') id: string, @Request() req: any) {
    return this.portfolio.approveReport(id, req.user?.userId ?? req.user?.id);
  }
  @Post('reports/:id/publish') publish(@Param('id') id: string) { return this.portfolio.publishReport(id); }
  @Post('items') addItem(
    @Body() dto: { studentId: string; type: PortfolioItemType; url?: string; caption?: string },
    @Request() req: any,
  ) { return this.portfolio.addItem(dto, req.user?.userId ?? req.user?.id); }
  @Get('student/:studentId') get(@Param('studentId') studentId: string) {
    return this.portfolio.getPortfolio(studentId);
  }
}
