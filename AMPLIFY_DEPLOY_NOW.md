# Deploy to AWS Amplify - Direct Link & Steps

## 🚀 Quick Deploy (5 minutes)

### Direct Link to Create App:
**https://console.aws.amazon.com/amplify/home?region=us-east-1#/create**

### Step-by-Step:

1. **Click the link above** (or go to AWS Amplify Console)

2. **Click "New app" → "Host web app"**

3. **Connect Repository:**
   - Provider: **GitHub**
   - Click **"Authorize use of GitHub"** (if first time)
   - Authorize AWS Amplify
   - Repository: **`ayoussef83/bot`**
   - Branch: **`main`**
   - Click **"Next"**

4. **Configure Build Settings:**
   - Amplify should auto-detect `amplify.yml`
   - If not, use these settings:
   
   **Build specification:**
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

5. **Environment Variables:**
   - Click **"Add environment variable"**
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://mzmeyp2cw9.us-east-1.awsapprunner.com/api`
   - Click **"Save"**

6. **Review and Deploy:**
   - Review settings
   - Click **"Save and deploy"**
   - Wait 5-10 minutes

7. **Get Amplify URL:**
   - Once deployed, copy the URL (e.g., `https://main.xxxxx.amplifyapp.com`)

8. **Update DNS in GoDaddy:**
   - Go to GoDaddy → My Products → mvalley-eg.com → DNS
   - Update CNAME for `mv-os` to your Amplify domain
   - Save

## ✅ That's it!

Your site will be live at `https://mv-os.mvalley-eg.com` with:
- ✅ CloudFront CDN (40-60% faster globally)
- ✅ Cost: ~$27-30/month
- ✅ Better performance










