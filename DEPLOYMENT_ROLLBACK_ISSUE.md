# Deployment Rollback Issue

## Problem

App Runner deployments keep rolling back when trying to deploy the new backend image with the scheduler controller.

## Status

- ✅ **CodeBuild**: Build succeeded
- ✅ **ECR**: New image pushed successfully
- ❌ **App Runner**: Deployment rolls back (`ROLLBACK_SUCCEEDED`)
- ❌ **Scheduler Endpoint**: Still returns 404 (old image is running)

## Current Image

**Old Image (Currently Running)**:
```
sha256:d717653d444989d1c0333e561d41df25fe7d261499aece75735825d10c7f245c
```

**New Image (Failing to Deploy)**:
```
sha256:26a6b37df9dc9ef807488b845207bd8f5f181188c6f686b064ab1cd935210dce
```

## Possible Causes

1. **Health Check Failure**: App Runner health checks (`/api/health`) might be failing during deployment
2. **Startup Error**: The scheduler module might be causing the app to fail during startup
3. **Dependency Issue**: Missing or incompatible dependency in the new image
4. **Memory/Resource Issue**: Scheduler might be consuming too many resources

## Investigation Steps

### 1. Check App Runner Logs

**AWS Console**:
```
https://console.aws.amazon.com/apprunner/service/mv-os-backend
```

Navigate to:
- **Operations** tab → Check latest operation details
- **Logs** tab → Check for startup errors
- **Metrics** tab → Check for resource issues

### 2. Verify Health Endpoint

The health endpoint should work on the new image:
```bash
curl https://mzmeyp2cw9.us-east-1.awsapprunner.com/api/health
```

### 3. Check Scheduler Module

The scheduler module uses:
- `@nestjs/schedule` (installed: `4.1.2`)
- `ScheduleModule.forRoot()` in `SchedulerModule`
- Three `@Cron` decorators with `Africa/Cairo` timezone

### 4. Test Locally (If Possible)

Build and test the Docker image locally:
```bash
cd backend
docker build -t mv-os-backend:test .
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e JWT_SECRET="..." \
  mv-os-backend:test
```

Then test:
```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/scheduler/status
```

## Potential Solutions

### Option 1: Check App Runner Logs

The most important step is to check the App Runner console logs to see the actual error message.

### Option 2: Temporarily Disable Scheduler

If the scheduler is causing issues, we could:
1. Comment out the `@Cron` decorators temporarily
2. Deploy without scheduler
3. Re-enable scheduler incrementally

### Option 3: Increase Health Check Timeout

The health check might be timing out. We could:
- Increase `HealthyThreshold` from 1 to 2
- Increase `Interval` from 10 to 15
- Increase `Timeout` from 5 to 10

### Option 4: Verify Dependencies

Ensure all dependencies are installed in production:
```bash
cd backend
npm install --only=production --legacy-peer-deps
npm list @nestjs/schedule
```

## Next Steps

1. **Check App Runner Console** for detailed error logs
2. **Review Operations tab** for specific failure reason
3. **Check CloudWatch Logs** for application startup errors
4. **Verify health endpoint** works on new image (if accessible)

## Current Workaround

The scheduler functionality is implemented but not yet deployed. The old backend image is still running, which is why the scheduler endpoint returns 404.

---

**Last Check**: $(date)  
**Status**: Waiting for App Runner logs to identify root cause






