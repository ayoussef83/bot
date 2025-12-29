import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CreatePaymentDto, UpdatePaymentDto } from './dto';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles(UserRole.super_admin, UserRole.accounting)
  create(@Body() createPaymentDto: CreatePaymentDto, @CurrentUser() user: any) {
    return this.paymentsService.create(createPaymentDto, user.id);
  }

  @Get()
  @Roles(
    UserRole.super_admin,
    UserRole.management,
    UserRole.accounting,
  )
  findAll(
    @Query('studentId') studentId?: string,
    @Query('status') status?: string,
  ) {
    return this.paymentsService.findAll(studentId, status);
  }

  @Get('outstanding')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.accounting)
  getOutstandingBalances() {
    return this.paymentsService.getOutstandingBalances();
  }

  @Get('student/:studentId/summary')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.accounting)
  getStudentSummary(@Param('studentId') studentId: string) {
    return this.paymentsService.getStudentSummary(studentId);
  }

  @Get(':id')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.accounting)
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.super_admin, UserRole.accounting)
  update(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.update(id, updatePaymentDto, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.super_admin)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.paymentsService.remove(id, user.id);
  }
}

