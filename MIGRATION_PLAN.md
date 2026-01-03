# Migration Plan: ECS → CloudFront + App Runner

## Architecture Changes

### Current:
- Frontend: ECS Fargate (Next.js server)
- Backend: ECS Fargate (NestJS)
- Load Balancer: ALB
- Global Accelerator: (disabled)

### New:
- Frontend: S3 + CloudFront (static + CDN)
- Backend: App Runner (NestJS)
- API Routing: CloudFront proxies /api/* to App Runner

## Migration Steps

### Phase 1: Backend Migration to App Runner

1. **Build and push backend image to ECR**
2. **Create App Runner service**
   - Use existing ECR image
   - Configure environment variables from Secrets Manager
   - Set health check path: `/api/health`
3. **Test App Runner backend**
4. **Get App Runner URL**

### Phase 2: Frontend Migration to S3 + CloudFront

1. **Update Next.js config for static export** (if possible)
   - OR use Next.js standalone mode
2. **Create S3 bucket for frontend**
3. **Build frontend for static hosting**
4. **Upload to S3**
5. **Create CloudFront distribution**
   - Origin: S3 bucket
   - Behaviors:
     - Default: S3 (for static files)
     - /api/*: App Runner backend (origin request)
6. **Configure CloudFront origin request function** to proxy /api/*

### Phase 3: DNS and Cleanup

1. **Update DNS** to point to CloudFront
2. **Wait for propagation**
3. **Stop ECS services** (save costs)
4. **Delete ALB** (if not needed)
5. **Verify everything works**

## Cost After Migration

- App Runner: ~$10-12/month
- S3: ~$0.50/month
- CloudFront: ~$1-2/month
- RDS: ~$15/month
- Secrets Manager: ~$0.40/month
- **Total: ~$27-30/month** ✅

## Performance Benefits

- Frontend: 40-60% faster globally (CDN)
- Backend: Same or better (App Runner)
- Overall: Better user experience











