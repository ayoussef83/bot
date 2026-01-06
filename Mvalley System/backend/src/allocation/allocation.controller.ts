import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { AllocationService } from './allocation.service';
import { ConfirmCandidateGroupDto, CreateAllocationRunDto, UpdateCandidateGroupStatusDto } from './dto';

@Controller('allocation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AllocationController {
  constructor(private readonly allocationService: AllocationService) {}

  @Post('runs')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations)
  createRun(@Body() dto: CreateAllocationRunDto, @CurrentUser() user: any) {
    return this.allocationService.createRun(dto, user.id);
  }

  @Get('runs')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations)
  listRuns() {
    return this.allocationService.listRuns();
  }

  @Get('runs/:id')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations)
  getRun(@Param('id') id: string) {
    return this.allocationService.getRun(id);
  }

  @Get('runs/:id/candidate-groups')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations)
  listCandidateGroups(@Param('id') id: string) {
    return this.allocationService.listCandidateGroups(id);
  }

  @Get('candidate-groups/:id')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations)
  getCandidateGroup(@Param('id') id: string) {
    return this.allocationService.getCandidateGroup(id);
  }

  @Patch('candidate-groups/:id/status')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations)
  updateCandidateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCandidateGroupStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.allocationService.updateCandidateStatus(id, dto.action, dto.reason, user.id);
  }

  @Post('candidate-groups/:id/confirm')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations)
  confirmCandidateGroup(
    @Param('id') id: string,
    @Body() dto: ConfirmCandidateGroupDto,
    @CurrentUser() user: any,
  ) {
    return this.allocationService.confirmCandidateGroup(id, dto, user.id);
  }
}


