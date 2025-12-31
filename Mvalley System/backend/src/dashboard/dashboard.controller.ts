import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('management')
  @Roles(UserRole.super_admin, UserRole.management)
  getManagementDashboard() {
    return this.dashboardService.getManagementDashboard();
  }

  @Get('ops')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations)
  getOpsDashboard() {
    return this.dashboardService.getOpsDashboard();
  }

  @Get('accounting')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.accounting)
  getAccountingDashboard() {
    return this.dashboardService.getAccountingDashboard();
  }

  @Get('instructor')
  @Roles(UserRole.instructor)
  async getInstructorDashboard(@CurrentUser() user: any) {
    // Get instructor ID from user relation
    const instructor = await this.prisma.instructor.findUnique({
      where: { userId: user.id },
    });
    if (!instructor) {
      return { error: 'Instructor profile not found' };
    }
    return this.dashboardService.getInstructorDashboard(instructor.id);
  }
}

