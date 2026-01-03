# Quick Start: Deploy Frontend to Amplify

## Current Status
- ✅ Backend: Running on App Runner (`https://mzmeyp2cw9.us-east-1.awsapprunner.com`)
- ⏳ Frontend: Ready to deploy to Amplify

## Quick Deploy (5 minutes)

### Step 1: Go to AWS Amplify Console
https://console.aws.amazon.com/amplify

### Step 2: Create New App
1. Click **"New app"** → **"Host web app"**
2. **Connect repository**:
   - Choose: GitHub (or your Git provider)
   - Authorize if needed
   - Select: `ayoussef83/bot`
   - Branch: `main`
3. Click **"Next"**

### Step 3: Configure Build
1. **Build settings**: Amplify will auto-detect `amplify.yml`
2. **Environment variables**: Click "Add environment variable"
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://mzmeyp2cw9.us-east-1.awsapprunner.com/api`
3. Click **"Next"**

### Step 4: Review and Deploy
1. Review settings
2. Click **"Save and deploy"**
3. Wait 5-10 minutes for build and deployment

### Step 5: Get Amplify URL
Once deployed, you'll get a URL like:
- `https://main.xxxxx.amplifyapp.com`

### Step 6: Update DNS (GoDaddy)
1. Go to GoDaddy → My Products → mvalley-eg.com → DNS
2. Find CNAME record for `mv-os`
3. Update value to: `main.xxxxx.amplifyapp.com` (your Amplify domain)
4. Save and wait 5-15 minutes

## Done! 🎉

Your site will be:
- ✅ Faster globally (CloudFront CDN)
- ✅ Cheaper (~$27-30/month)
- ✅ Better performance

## Next: Stop ECS Services

Once verified working, stop ECS to save costs:

```bash
aws ecs update-service --cluster mv-os --service mv-os-frontend --desired-count 0
aws ecs update-service --cluster mv-os --service mv-os-backend --desired-count 0
```

This will save ~$18/month!











