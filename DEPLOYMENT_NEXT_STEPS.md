# 🚀 Deployment Next Steps

## Current Status

✅ **CodeBuild**: Build triggered and in progress  
✅ **App Runner**: Service is RUNNING  
✅ **Health Check**: Passing (HTTP 200)  
✅ **ECR**: Latest image available

## Deployment Timeline

1. **CodeBuild** (Current): Building Docker image with scheduler system
   - Expected duration: 5-10 minutes
   - Status: Check with verification script

2. **ECR Push**: Image will be pushed automatically after build
   - Repository: `149959196988.dkr.ecr.us-east-1.amazonaws.com/mv-os-backend`

3. **App Runner Deployment**: Auto-deploys when new image is detected
   - Expected duration: 5-10 minutes after ECR push
   - Service will restart with new code

## Verification Commands

### Check Build Status
```bash
aws codebuild batch-get-builds --ids mv-os-backend-build:e5dacadf-c9cc-4493-9e02-8a858dcc4f15 --query "builds[0].buildStatus" --output text
```

### Check App Runner Status
```bash
aws apprunner describe-service --service-arn "arn:aws:apprunner:us-east-1:149959196988:service/mv-os-backend/a9775dfe16034128b71f546793e3d7dd" --query "Service.Status" --output text
```

### Run Full Verification
```bash
./verify-scheduler-deployment.sh
```

## After Deployment Completes

### 1. Seed Message Templates

The scheduler needs default message templates to work properly.

**Option A: Via Database Connection (Recommended)**
```bash
cd backend
npm run prisma:seed-templates
```

**Option B: Via Settings Page**
1. Go to: `https://mv-os.mvalley-eg.com/dashboard/settings`
2. Navigate to "Communications" tab
3. Click "Message Templates"
4. Create templates manually or import defaults

**Required Templates:**
- `payment_due_reminder` (SMS & Email)
- `payment_overdue` (SMS & Email)
- `session_reminder` (SMS & Email)

### 2. Verify Scheduler is Running

**Check CloudWatch Logs:**
```bash
# Find the correct log group name
aws logs describe-log-groups --log-group-name-prefix "/aws/apprunner" --query "logGroups[?contains(logGroupName, 'mv-os')].logGroupName" --output text

# Tail logs (replace with actual log group name)
aws logs tail <log-group-name> --follow | grep -i scheduler
```

**Look for:**
- `SchedulerService` initialization
- `Running payment due reminders check...`
- No errors during startup

### 3. Configure Integrations

Ensure Zoho Email and SMSMisr are configured:

1. Go to: `https://mv-os.mvalley-eg.com/dashboard/settings`
2. Navigate to "Communications" tab
3. Configure:
   - **Zoho Email**:
     - SMTP Host: `smtp.zoho.com`
     - Port: `587`
     - Username/Email
     - Password
     - From Email
   - **SMSMisr**:
     - Username
     - Password
     - Sender ID
     - API URL: `https://smsmisr.com/api/SMS/`

4. Test both integrations using the "Test" buttons

### 4. Monitor First Scheduled Run

The scheduler will run:
- **Payment Due Reminders**: Tomorrow at 9:00 AM (Cairo time)
- **Overdue Payment Reminders**: Tomorrow at 10:00 AM
- **Session Reminders**: Every hour (checks for tomorrow's sessions)

**Monitor via CloudWatch:**
- Set up log filters for `SchedulerService`
- Watch for notification sending logs
- Check for any errors

## Troubleshooting

### Build Fails
- Check CodeBuild logs in AWS Console
- Verify `buildspec.yml` is correct
- Check Dockerfile syntax

### Deployment Fails
- Check App Runner logs
- Verify ECR image exists
- Check health check endpoint

### Scheduler Not Running
- Verify `SchedulerModule` is imported in `app.module.ts`
- Check CloudWatch logs for errors
- Verify cron expressions are valid

### Templates Not Found
- Run `npm run prisma:seed-templates`
- Or create templates manually via Settings page

### Email/SMS Not Sending
- Verify integration settings in database
- Test credentials manually
- Check CloudWatch logs for errors
- Verify templates exist and are active

## Success Indicators

✅ Build status: `SUCCEEDED`  
✅ App Runner status: `RUNNING`  
✅ Health check: HTTP 200  
✅ Scheduler logs appear in CloudWatch  
✅ Templates seeded successfully  
✅ Email/SMS test sends work  
✅ No errors in application logs

## Quick Reference

**Service URL**: `https://mzmeyp2cw9.us-east-1.awsapprunner.com`  
**Custom Domain**: `https://mv-os.mvalley-eg.com`  
**App Runner Console**: https://console.aws.amazon.com/apprunner  
**CodeBuild Console**: https://console.aws.amazon.com/codesuite/codebuild

---

**Deployment initiated**: $(date)  
**Monitor progress**: Run `./verify-scheduler-deployment.sh` periodically











