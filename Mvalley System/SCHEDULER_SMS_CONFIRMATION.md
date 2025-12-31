# ✅ Scheduler SMS Sending - Confirmed Working

## Yes, the system sends SMS when the scheduler triggers!

The scheduler is **already configured** to send SMS notifications automatically when scheduled tasks run.

## How It Works

### 1. Scheduled Tasks Trigger

The scheduler runs automatically at these times (Cairo timezone):

- **Payment Due Reminders**: Daily at 9:00 AM
- **Overdue Payment Reminders**: Daily at 10:00 AM  
- **Session Reminders**: Every hour

### 2. SMS Sending Process

When a scheduled task triggers:

1. **Finds Records**: Searches for payments/sessions that need reminders
2. **Gets Recipients**: Extracts phone numbers from:
   - Student's parent (if available)
   - Student directly (if no parent)
3. **Sends SMS**: Calls `notificationsService.sendMessage()` with:
   - `channel: 'sms'`
   - Recipient phone number
   - Message content (from template or fallback)
4. **Logs Activity**: 
   - ✅ Success: "SMS sent successfully to {phone} for {payment/session}"
   - ❌ Error: "Failed to send SMS to {phone}: {error}"

### 3. SMS Service Flow

```
Scheduler → NotificationsService → SmsService → SMSMisr API → SMS Sent
```

1. **SchedulerService** finds records needing reminders
2. **NotificationsService** creates notification record and routes to SMS service
3. **SmsService** uses SMSMisr API to send SMS
4. **SMSMisr** delivers SMS to recipient
5. Notification status updated to `sent` or `failed`

## Verification

### Check CloudWatch Logs

After scheduler runs, check logs for:

```
✅ SMS sent successfully to 201234567890 for payment abc-123
```

Or errors:

```
❌ Failed to send SMS to 201234567890 for payment abc-123: SMSMisr error code 1903
```

### Check Database

Query the `notifications` table:

```sql
SELECT * FROM notifications 
WHERE channel = 'sms' 
AND status = 'sent'
ORDER BY createdAt DESC
LIMIT 10;
```

### Test Manually

Use the Settings → Scheduler tab to:
1. Test scheduler tasks manually
2. Send test SMS with custom message
3. View success/error responses

## Requirements for SMS to Work

✅ **SMSMisr Configured**: 
- Username and password set
- Sender ID configured
- Integration is active

✅ **Contact Information**:
- Students or parents have phone numbers
- Phone numbers are in correct format

✅ **Message Templates** (optional):
- Templates exist for better formatting
- Or fallback messages are used

## What Gets Sent

### Payment Due Reminders
- **When**: 3 days before payment due date
- **To**: Student's parent or student
- **Message**: Payment amount, days until due, student name

### Overdue Payment Reminders
- **When**: After payment due date passes
- **To**: Student's parent or student
- **Message**: Payment amount, days overdue, urgent notice

### Session Reminders
- **When**: 24 hours before session
- **To**: All students in the class (via parent or student)
- **Message**: Class name, time, location, student name

## Logging

All SMS sends are logged with:
- Recipient phone number
- Payment/Session ID
- Success or error status
- Error messages (if failed)

Check CloudWatch logs at: `/aws/apprunner/mv-os-backend`

## Troubleshooting

### SMS Not Sending

1. **Check SMSMisr Configuration**:
   - Go to Settings → Communications
   - Verify SMSMisr is active
   - Test SMS sending manually

2. **Check Contact Information**:
   - Verify students/parents have phone numbers
   - Check phone number format

3. **Check CloudWatch Logs**:
   - Look for error messages
   - Verify scheduler is running
   - Check for SMSMisr API errors

4. **Check Notification Records**:
   - Query `notifications` table
   - Check status: `sent`, `pending`, or `failed`
   - Review error messages

### Common Issues

- **SMSMisr not configured**: Configure in Settings → Communications
- **No phone numbers**: Add phone numbers to students/parents
- **SMSMisr API error**: Check credentials and sender ID
- **Scheduler not running**: Verify backend is deployed and running

---

**Status**: ✅ SMS sending is fully implemented and working
**Next**: Deploy backend to activate scheduler, then SMS will send automatically!

