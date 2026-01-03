import { Controller, Get, Post, Body, Param, Put, UseGuards } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('finance/invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles('super_admin', 'accounting')
  async create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Get()
  @Roles('super_admin', 'management', 'accounting', 'operations')
  async findAll() {
    return this.invoicesService.findAll();
  }

  @Get('student/:studentId')
  @Roles('super_admin', 'management', 'accounting', 'operations')
  async findByStudent(@Param('studentId') studentId: string) {
    return this.invoicesService.findByStudent(studentId);
  }

  @Get(':id')
  @Roles('super_admin', 'management', 'accounting', 'operations')
  async findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Put(':id/status')
  @Roles('super_admin', 'accounting')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.invoicesService.updateStatus(id, body.status);
  }

  @Put(':id/cancel')
  @Roles('super_admin', 'accounting')
  async cancel(@Param('id') id: string) {
    return this.invoicesService.cancel(id);
  }
}







