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
    // This will throw if DB is unreachable or schema is broken badly.
    await this.prisma.$queryRaw`SELECT 1`;

    // Best-effort: show last applied migration
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
      // _prisma_migrations may not exist on very old DBs; ignore.
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




