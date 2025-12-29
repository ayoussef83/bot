# Scheduled Tasks & Notifications System

## Overview

The MV-OS system now includes an automated scheduler that handles time-dependent tasks and notifications. The scheduler runs background jobs to send reminders for payments and upcoming sessions.

## Features

### 1. Payment Due Reminders
- **Schedule**: Daily at 9:00 AM (Cairo time)
- **Trigger**: Payments due in 3 days
- **Channels**: SMS and Email
- **Recipients**: Student's parent (if available) or student directly
- **Duplicate Prevention**: Checks if a reminder was sent in the last 24 hours

### 2. Overdue Payment Reminders
- **Schedule**: Daily at 10:00 AM (Cairo time)
- **Trigger**: Payments that are past their due date
- **Channels**: SMS and Email
- **Recipients**: Student's parent (if available) or student directly
- **Duplicate Prevention**: Checks if a reminder was sent in the last 24 hours

### 3. Session Reminders
- **Schedule**: Every hour
- **Trigger**: Sessions scheduled for tomorrow (24 hours before)
- **Channels**: SMS and Email
- **Recipients**: All students enrolled in the class (via parent or student contact)
- **Duplicate Prevention**: Checks if a reminder was sent in the last 12 hours

## Message Templates

The system uses customizable message templates stored in the database. Templates support variable substitution:

- `{{amount}}` - Payment amount
- `{{days}}` - Days until due or days overdue
- `{{studentName}}` - Student's full name
- `{{className}}` - Class name
- `{{location}}` - Class location
- `{{time}}` - Session date and time

### Default Templates

The system includes default templates for:
- Payment Due Reminder (SMS & Email)
- Payment Overdue (SMS & Email)
- Session Reminder (SMS & Email)

Templates can be customized via the Settings page in the admin dashboard.

## Configuration

### Prerequisites

1. **Zoho Email Integration**: Must be configured in Settings → Communications
   - SMTP host (default: smtp.zoho.com)
   - Port (default: 587)
   - Username/Email
   - Password
   - From Email
   - From Name (optional)

2. **SMSMisr Integration**: Must be configured in Settings → Communications
   - Username
   - Password
   - Sender ID
   - API URL (default: https://smsmisr.com/api/SMS/)

### Time Zone

All scheduled tasks run in **Africa/Cairo** timezone. Adjust cron expressions in `scheduler.service.ts` if needed.

## Notification Tracking

All notifications are tracked in the `notifications` table with:
- Status: `pending`, `sent`, or `failed`
- Timestamp: When the notification was sent
- Error messages: If sending failed
- Payload: Template variables used

This allows:
- Duplicate prevention
- Audit trail
- Error tracking
- Resend capabilities (future feature)

## Seeding Default Templates

To seed default message templates, run:

```bash
cd backend
npx ts-node prisma/seed-templates.ts
```

Or add to your main seed script.

## Customization

### Adding New Scheduled Tasks

1. Add a new method to `SchedulerService` with `@Cron()` decorator
2. Implement the logic to find records that need notifications
3. Use `NotificationsService.sendMessage()` to send notifications
4. Check for existing notifications to prevent duplicates

Example:

```typescript
@Cron('0 8 * * *', {
  name: 'my-custom-task',
  timeZone: 'Africa/Cairo',
})
async handleMyCustomTask() {
  // Your logic here
}
```

### Modifying Schedules

Edit the cron expressions in `backend/src/scheduler/scheduler.service.ts`:

- `'0 9 * * *'` - Daily at 9:00 AM
- `'0 10 * * *'` - Daily at 10:00 AM
- `CronExpression.EVERY_HOUR` - Every hour

See [@nestjs/schedule documentation](https://docs.nestjs.com/techniques/task-scheduling) for more options.

## Monitoring

The scheduler logs all activities:
- Number of records found
- Number of notifications sent
- Errors (if any)

Check CloudWatch logs for the App Runner service to monitor scheduler activity.

## Future Enhancements

Potential improvements:
- Configurable reminder timing (e.g., 7 days before, 1 day before)
- WhatsApp notifications
- Retry logic for failed notifications
- Admin dashboard to view/manage scheduled tasks
- Manual trigger for testing
- Notification preferences per student/parent

