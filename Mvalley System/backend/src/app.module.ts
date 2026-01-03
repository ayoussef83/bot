import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { ClassesModule } from './classes/classes.module';
import { InstructorsModule } from './instructors/instructors.module';
import { FinanceModule } from './finance/finance.module';
import { SalesModule } from './sales/sales.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthController } from './health/health.controller';
import { ExportsModule } from './exports/exports.module';
import { SettingsModule } from './settings/settings.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { MarketingModule } from './marketing/marketing.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ParentsModule } from './parents/parents.module';
import { CoursesModule } from './courses/courses.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    StudentsModule,
    ClassesModule,
    CoursesModule,
    InstructorsModule,
    FinanceModule,
    SalesModule,
    NotificationsModule,
    DashboardModule,
    ExportsModule,
    SettingsModule,
    SchedulerModule,
    MarketingModule,
    WebhooksModule,
    ParentsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

