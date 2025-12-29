# Deploying Scheduler System

## Overview

The scheduler system has been implemented and is ready for deployment. This guide covers the deployment steps.

## Changes Made

1. **New Dependencies**:
   - `@nestjs/schedule` - For cron job scheduling
   - `nodemailer` - For Zoho SMTP email sending
   - `@types/nodemailer` - TypeScript types

2. **New Modules**:
   - `SchedulerModule` - Handles scheduled tasks
   - `SchedulerService` - Contains cron job logic

3. **Updated Services**:
   - `EmailService` - Now uses Zoho SMTP from database settings

## Deployment Steps

### 1. Install Dependencies (Already Done Locally)

```bash
cd backend
npm install
```

### 2. Build Backend (Already Done Locally)

```bash
npm run build
```

✅ Build successful - no errors

### 3. Deploy to AWS App Runner

The backend will be automatically built and deployed via CodeBuild when you commit and push the changes.

**Option A: Automatic Deployment (Recommended)**
1. Commit and push the changes to GitHub
2. CodeBuild will automatically:
   - Build the Docker image
   - Push to ECR
   - App Runner will auto-deploy the new image

**Option B: Manual Trigger**
1. Go to AWS CodeBuild console
2. Find your build project (likely `mv-os-backend-build`)
3. Click "Start build"
4. Monitor the build logs

### 4. Seed Message Templates

After the backend is deployed, seed the default message templates:

**Option A: Via Database (Recommended)**
1. Connect to your RDS database
2. Run the seed script:
   ```bash
   cd backend
   npm run prisma:seed-templates
   ```

**Option B: Via App Runner (if you have database access)**
1. SSH/connect to App Runner instance (if possible)
2. Or use AWS Systems Manager Session Manager
3. Run the seed script

**Option C: Manual SQL Insert**
You can manually insert templates via the Settings page in the admin dashboard.

### 5. Verify Deployment

1. **Check App Runner Service**:
   - Go to AWS App Runner console
   - Verify `mv-os-backend` service is running
   - Check logs for scheduler initialization

2. **Check Scheduler Logs**:
   - CloudWatch Logs → `/aws/apprunner/mv-os-backend`
   - Look for: `SchedulerService` logs
   - Should see: "Running payment due reminders check..." at 9:00 AM

3. **Test Email/SMS**:
   - Go to Settings → Communications
   - Test SMS and Email sending
   - Verify Zoho Email and SMSMisr are configured

## Scheduler Schedule

The scheduler runs the following tasks:

- **Payment Due Reminders**: Daily at 9:00 AM (Cairo time)
- **Overdue Payment Reminders**: Daily at 10:00 AM (Cairo time)
- **Session Reminders**: Every hour (checks for sessions tomorrow)

## Troubleshooting

### Scheduler Not Running

1. Check CloudWatch logs for errors
2. Verify `SchedulerModule` is imported in `app.module.ts`
3. Check that `@nestjs/schedule` is installed

### Email Not Sending

1. Verify Zoho Email is configured in Settings → Communications
2. Check Zoho SMTP credentials are correct
3. Check CloudWatch logs for email errors

### SMS Not Sending

1. Verify SMSMisr is configured in Settings → Communications
2. Check SMSMisr credentials and sender ID
3. Check CloudWatch logs for SMS errors

### Templates Not Found

1. Run `npm run prisma:seed-templates` to seed default templates
2. Or create templates manually via Settings page

## Next Steps After Deployment

1. ✅ Monitor first scheduled run (next day at 9:00 AM)
2. ✅ Verify notifications are being sent
3. ✅ Customize message templates as needed
4. ✅ Adjust cron schedules if needed

## Rollback

If you need to rollback:

1. Go to App Runner console
2. Find previous deployment
3. Rollback to previous image version

Or rebuild previous commit via CodeBuild.

