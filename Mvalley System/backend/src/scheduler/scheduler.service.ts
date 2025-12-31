import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SettingsService } from '../settings/settings.service';
import { EmailService } from '../notifications/email.service';
import { SmsService } from '../notifications/sms.service';
import { WhatsAppService } from '../notifications/whatsapp.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private settingsService: SettingsService,
    private emailService: EmailService,
    private smsService: SmsService,
    private whatsappService: WhatsAppService,
  ) {}

  /**
   * Check for invoices due in 3 days and send reminders
   * Runs daily at 9:00 AM
   */
  @Cron('0 9 * * *', {
    name: 'payment-due-reminders',
    timeZone: 'Africa/Cairo',
  })
  async handlePaymentDueReminders() {
    this.logger.log('Running invoice due reminders check...');

    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      threeDaysFromNow.setHours(23, 59, 59, 999);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find invoices due in 3 days that are not fully paid/cancelled
      const invoicesDue = await this.prisma.invoice.findMany({
        where: {
          dueDate: {
            gte: today,
            lte: threeDaysFromNow,
          },
          status: {
            in: ['issued', 'partially_paid', 'overdue'],
          },
        },
        include: {
          student: {
            include: {
              parent: true,
            },
          },
          paymentAllocations: true,
        },
      });

      this.logger.log(`Found ${invoicesDue.length} invoices due in 3 days`);

      for (const invoice of invoicesDue) {
        const paidAmount = invoice.paymentAllocations.reduce((sum, a) => sum + a.amount, 0);
        const remaining = Math.max(0, invoice.totalAmount - paidAmount);
        if (remaining <= 0) continue;

        // Check if we already sent a reminder for this invoice
        const existingNotification = await this.prisma.notification.findFirst({
          where: {
            template: 'payment_due_reminder',
            payload: JSON.stringify({ invoiceId: invoice.id }),
            status: 'sent',
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        });

        if (existingNotification) {
          this.logger.debug(`Reminder already sent for invoice ${invoice.id}`);
          continue;
        }

        // Get recipient (student or parent)
        const recipient = invoice.student?.parent?.phone || invoice.student?.phone;
        const recipientEmail = invoice.student?.parent?.email || invoice.student?.email;

        if (!recipient && !recipientEmail) {
          this.logger.warn(`No contact info for invoice ${invoice.id}`);
          continue;
        }

        // Get message template
        let template = await this.prisma.messageTemplate.findFirst({
          where: {
            channel: 'sms',
            key: 'payment_due_reminder',
            deletedAt: null,
          },
        });

        if (!template || !template.isActive) {
          // Fallback message
          const daysUntilDue = Math.ceil(
            (invoice.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          );
          const message = `Reminder: Invoice of EGP ${remaining} is due in ${daysUntilDue} day(s). Please settle to avoid service interruption.`;
          
          if (recipient) {
            this.logger.log(`Sending SMS to ${recipient} for invoice ${invoice.id}`);
            try {
              await this.notificationsService.sendMessage({
                channel: 'sms',
                recipient,
                message,
                template: 'payment_due_reminder',
                payload: { invoiceId: invoice.id, amount: remaining, dueDate: invoice.dueDate },
                studentId: invoice.studentId || undefined,
              });
              this.logger.log(`✅ SMS sent successfully to ${recipient} for invoice ${invoice.id}`);
            } catch (error: any) {
              this.logger.error(`❌ Failed to send SMS to ${recipient} for invoice ${invoice.id}: ${error.message}`);
            }
          }

          if (recipientEmail) {
            const emailTemplate = await this.prisma.messageTemplate.findFirst({
              where: {
                channel: 'email',
                key: 'payment_due_reminder',
                deletedAt: null,
              },
            });

            const emailSubject = emailTemplate?.subject || 'Payment Due Reminder';
            const emailBody = emailTemplate?.body || message;

            await this.notificationsService.sendMessage({
              channel: 'email',
              recipient: recipientEmail,
              subject: emailSubject,
              message: emailBody,
              template: 'payment_due_reminder',
              payload: { invoiceId: invoice.id, amount: remaining, dueDate: invoice.dueDate },
              studentId: invoice.studentId || undefined,
            });
          }
        } else {
          // Use template with variable substitution
          let message = template.body;
          const daysUntilDue = Math.ceil(
            (invoice.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          );
          
          // Simple variable replacement
          message = message.replace(/\{\{amount\}\}/g, remaining.toString());
          message = message.replace(/\{\{days\}\}/g, daysUntilDue.toString());
          message = message.replace(/\{\{studentName\}\}/g, 
            invoice.student ? `${invoice.student.firstName} ${invoice.student.lastName}` : 'Student'
          );

          if (recipient) {
            this.logger.log(`Sending SMS to ${recipient} for invoice ${invoice.id}`);
            try {
              await this.notificationsService.sendMessage({
                channel: 'sms',
                recipient,
                message,
                template: 'payment_due_reminder',
                payload: { invoiceId: invoice.id, amount: remaining, dueDate: invoice.dueDate },
                studentId: invoice.studentId || undefined,
              });
              this.logger.log(`✅ SMS sent successfully to ${recipient} for invoice ${invoice.id}`);
            } catch (error: any) {
              this.logger.error(`❌ Failed to send SMS to ${recipient} for invoice ${invoice.id}: ${error.message}`);
            }
          }

          if (recipientEmail) {
            const emailTemplate = await this.prisma.messageTemplate.findUnique({
              where: {
                channel_key: {
                  channel: 'email',
                  key: 'payment_due_reminder',
                },
              },
            });

            const emailSubject = emailTemplate?.subject || 'Payment Due Reminder';
            let emailBody = emailTemplate?.body || message;
            emailBody = emailBody.replace(/\{\{amount\}\}/g, remaining.toString());
            emailBody = emailBody.replace(/\{\{days\}\}/g, daysUntilDue.toString());
            emailBody = emailBody.replace(/\{\{studentName\}\}/g,
              invoice.student ? `${invoice.student.firstName} ${invoice.student.lastName}` : 'Student'
            );

            await this.notificationsService.sendMessage({
              channel: 'email',
              recipient: recipientEmail,
              subject: emailSubject,
              message: emailBody,
              template: 'payment_due_reminder',
              payload: { invoiceId: invoice.id, amount: remaining, dueDate: invoice.dueDate },
              studentId: invoice.studentId || undefined,
            });
          }
        }
      }

      this.logger.log(`Invoice due reminders processed: ${invoicesDue.length}`);
    } catch (error) {
      this.logger.error('Error processing payment due reminders:', error);
    }
  }

  /**
   * Check for overdue invoices and send urgent reminders
   * Runs daily at 10:00 AM
   */
  @Cron('0 10 * * *', {
    name: 'overdue-payment-reminders',
    timeZone: 'Africa/Cairo',
  })
  async handleOverduePaymentReminders() {
    this.logger.log('Running overdue invoice reminders check...');

    try {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      // Find overdue invoices that are not fully paid/cancelled
      const overdueInvoices = await this.prisma.invoice.findMany({
        where: {
          dueDate: {
            lt: today,
          },
          status: {
            in: ['issued', 'partially_paid', 'overdue'],
          },
        },
        include: {
          student: {
            include: {
              parent: true,
            },
          },
          paymentAllocations: true,
        },
      });

      this.logger.log(`Found ${overdueInvoices.length} overdue invoices`);

      for (const invoice of overdueInvoices) {
        const paidAmount = invoice.paymentAllocations.reduce((sum, a) => sum + a.amount, 0);
        const remaining = Math.max(0, invoice.totalAmount - paidAmount);
        if (remaining <= 0) continue;

        // Check if we already sent an overdue reminder today
        const existingNotification = await this.prisma.notification.findFirst({
          where: {
            template: 'payment_overdue',
            payload: JSON.stringify({ invoiceId: invoice.id }),
            status: 'sent',
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        });

        if (existingNotification) {
          continue;
        }

        const recipient = invoice.student?.parent?.phone || invoice.student?.phone;
        const recipientEmail = invoice.student?.parent?.email || invoice.student?.email;

        if (!recipient && !recipientEmail) {
          continue;
        }

        const daysOverdue = Math.ceil(
          (Date.now() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        // Get template or use fallback
        let template = await this.prisma.messageTemplate.findFirst({
          where: {
            channel: 'sms',
            key: 'payment_overdue',
            deletedAt: null,
          },
        });

        const message = template?.isActive && template?.body
          ? template.body
              .replace(/\{\{amount\}\}/g, remaining.toString())
              .replace(/\{\{days\}\}/g, daysOverdue.toString())
              .replace(/\{\{studentName\}\}/g,
                invoice.student ? `${invoice.student.firstName} ${invoice.student.lastName}` : 'Student'
              )
          : `URGENT: Invoice of EGP ${remaining} is ${daysOverdue} day(s) overdue. Please settle immediately to avoid service suspension.`;

        if (recipient) {
          this.logger.log(`Sending overdue invoice SMS to ${recipient} for invoice ${invoice.id}`);
          try {
            await this.notificationsService.sendMessage({
              channel: 'sms',
              recipient,
              message,
              template: 'payment_overdue',
              payload: { invoiceId: invoice.id, amount: remaining, daysOverdue },
              studentId: invoice.studentId || undefined,
            });
            this.logger.log(`✅ Overdue invoice SMS sent successfully to ${recipient} for invoice ${invoice.id}`);
          } catch (error: any) {
            this.logger.error(`❌ Failed to send overdue invoice SMS to ${recipient} for invoice ${invoice.id}: ${error.message}`);
          }
        }

        if (recipientEmail) {
          const emailTemplate = await this.prisma.messageTemplate.findFirst({
            where: {
              channel: 'email',
              key: 'payment_overdue',
              deletedAt: null,
            },
          });

          const emailSubject = emailTemplate?.subject || 'URGENT: Payment Overdue';
          let emailBody = emailTemplate?.body || message;
          emailBody = emailBody.replace(/\{\{amount\}\}/g, remaining.toString());
          emailBody = emailBody.replace(/\{\{days\}\}/g, daysOverdue.toString());
          emailBody = emailBody.replace(/\{\{studentName\}\}/g,
            invoice.student ? `${invoice.student.firstName} ${invoice.student.lastName}` : 'Student'
          );

          await this.notificationsService.sendMessage({
            channel: 'email',
            recipient: recipientEmail,
            subject: emailSubject,
            message: emailBody,
            template: 'payment_overdue',
            payload: { invoiceId: invoice.id, amount: remaining, daysOverdue },
            studentId: invoice.studentId || undefined,
          });
        }
      }

      this.logger.log(`Overdue invoice reminders processed: ${overdueInvoices.length}`);
    } catch (error) {
      this.logger.error('Error processing overdue payment reminders:', error);
    }
  }

  /**
   * Send session reminders 24 hours before class
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'session-reminders',
    timeZone: 'Africa/Cairo',
  })
  async handleSessionReminders() {
    this.logger.log('Running session reminders check...');

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);

      const tomorrowStart = new Date();
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      tomorrowStart.setHours(0, 0, 0, 0);

      // Find sessions scheduled for tomorrow
      const upcomingSessions = await this.prisma.session.findMany({
        where: {
          scheduledDate: {
            gte: tomorrowStart,
            lte: tomorrow,
          },
          status: 'scheduled',
          deletedAt: null,
        },
        include: {
          class: {
            include: {
              students: {
                include: {
                  parent: true,
                },
              },
            },
          },
          instructor: {
            include: {
              user: true,
            },
          },
        },
      });

      this.logger.log(`Found ${upcomingSessions.length} sessions tomorrow`);

      for (const session of upcomingSessions) {
        // Send reminder to each student in the class
        for (const student of session.class.students) {
          // Check if reminder already sent
          const existingNotification = await this.prisma.notification.findFirst({
            where: {
              template: 'session_reminder',
              payload: JSON.stringify({ sessionId: session.id, studentId: student.id }),
              status: 'sent',
              createdAt: {
                gte: new Date(Date.now() - 12 * 60 * 60 * 1000), // Last 12 hours
              },
            },
          });

          if (existingNotification) {
            continue;
          }

          const recipient = student.parent?.phone || student.phone;
          const recipientEmail = student.parent?.email || student.email;

          if (!recipient && !recipientEmail) {
            continue;
          }

          // Get template
          let template = await this.prisma.messageTemplate.findFirst({
            where: {
              channel: 'sms',
              key: 'session_reminder',
              deletedAt: null,
            },
          });

          const sessionTime = new Date(session.startTime).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Africa/Cairo',
          });

          const message = template?.isActive && template?.body
            ? template.body
                .replace(/\{\{className\}\}/g, session.class.name)
                .replace(/\{\{location\}\}/g, session.class.location)
                .replace(/\{\{time\}\}/g, sessionTime)
                .replace(/\{\{studentName\}\}/g, `${student.firstName} ${student.lastName}`)
            : `Reminder: ${student.firstName} has class "${session.class.name}" tomorrow at ${sessionTime} (${session.class.location}).`;

          if (recipient) {
            this.logger.log(`Sending session reminder SMS to ${recipient} for student ${student.id}, session ${session.id}`);
            try {
              await this.notificationsService.sendMessage({
                channel: 'sms',
                recipient,
                message,
                template: 'session_reminder',
                payload: {
                  sessionId: session.id,
                  studentId: student.id,
                  className: session.class.name,
                  location: session.class.location,
                  time: sessionTime,
                },
                studentId: student.id,
                parentId: student.parentId || undefined,
              });
              this.logger.log(`✅ Session reminder SMS sent successfully to ${recipient} for session ${session.id}`);
            } catch (error: any) {
              this.logger.error(`❌ Failed to send session reminder SMS to ${recipient} for session ${session.id}: ${error.message}`);
            }
          }

          if (recipientEmail) {
            const emailTemplate = await this.prisma.messageTemplate.findFirst({
              where: {
                channel: 'email',
                key: 'session_reminder',
                deletedAt: null,
              },
            });

            const emailSubject = emailTemplate?.subject || `Class Reminder: ${session.class.name}`;
            let emailBody = emailTemplate?.body || message;
            emailBody = emailBody.replace(/\{\{className\}\}/g, session.class.name);
            emailBody = emailBody.replace(/\{\{location\}\}/g, session.class.location);
            emailBody = emailBody.replace(/\{\{time\}\}/g, sessionTime);
            emailBody = emailBody.replace(/\{\{studentName\}\}/g, `${student.firstName} ${student.lastName}`);

            await this.notificationsService.sendMessage({
              channel: 'email',
              recipient: recipientEmail,
              subject: emailSubject,
              message: emailBody,
              template: 'session_reminder',
              payload: {
                sessionId: session.id,
                studentId: student.id,
                className: session.class.name,
                location: session.class.location,
                time: sessionTime,
              },
              studentId: student.id,
              parentId: student.parentId || undefined,
            });
          }
        }
      }

      this.logger.log(`Session reminders processed for ${upcomingSessions.length} sessions`);
    } catch (error) {
      this.logger.error('Error processing session reminders:', error);
    }
  }

  /**
   * Process scheduled notifications (one-time scheduled SMS/Email)
   * Runs every minute
   */
  @Cron('* * * * *', {
    name: 'process-scheduled-notifications',
    timeZone: 'Africa/Cairo',
  })
  async handleScheduledNotifications() {
    this.logger.log('Checking for scheduled notifications...');

    try {
      const now = new Date();
      
      // Find notifications scheduled for now or in the past that are still pending
      // Exclude ones that are already sent or failed
      // Also exclude ones that have been pending for more than 1 hour (likely stuck)
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const scheduledNotifications = await this.prisma.notification.findMany({
        where: {
          status: 'pending',
          scheduledAt: {
            lte: now,
            not: null,
          },
          // Only process notifications created in the last hour to avoid processing old stuck ones
          createdAt: {
            gte: oneHourAgo,
          },
        },
        take: 50, // Process up to 50 at a time
        orderBy: {
          scheduledAt: 'asc', // Process oldest first
        },
      });

      // Clean up old stuck notifications (pending for more than 1 hour)
      const stuckCount = await this.prisma.notification.updateMany({
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
          errorMessage: 'Notification was stuck in pending status for more than 1 hour',
          scheduledAt: null, // Clear scheduledAt
        },
      });
      if (stuckCount.count > 0) {
        this.logger.warn(`Cleaned up ${stuckCount.count} stuck scheduled notifications`);
      }

      this.logger.log(`Found ${scheduledNotifications.length} scheduled notifications to process`);

      for (const notification of scheduledNotifications) {
        try {
          this.logger.log(`Processing scheduled notification ${notification.id} (${notification.channel} to ${notification.recipient})`);
          
          // Mark as sent first to prevent duplicate processing (we'll update to sent after sending)
          // Use a temporary approach: update scheduledAt to null so it won't be picked up again
          await this.prisma.notification.update({
            where: { id: notification.id },
            data: { scheduledAt: null }, // Clear scheduledAt so it won't be picked up again
          });

          // Send the notification directly (without creating a new notification record)
          let result;
          switch (notification.channel) {
            case 'email':
              result = await this.emailService.send(
                notification.recipient,
                notification.subject || '',
                notification.message,
                notification.template || undefined,
                notification.payload ? JSON.parse(notification.payload) : undefined,
              );
              break;
            case 'sms':
              result = await this.smsService.send(
                notification.recipient,
                notification.message,
                notification.template || undefined,
                notification.payload ? JSON.parse(notification.payload) : undefined,
              );
              break;
            case 'whatsapp':
              result = await this.whatsappService.send(
                notification.recipient,
                notification.message,
                notification.template || undefined,
                notification.payload ? JSON.parse(notification.payload) : undefined,
              );
              break;
            default:
              throw new Error(`Unsupported channel: ${notification.channel}`);
          }

          // Update notification status to sent
          await this.prisma.notification.update({
            where: { id: notification.id },
            data: {
              status: 'sent',
              sentAt: new Date(),
            },
          });

          this.logger.log(`✅ Successfully sent scheduled notification ${notification.id}`);
        } catch (error: any) {
          this.logger.error(`❌ Failed to send scheduled notification ${notification.id}: ${error.message}`);
          // Update notification status to failed
          await this.prisma.notification.update({
            where: { id: notification.id },
            data: {
              status: 'failed',
              errorMessage: error.message,
            },
          });
        }
      }

      this.logger.log(`Scheduled notifications processed: ${scheduledNotifications.length}`);
    } catch (error) {
      this.logger.error('Error processing scheduled notifications:', error);
    }
  }

  /**
   * Schedule a one-time SMS or Email
   */
  async scheduleMessage(
    channel: 'sms' | 'email',
    recipient: string,
    message: string,
    scheduledAt: Date,
    subject?: string,
    template?: string,
    payload?: any,
  ) {
    // Validate scheduled time is in the future
    if (scheduledAt <= new Date()) {
      throw new Error('Scheduled time must be in the future');
    }

    // Create notification with scheduledAt
    const notification = await this.prisma.notification.create({
      data: {
        channel,
        recipient,
        message,
        subject: subject || null,
        template: template || null,
        payload: payload ? JSON.stringify(payload) : null,
        status: 'pending',
        scheduledAt,
      },
    });

    this.logger.log(`Scheduled ${channel} notification ${notification.id} for ${scheduledAt.toISOString()}`);
    
    return notification;
  }
}

