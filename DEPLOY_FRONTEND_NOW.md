# 🚀 Deploy Frontend to AWS Amplify - Quick Guide

## ✅ Prerequisites (Already Done)
- ✅ Backend running: `https://mzmeyp2cw9.us-east-1.awsapprunner.com`
- ✅ `amplify.yml` configured
- ✅ `next.config.js` has API URL

## 🚀 Deploy via AWS Console (5 minutes)

### Step 1: Open Amplify Console
Go to: **https://console.aws.amazon.com/amplify**

### Step 2: Create New App
1. Click **"New app"** → **"Host web app"**
2. Select **"GitHub"** (or your Git provider)
3. Authorize AWS Amplify (if first time)
4. Select repository: Your repository
5. Select branch: **`main`**
6. Click **"Next"**

### Step 3: Configure Build
Amplify should auto-detect `amplify.yml`. If not, use:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - echo "Installing dependencies..."
        - |
          if [ -d "Mvalley System/frontend" ]; then
            cd "Mvalley System/frontend"
            FRONTEND_DIR="Mvalley System/frontend"
          elif [ -d "frontend" ]; then
            cd "frontend"
            FRONTEND_DIR="frontend"
          else
            echo "ERROR: Frontend directory not found"
            exit 1
          fi
          pwd
        - npm install --legacy-peer-deps
    build:
      commands:
        - echo "Building Next.js application..."
        - npm run build
  artifacts:
    baseDirectory: out
    files:
      - '**/*'
  cache:
    paths:
      - "Mvalley System/frontend/node_modules/**/*"
      - "Mvalley System/frontend/.next/cache/**/*"
```

### Step 4: Add Environment Variable
Click **"Add environment variable"**:
- **Key**: `NEXT_PUBLIC_API_URL`
- **Value**: `https://mzmeyp2cw9.us-east-1.awsapprunner.com/api`
- Click **"Save"**

### Step 5: Deploy
1. Review settings
2. Click **"Save and deploy"**
3. Wait 5-10 minutes

### Step 6: Get Your URL
Once deployed, you'll get a URL like:
- `https://main.xxxxx.amplifyapp.com`

## ✅ Verify Deployment

1. **Test the URL**: Visit your Amplify URL
2. **Test Login**: Use default credentials:
   - Email: `admin@mindvalley.eg`
   - Password: `admin123`
3. **Check API**: Verify it connects to backend

## 🎉 Done!

Your frontend is now deployed and accessible!






