# Complete Migration Guide: ECS → CloudFront + App Runner

## ✅ Current Status

### Backend
- ✅ **App Runner**: Already running at `https://mzmeyp2cw9.us-east-1.awsapprunner.com`
- ✅ **Health Check**: Working
- ✅ **API**: Accessible at `/api`

### Frontend
- ⏳ **Current**: ECS Fargate
- ⏳ **Target**: AWS Amplify (includes CloudFront automatically)

## Migration Steps

### Step 1: Deploy Frontend to AWS Amplify

#### Option A: Via AWS Console (Recommended - Easier)

1. **Go to AWS Amplify Console**: https://console.aws.amazon.com/amplify
2. **Click**: "New app" → "Host web app"
3. **Connect Repository**:
   - Choose your Git provider (GitHub/GitLab/Bitbucket)
   - Select repository: `ayoussef83/bot`
   - Branch: `main`
4. **Configure Build Settings**:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - cd frontend
           - npm install --legacy-peer-deps
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: frontend/.next
       files:
         - '**/*'
     cache:
       paths:
         - frontend/node_modules/**/*
         - frontend/.next/cache/**/*
   ```
5. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` = `https://mzmeyp2cw9.us-east-1.awsapprunner.com/api`
6. **Click**: "Save and deploy"
7. **Wait**: 5-10 minutes for deployment
8. **Note the Amplify URL**: e.g., `https://main.xxxxx.amplifyapp.com`

#### Option B: Via Amplify CLI

```bash
cd frontend

# Install Amplify CLI (if not installed)
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init
# Follow prompts:
# - Project name: mv-os-frontend
# - Environment: production
# - Framework: react
# - Source directory: .
# - Build command: npm run build
# - Start command: npm start
# - Distribution directory: .next

# Add hosting
amplify add hosting
# Select: Hosting with Amplify Console

# Set environment variable
amplify env add production
# Add: NEXT_PUBLIC_API_URL=https://mzmeyp2cw9.us-east-1.awsapprunner.com/api

# Deploy
amplify publish
```

### Step 2: Update DNS

Once Amplify is deployed:

1. **Get Amplify Domain**: From Amplify console (e.g., `main.xxxxx.amplifyapp.com`)
2. **Go to GoDaddy**: My Products → mvalley-eg.com → DNS
3. **Update CNAME Record**:
   - **Name**: `mv-os`
   - **Value**: `main.xxxxx.amplifyapp.com` (your Amplify domain)
   - **TTL**: 600 seconds
4. **Save and wait** 5-15 minutes for DNS propagation

### Step 3: Stop ECS Services (Save Costs)

Once everything is verified working:

```bash
# Scale down ECS services to 0 (saves costs)
aws ecs update-service --cluster mv-os --service mv-os-frontend --desired-count 0
aws ecs update-service --cluster mv-os --service mv-os-backend --desired-count 0

# Optional: Delete services (if you want to remove completely)
# aws ecs delete-service --cluster mv-os --service mv-os-frontend --force
# aws ecs delete-service --cluster mv-os --service mv-os-backend --force
```

### Step 4: Optional - Delete ALB (if not needed)

If you're not using ALB anymore:

```bash
# Delete ALB (be careful - this is permanent)
# aws elbv2 delete-load-balancer --load-balancer-arn <ALB_ARN>
```

## Cost After Migration

- **App Runner**: ~$10-12/month
- **Amplify**: ~$0-1/month (free tier: 1000 build minutes, 15 GB storage)
- **CloudFront** (included in Amplify): ~$0-1/month
- **RDS**: ~$15/month
- **Secrets Manager**: ~$0.40/month
- **ECR**: ~$0.50/month
- **Total**: ~$27-30/month ✅

## Performance Benefits

- ✅ **Frontend**: 40-60% faster globally (Amplify includes CloudFront CDN)
- ✅ **Backend**: Same or better (App Runner)
- ✅ **Global users**: Much better experience
- ✅ **Cost**: 60-70% reduction

## Verification Checklist

- [ ] App Runner backend is accessible
- [ ] Frontend deployed to Amplify
- [ ] DNS updated to point to Amplify
- [ ] Site loads at https://mv-os.mvalley-eg.com
- [ ] Login works
- [ ] API calls work
- [ ] ECS services stopped (saving costs)

## Troubleshooting

### Frontend not loading
- Check Amplify build logs
- Verify environment variables
- Check DNS propagation

### API calls failing
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check App Runner service is running
- Verify CORS settings in backend

### DNS issues
- Wait 15-30 minutes for propagation
- Check DNS record is correct
- Verify Amplify domain is accessible










