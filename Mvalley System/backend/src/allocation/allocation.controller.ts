import { All, GoneException, Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('allocation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AllocationController {
  // This endpoint family is deprecated. MV-OS allocation is TeachingSlot-driven:
  // Ops defines TeachingSlots (capacity), Sales creates/fills Classes inside slots, and the system validates profitability before confirmation.
  // Use /teaching-slots and /classes/from-teaching-slot instead.
  constructor() {}

  // Intentionally no methods: any existing calls should be migrated.
  // If a client calls an old path, respond with 410 Gone via global route handler at gateway level.
  // (Keeping controller to preserve module wiring/backward compatibility in deployments.)
  @All('*')
  deprecated() {
    throw new GoneException('Deprecated allocation API. Use TeachingSlot-driven flow: /teaching-slots and /classes/from-teaching-slot.');
  }
}


