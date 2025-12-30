import { Controller, Post, Get, UseGuards, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { SchedulerService } from './scheduler.service';

@Controller('scheduler')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post('test/payment-due-reminders')
  @Roles(UserRole.super_admin)
  async testPaymentDueReminders() {
    await this.schedulerService.handlePaymentDueReminders();
    return {
      success: true,
      message: 'Payment due reminders task executed. Check logs for details.',
      timestamp: new Date().toISOString(),
      timezone: 'Africa/Cairo',
    };
  }

  @Post('test/overdue-payment-reminders')
  @Roles(UserRole.super_admin)
  async testOverduePaymentReminders() {
    await this.schedulerService.handleOverduePaymentReminders();
    return {
      success: true,
      message: 'Overdue payment reminders task executed. Check logs for details.',
      timestamp: new Date().toISOString(),
      timezone: 'Africa/Cairo',
    };
  }

  @Post('test/session-reminders')
  @Roles(UserRole.super_admin)
  async testSessionReminders() {
    await this.schedulerService.handleSessionReminders();
    return {
      success: true,
      message: 'Session reminders task executed. Check logs for details.',
      timestamp: new Date().toISOString(),
      timezone: 'Africa/Cairo',
    };
  }

  @Get('status')
  @Roles(UserRole.super_admin)
  getStatus() {
    const now = new Date();
    const cairoTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Cairo' }));
    
    return {
      serverTime: now.toISOString(),
      cairoTime: cairoTime.toISOString(),
      cairoTimeFormatted: cairoTime.toLocaleString('en-US', {
        timeZone: 'Africa/Cairo',
        dateStyle: 'full',
        timeStyle: 'long',
      }),
      timezone: 'Africa/Cairo',
      scheduledTasks: {
        paymentDueReminders: {
          schedule: 'Daily at 9:00 AM (Cairo time)',
          cron: '0 9 * * *',
        },
        overduePaymentReminders: {
          schedule: 'Daily at 10:00 AM (Cairo time)',
          cron: '0 10 * * *',
        },
        sessionReminders: {
          schedule: 'Every hour (Cairo time)',
          cron: '0 * * * *',
        },
        scheduledNotifications: {
          schedule: 'Every minute (Cairo time)',
          cron: '* * * * *',
        },
      },
    };
  }

  @Post('schedule-sms')
  @Roles(UserRole.super_admin)
  async scheduleSms(@Body() body: { mobile: string; message: string; scheduledAt: string }) {
    const scheduledAt = new Date(body.scheduledAt);
    
    if (isNaN(scheduledAt.getTime())) {
      throw new Error('Invalid scheduledAt date');
    }

    if (scheduledAt <= new Date()) {
      throw new Error('Scheduled time must be in the future');
    }

    const notification = await this.schedulerService.scheduleMessage(
      'sms',
      body.mobile,
      body.message,
      scheduledAt,
    );

    return {
      success: true,
      message: 'SMS scheduled successfully',
      notificationId: notification.id,
      scheduledAt: notification.scheduledAt,
    };
  }

  @Post('cleanup-stuck-notifications')
  @Roles(UserRole.super_admin)
  async cleanupStuckNotifications() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const result = await this.schedulerService['prisma'].notification.updateMany({
      where: {
        status: 'pending',
        scheduledAt: {
          not: null,
          lte: now,
        },
        createdAt: {
          lt: oneHourAgo,
        },
      },
      data: {
        status: 'failed',
        errorMessage: 'Notification was stuck in pending status - cleaned up',
        scheduledAt: null,
      },
    });

    return {
      success: true,
      message: `Cleaned up ${result.count} stuck notifications`,
      count: result.count,
    };
  }
}

