import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';

@Controller('payroll')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('generate')
  @Roles(UserRole.super_admin, UserRole.accounting)
  generate(@Body() dto: GeneratePayrollDto, @CurrentUser() user: any) {
    return this.payrollService.generate(dto, user.id);
  }

  @Get('instructor/:id')
  @Roles(
    UserRole.super_admin,
    UserRole.management,
    UserRole.accounting,
    UserRole.operations,
    UserRole.instructor,
  )
  listInstructorPayroll(@Param('id') id: string, @CurrentUser() user: any) {
    return this.payrollService.listInstructorPayroll(id, user);
  }
}


