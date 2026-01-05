import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { InstructorsService } from './instructors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CreateInstructorAvailabilityDto, CreateInstructorDto, UpdateInstructorDto } from './dto';
import { PayrollService } from '../payroll/payroll.service';

@Controller('instructors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InstructorsController {
  constructor(
    private readonly instructorsService: InstructorsService,
    private readonly payrollService: PayrollService,
  ) {}

  @Post()
  @Roles(UserRole.super_admin, UserRole.operations)
  create(
    @Body() createInstructorDto: CreateInstructorDto,
    @CurrentUser() user: any,
  ) {
    return this.instructorsService.create(createInstructorDto, user.id);
  }

  @Get()
  @Roles(
    UserRole.super_admin,
    UserRole.management,
    UserRole.operations,
    UserRole.accounting,
  )
  findAll() {
    return this.instructorsService.findAll();
  }

  @Get(':id')
  @Roles(
    UserRole.super_admin,
    UserRole.management,
    UserRole.operations,
    UserRole.accounting,
    UserRole.instructor,
  )
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.instructorsService.findOneForUser(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.super_admin, UserRole.operations, UserRole.hr, UserRole.accounting)
  update(
    @Param('id') id: string,
    @Body() updateInstructorDto: UpdateInstructorDto,
    @CurrentUser() user: any,
  ) {
    return this.instructorsService.update(id, updateInstructorDto, user.id);
  }

  @Post(':id/availability')
  @Roles(UserRole.super_admin, UserRole.operations)
  addAvailability(
    @Param('id') id: string,
    @Body() dto: CreateInstructorAvailabilityDto,
    @CurrentUser() user: any,
  ) {
    return this.instructorsService.addAvailability(id, dto, user.id);
  }

  @Get(':id/payroll')
  @Roles(
    UserRole.super_admin,
    UserRole.management,
    UserRole.accounting,
    UserRole.operations,
    UserRole.instructor,
  )
  listPayroll(@Param('id') id: string, @CurrentUser() user: any) {
    return this.payrollService.listInstructorPayroll(id, user);
  }

  @Delete(':id')
  @Roles(UserRole.super_admin)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.instructorsService.remove(id, user.id);
  }
}

