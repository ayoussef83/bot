import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Param,
} from '@nestjs/common';
import { SnapshotsService } from './snapshots.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { GenerateSnapshotDto } from './dto';

@Controller('snapshots')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SnapshotsController {
  constructor(private readonly snapshotsService: SnapshotsService) {}

  @Post('generate')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.accounting)
  generate(@Body() generateSnapshotDto: GenerateSnapshotDto) {
    return this.snapshotsService.generateSnapshot(
      generateSnapshotDto.year,
      generateSnapshotDto.month,
    );
  }

  @Get()
  @Roles(UserRole.super_admin, UserRole.management, UserRole.accounting)
  findAll(@Query('year') year?: number) {
    return this.snapshotsService.getAllSnapshots(year ? Number(year) : undefined);
  }

  @Get(':year/:month')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.accounting)
  findOne(@Param('year') year: string, @Param('month') month: string) {
    return this.snapshotsService.getSnapshot(Number(year), Number(month));
  }
}

