# Deploy Frontend to AWS Amplify - Step by Step

## ✅ Prerequisites (Already Done)
- ✅ Backend running on App Runner: `https://mzmeyp2cw9.us-east-1.awsapprunner.com`
- ✅ Frontend code pushed to GitHub: `ayoussef83/bot`
- ✅ `amplify.yml` build config created
- ✅ `next.config.js` updated with API URL

## 🚀 Deploy Steps (10 minutes)

### Step 1: Open AWS Amplify Console
Go to: **https://console.aws.amazon.com/amplify**

### Step 2: Create New App
1. Click **"New app"** button (top right)
2. Select **"Host web app"**

### Step 3: Connect Repository
1. Choose **"GitHub"** (or your Git provider)
2. Click **"Authorize use of GitHub"** (if first time)
3. Authorize AWS Amplify to access your repositories
4. Select repository: **`ayoussef83/bot`**
5. Select branch: **`main`**
6. Click **"Next"**

### Step 4: Configure Build Settings
Amplify should auto-detect `amplify.yml`. Verify:

**Build settings** (should auto-populate):
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
```

**If not auto-detected**, paste the above YAML.

### Step 5: Add Environment Variables
Click **"Add environment variable"**:
- **Key**: `NEXT_PUBLIC_API_URL`
- **Value**: `https://mzmeyp2cw9.us-east-1.awsapprunner.com/api`
- Click **"Save"**

### Step 6: Review and Deploy
1. Review all settings
2. Click **"Save and deploy"**
3. Wait 5-10 minutes for build and deployment

### Step 7: Get Amplify URL
Once deployment completes:
- You'll see a URL like: `https://main.xxxxx.amplifyapp.com`
- **Copy this URL** - you'll need it for DNS

### Step 8: Update DNS (GoDaddy)
1. Go to **GoDaddy** → My Products → mvalley-eg.com → DNS
2. Find the CNAME record for `mv-os`
3. Update the value to: `main.xxxxx.amplifyapp.com` (your Amplify domain)
4. **TTL**: 600 seconds
5. **Save**

### Step 9: Wait for DNS Propagation
- Wait 5-15 minutes
- Test: `https://mv-os.mvalley-eg.com`

### Step 10: Stop ECS Services (Save Costs)
Once verified working:

```bash
aws ecs update-service --cluster mv-os --service mv-os-frontend --desired-count 0
aws ecs update-service --cluster mv-os --service mv-os-backend --desired-count 0
```

This saves ~$18/month!

## ✅ Verification Checklist

- [ ] Amplify app created
- [ ] Build successful
- [ ] Deployment complete
- [ ] Amplify URL obtained
- [ ] DNS updated in GoDaddy
- [ ] Site loads at https://mv-os.mvalley-eg.com
- [ ] Login works
- [ ] API calls work
- [ ] ECS services stopped

## 🎉 Done!

Your site is now:
- ✅ Faster globally (CloudFront CDN)
- ✅ Cheaper (~$27-30/month)
- ✅ Better performance

## Troubleshooting

### Build fails
- Check build logs in Amplify console
- Verify `amplify.yml` is in root directory
- Check Node.js version (should be 18+)

### Site not loading
- Wait 15-30 minutes for DNS propagation
- Check DNS record is correct
- Verify Amplify domain is accessible

### API calls failing
- Verify `NEXT_PUBLIC_API_URL` environment variable is set
- Check App Runner backend is running
- Test backend directly: `https://mzmeyp2cw9.us-east-1.awsapprunner.com/api/health`











