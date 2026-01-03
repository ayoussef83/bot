# Testing Scheduled Tasks (Scheduler)

## Overview

The scheduler system runs automated tasks to send SMS and email notifications. You can now test these tasks manually using the test endpoints.

## Test Endpoints

All endpoints require authentication and `super_admin` role.

### 1. Check Scheduler Status & Cairo Time

**GET** `/api/scheduler/status`

Returns:
- Current server time
- Current Cairo time (formatted)
- Scheduled task information

**Example Response:**
```json
{
  "serverTime": "2025-12-30T12:00:00.000Z",
  "cairoTime": "2025-12-30T14:00:00.000Z",
  "cairoTimeFormatted": "Monday, December 30, 2025 at 2:00:00 PM EET",
  "timezone": "Africa/Cairo",
  "scheduledTasks": {
    "paymentDueReminders": {
      "schedule": "Daily at 9:00 AM (Cairo time)",
      "cron": "0 9 * * *"
    },
    "overduePaymentReminders": {
      "schedule": "Daily at 10:00 AM (Cairo time)",
      "cron": "0 10 * * *"
    },
    "sessionReminders": {
      "schedule": "Every hour (Cairo time)",
      "cron": "0 * * * *"
    }
  }
}
```

### 2. Test Payment Due Reminders

**POST** `/api/scheduler/test/payment-due-reminders`

Manually triggers the payment due reminders task. This will:
- Find payments due in 3 days
- Send SMS/Email reminders to students/parents
- Log all activities

**Example Request:**
```bash
curl -X POST https://mv-os.mvalley-eg.com/api/scheduler/test/payment-due-reminders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**
```json
{
  "success": true,
  "message": "Payment due reminders task executed. Check logs for details.",
  "timestamp": "2025-12-30T14:00:00.000Z",
  "timezone": "Africa/Cairo"
}
```

### 3. Test Overdue Payment Reminders

**POST** `/api/scheduler/test/overdue-payment-reminders`

Manually triggers the overdue payment reminders task. This will:
- Find payments that are past due date
- Send urgent SMS/Email reminders
- Log all activities

**Example Request:**
```bash
curl -X POST https://mv-os.mvalley-eg.com/api/scheduler/test/overdue-payment-reminders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Test Session Reminders

**POST** `/api/scheduler/test/session-reminders`

Manually triggers the session reminders task. This will:
- Find sessions scheduled for tomorrow
- Send SMS/Email reminders to students/parents
- Log all activities

**Example Request:**
```bash
curl -X POST https://mv-os.mvalley-eg.com/api/scheduler/test/session-reminders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Testing Workflow

### Step 1: Check Current Time

```bash
curl https://mv-os.mvalley-eg.com/api/scheduler/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Verify the Cairo time is correct.

### Step 2: Create Test Data

Before testing, ensure you have:

1. **For Payment Reminders:**
   - A payment with `status: 'pending'`
   - A `dueDate` set to 3 days from now (for due reminders)
   - OR a `dueDate` in the past (for overdue reminders)
   - Student with phone/email or parent with phone/email

2. **For Session Reminders:**
   - A session with `scheduledDate` set to tomorrow
   - Session status: `'scheduled'`
   - Class with enrolled students
   - Students with phone/email or parents with phone/email

### Step 3: Configure SMS/Email

Ensure SMSMisr and Zoho Email are configured in Settings → Communications.

### Step 4: Run Test

```bash
# Test payment due reminders
curl -X POST https://mv-os.mvalley-eg.com/api/scheduler/test/payment-due-reminders \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test overdue payment reminders
curl -X POST https://mv-os.mvalley-eg.com/api/scheduler/test/overdue-payment-reminders \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test session reminders
curl -X POST https://mv-os.mvalley-eg.com/api/scheduler/test/session-reminders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 5: Check Results

1. **Check CloudWatch Logs:**
   - Look for `SchedulerService` logs
   - Verify notifications were sent
   - Check for any errors

2. **Check Database:**
   - Query `notifications` table
   - Verify notifications were created
   - Check status: `sent`, `pending`, or `failed`

3. **Verify SMS/Email:**
   - Check recipient's phone/email
   - Verify message content
   - Check template variables were replaced correctly

## Using Postman or Frontend

### Postman Collection

1. Import the API endpoints
2. Set Authorization header: `Bearer YOUR_TOKEN`
3. Make requests to test endpoints

### Frontend Integration

You can add a "Test Scheduler" button in Settings page:

```typescript
// In Settings page
const testScheduler = async (task: string) => {
  try {
    const response = await api.post(`/scheduler/test/${task}`);
    alert(`Task executed: ${response.data.message}`);
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
};
```

## Timezone Notes

- All scheduled tasks use **Africa/Cairo** timezone
- Test endpoints execute immediately (not scheduled)
- Server time vs Cairo time may differ - always check `/api/scheduler/status`
- Cron expressions are in Cairo time:
  - `0 9 * * *` = 9:00 AM Cairo time
  - `0 10 * * *` = 10:00 AM Cairo time
  - `0 * * * *` = Every hour at minute 0 (Cairo time)

## Troubleshooting

### No Notifications Sent

1. Check if test data exists (payments/sessions)
2. Verify SMSMisr/Zoho Email are configured and active
3. Check student/parent contact information exists
4. Review CloudWatch logs for errors

### Notifications Failed

1. Check `notifications` table for `errorMessage`
2. Verify SMSMisr credentials are correct
3. Verify Zoho SMTP settings are correct
4. Check SMSMisr balance
5. Review CloudWatch logs

### Wrong Time

1. Verify server timezone settings
2. Check `/api/scheduler/status` for Cairo time
3. Ensure cron expressions use `timeZone: 'Africa/Cairo'`

## Production Schedule

Once testing is complete, the scheduler will run automatically:

- **Payment Due Reminders**: Daily at 9:00 AM (Cairo time)
- **Overdue Payment Reminders**: Daily at 10:00 AM (Cairo time)
- **Session Reminders**: Every hour (Cairo time)

No manual intervention needed - the scheduler runs automatically!







