import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreatePaymentAllocationDto } from './dto/create-payment-allocation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('finance/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles('super_admin', 'accounting')
  async create(@Body() createPaymentDto: CreatePaymentDto, @Request() req) {
    return this.paymentsService.create(createPaymentDto, req.user?.userId);
  }

  @Get()
  @Roles('super_admin', 'management', 'accounting', 'operations')
  async findAll() {
    return this.paymentsService.findAll();
  }

  @Get(':id')
  @Roles('super_admin', 'management', 'accounting', 'operations')
  async findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Post('allocations')
  @Roles('super_admin', 'accounting')
  async createAllocation(@Body() createAllocationDto: CreatePaymentAllocationDto, @Request() req) {
    return this.paymentsService.createAllocation(createAllocationDto, req.user?.userId);
  }

  @Post(':id/reverse')
  @Roles('super_admin', 'accounting')
  async reverse(@Param('id') id: string, @Body() body: { reason: string }, @Request() req) {
    return this.paymentsService.reverse(id, body.reason, req.user?.userId);
  }
}
