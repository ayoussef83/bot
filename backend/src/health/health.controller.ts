import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'mv-os-backend',
    };
  }

  @Get('db')
  async db() {
    const startedAt = Date.now();
    await this.prisma.$queryRaw`SELECT 1`;

    let lastMigration: any = null;
    try {
      const rows: any[] = await this.prisma.$queryRaw`
        SELECT migration_name, finished_at
        FROM _prisma_migrations
        WHERE finished_at IS NOT NULL
        ORDER BY finished_at DESC
        LIMIT 1
      `;
      lastMigration = rows?.[0] || null;
    } catch {
      // ignore
    }

    return {
      status: 'ok',
      db: 'ok',
      latencyMs: Date.now() - startedAt,
      lastMigration,
      timestamp: new Date().toISOString(),
    };
  }
}







