import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private settingsService: SettingsService,
  ) {}

  /**
   * Check for payments due in 3 days and send reminders
   * Runs daily at 9:00 AM
   */
  @Cron('0 9 * * *', {
    name: 'payment-due-reminders',
    timeZone: 'Africa/Cairo',
  })
  async handlePaymentDueReminders() {
    this.logger.log('Running payment due reminders check...');

    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      threeDaysFromNow.setHours(23, 59, 59, 999);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find payments due in 3 days that are still pending
      const paymentsDue = await this.prisma.payment.findMany({
        where: {
          status: 'pending',
          dueDate: {
            gte: today,
            lte: threeDaysFromNow,
          },
          deletedAt: null,
        },
        include: {
          student: {
            include: {
              parent: true,
            },
          },
        },
      });

      this.logger.log(`Found ${paymentsDue.length} payments due in 3 days`);

      for (const payment of paymentsDue) {
        // Check if we already sent a reminder for this payment
        const existingNotification = await this.prisma.notification.findFirst({
          where: {
            template: 'payment_due_reminder',
            payload: JSON.stringify({ paymentId: payment.id }),
            status: 'sent',
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        });

        if (existingNotification) {
          this.logger.debug(`Reminder already sent for payment ${payment.id}`);
          continue;
        }

        // Get recipient (student or parent)
        const recipient = payment.student?.parent?.phone || payment.student?.phone;
        const recipientEmail = payment.student?.parent?.email || payment.student?.email;

        if (!recipient && !recipientEmail) {
          this.logger.warn(`No contact info for payment ${payment.id}`);
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
            (payment.dueDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          );
          const message = `Reminder: Payment of EGP ${payment.amount} is due in ${daysUntilDue} day(s). Please settle your payment to avoid service interruption.`;
          
          if (recipient) {
            this.logger.log(`Sending SMS to ${recipient} for payment ${payment.id}`);
            try {
              await this.notificationsService.sendMessage({
                channel: 'sms',
                recipient,
                message,
                template: 'payment_due_reminder',
                payload: { paymentId: payment.id, amount: payment.amount, dueDate: payment.dueDate },
                studentId: payment.studentId || undefined,
              });
              this.logger.log(`✅ SMS sent successfully to ${recipient} for payment ${payment.id}`);
            } catch (error: any) {
              this.logger.error(`❌ Failed to send SMS to ${recipient} for payment ${payment.id}: ${error.message}`);
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
              payload: { paymentId: payment.id, amount: payment.amount, dueDate: payment.dueDate },
              studentId: payment.studentId || undefined,
            });
          }
        } else {
          // Use template with variable substitution
          let message = template.body;
          const daysUntilDue = Math.ceil(
            (payment.dueDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          );
          
          // Simple variable replacement
          message = message.replace(/\{\{amount\}\}/g, payment.amount.toString());
          message = message.replace(/\{\{days\}\}/g, daysUntilDue.toString());
          message = message.replace(/\{\{studentName\}\}/g, 
            payment.student ? `${payment.student.firstName} ${payment.student.lastName}` : 'Student'
          );

          if (recipient) {
            this.logger.log(`Sending SMS to ${recipient} for payment ${payment.id}`);
            try {
              await this.notificationsService.sendMessage({
                channel: 'sms',
                recipient,
                message,
                template: 'payment_due_reminder',
                payload: { paymentId: payment.id, amount: payment.amount, dueDate: payment.dueDate },
                studentId: payment.studentId || undefined,
              });
              this.logger.log(`✅ SMS sent successfully to ${recipient} for payment ${payment.id}`);
            } catch (error: any) {
              this.logger.error(`❌ Failed to send SMS to ${recipient} for payment ${payment.id}: ${error.message}`);
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
            emailBody = emailBody.replace(/\{\{amount\}\}/g, payment.amount.toString());
            emailBody = emailBody.replace(/\{\{days\}\}/g, daysUntilDue.toString());
            emailBody = emailBody.replace(/\{\{studentName\}\}/g,
              payment.student ? `${payment.student.firstName} ${payment.student.lastName}` : 'Student'
            );

            await this.notificationsService.sendMessage({
              channel: 'email',
              recipient: recipientEmail,
              subject: emailSubject,
              message: emailBody,
              template: 'payment_due_reminder',
              payload: { paymentId: payment.id, amount: payment.amount, dueDate: payment.dueDate },
              studentId: payment.studentId || undefined,
            });
          }
        }
      }

      this.logger.log(`Payment reminders processed: ${paymentsDue.length}`);
    } catch (error) {
      this.logger.error('Error processing payment due reminders:', error);
    }
  }

  /**
   * Check for overdue payments and send urgent reminders
   * Runs daily at 10:00 AM
   */
  @Cron('0 10 * * *', {
    name: 'overdue-payment-reminders',
    timeZone: 'Africa/Cairo',
  })
  async handleOverduePaymentReminders() {
    this.logger.log('Running overdue payment reminders check...');

    try {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      // Find overdue payments that are still pending
      const overduePayments = await this.prisma.payment.findMany({
        where: {
          status: 'pending',
          dueDate: {
            lt: today,
          },
          deletedAt: null,
        },
        include: {
          student: {
            include: {
              parent: true,
            },
          },
        },
      });

      this.logger.log(`Found ${overduePayments.length} overdue payments`);

      for (const payment of overduePayments) {
        // Check if we already sent an overdue reminder today
        const existingNotification = await this.prisma.notification.findFirst({
          where: {
            template: 'payment_overdue',
            payload: JSON.stringify({ paymentId: payment.id }),
            status: 'sent',
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        });

        if (existingNotification) {
          continue;
        }

        const recipient = payment.student?.parent?.phone || payment.student?.phone;
        const recipientEmail = payment.student?.parent?.email || payment.student?.email;

        if (!recipient && !recipientEmail) {
          continue;
        }

        const daysOverdue = Math.ceil(
          (Date.now() - payment.dueDate!.getTime()) / (1000 * 60 * 60 * 24),
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
              .replace(/\{\{amount\}\}/g, payment.amount.toString())
              .replace(/\{\{days\}\}/g, daysOverdue.toString())
              .replace(/\{\{studentName\}\}/g,
                payment.student ? `${payment.student.firstName} ${payment.student.lastName}` : 'Student'
              )
          : `URGENT: Payment of EGP ${payment.amount} is ${daysOverdue} day(s) overdue. Please settle immediately to avoid service suspension.`;

        if (recipient) {
          this.logger.log(`Sending overdue payment SMS to ${recipient} for payment ${payment.id}`);
          try {
            await this.notificationsService.sendMessage({
              channel: 'sms',
              recipient,
              message,
              template: 'payment_overdue',
              payload: { paymentId: payment.id, amount: payment.amount, daysOverdue },
              studentId: payment.studentId || undefined,
            });
            this.logger.log(`✅ Overdue payment SMS sent successfully to ${recipient} for payment ${payment.id}`);
          } catch (error: any) {
            this.logger.error(`❌ Failed to send overdue payment SMS to ${recipient} for payment ${payment.id}: ${error.message}`);
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
          emailBody = emailBody.replace(/\{\{amount\}\}/g, payment.amount.toString());
          emailBody = emailBody.replace(/\{\{days\}\}/g, daysOverdue.toString());
          emailBody = emailBody.replace(/\{\{studentName\}\}/g,
            payment.student ? `${payment.student.firstName} ${payment.student.lastName}` : 'Student'
          );

          await this.notificationsService.sendMessage({
            channel: 'email',
            recipient: recipientEmail,
            subject: emailSubject,
            message: emailBody,
            template: 'payment_overdue',
            payload: { paymentId: payment.id, amount: payment.amount, daysOverdue },
            studentId: payment.studentId || undefined,
          });
        }
      }

      this.logger.log(`Overdue payment reminders processed: ${overduePayments.length}`);
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
}

