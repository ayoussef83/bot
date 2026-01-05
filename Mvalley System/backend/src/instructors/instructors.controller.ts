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
import {
  CreateInstructorAvailabilityDto,
  CreateInstructorCostModelDto,
  CreateInstructorDto,
  UpdateInstructorAvailabilityDto,
  UpdateInstructorCostModelDto,
  UpdateInstructorDto,
} from './dto';
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

  @Get(':id/availability')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.operations, UserRole.instructor)
  listAvailability(@Param('id') id: string, @CurrentUser() user: any) {
    return this.instructorsService.listAvailability(id, user);
  }

  @Patch('availability/:availabilityId')
  @Roles(UserRole.super_admin, UserRole.operations)
  updateAvailability(
    @Param('availabilityId') availabilityId: string,
    @Body() dto: UpdateInstructorAvailabilityDto,
    @CurrentUser() user: any,
  ) {
    return this.instructorsService.updateAvailability(availabilityId, dto, user.id);
  }

  @Delete('availability/:availabilityId')
  @Roles(UserRole.super_admin, UserRole.operations)
  deleteAvailability(@Param('availabilityId') availabilityId: string, @CurrentUser() user: any) {
    return this.instructorsService.deleteAvailability(availabilityId, user.id);
  }

  @Get(':id/cost-models')
  @Roles(UserRole.super_admin, UserRole.management, UserRole.accounting, UserRole.instructor)
  listCostModels(@Param('id') id: string, @CurrentUser() user: any) {
    return this.instructorsService.listCostModels(id, user);
  }

  @Post(':id/cost-models')
  @Roles(UserRole.super_admin, UserRole.accounting)
  createCostModel(@Param('id') id: string, @Body() dto: CreateInstructorCostModelDto, @CurrentUser() user: any) {
    return this.instructorsService.createCostModel(id, dto, user.id);
  }

  @Patch('cost-models/:costModelId')
  @Roles(UserRole.super_admin, UserRole.accounting)
  updateCostModel(@Param('costModelId') costModelId: string, @Body() dto: UpdateInstructorCostModelDto, @CurrentUser() user: any) {
    return this.instructorsService.updateCostModel(costModelId, dto, user.id);
  }

  @Delete('cost-models/:costModelId')
  @Roles(UserRole.super_admin, UserRole.accounting)
  deleteCostModel(@Param('costModelId') costModelId: string, @CurrentUser() user: any) {
    return this.instructorsService.deleteCostModel(costModelId, user.id);
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

