# 🚀 AWS App Runner Setup Guide - Step by Step

## Current Status
You're setting up App Runner for MV-OS backend. Follow these exact steps:

## Step 1: Source and Deployment ✅ (You're here)

**Configuration:**
- ✅ Repository type: **Source code repository** (selected)
- ✅ Provider: **GitHub** (selected)
- ✅ GitHub Connection: Your connection (e.g., "test3")
- ✅ Repository: Your repository (e.g., "bot")
- ✅ Branch: **main** (or your main branch)
- ✅ Source directory: **/** (root directory)
- ✅ Deployment trigger: **Manual** (you can change to Automatic later)

**Click "Next"**

---

## Step 2: Configure Build

### Runtime Selection
- **Select**: **Nodejs 18** (or Nodejs 22 if available)
  - Our backend uses Node.js 18

### Build Settings
**Configuration file**: **Configure all settings here** (selected)

**Build command:**
```
cd backend && npm install && npm run build
```

**Start command:**
```
cd backend && npm run start:prod
```

**Port:**
```
3000
```

**Click "Next"**

---

## Step 3: Configure Service

### Service Name
```
mv-os-backend
```

### Instance Configuration
- **CPU**: **0.25 vCPU**
- **Memory**: **0.5 GB**

### Environment Variables

Click **"Add environment variable"** and add:

1. **NODE_ENV**
   - Value: `production`

2. **PORT**
   - Value: `3000`

### Secrets (from Secrets Manager)

Click **"Add secret"** and add:

1. **DATABASE_URL**
   - Secret: Select from dropdown → `mv-os/database-url`
   - Or enter ARN: `arn:aws:secretsmanager:us-east-1:149959196988:secret:mv-os/database-url`

2. **JWT_SECRET**
   - Secret: Select from dropdown → `mv-os/jwt-secret`
   - Or enter ARN: `arn:aws:secretsmanager:us-east-1:149959196988:secret:mv-os/jwt-secret`

### Health Check Configuration
- **Protocol**: **HTTP**
- **Path**: `/api/health`
- **Interval**: **10** seconds
- **Timeout**: **5** seconds
- **Healthy threshold**: **1**
- **Unhealthy threshold**: **5**

### Auto-Deploy
- ✅ **Enable** (optional, for automatic deployments on push)

**Click "Next"**

---

## Step 4: Review and Create

### Review Settings
- ✅ Source: GitHub repository
- ✅ Build: Node.js 18, custom commands
- ✅ Service: mv-os-backend
- ✅ Instance: 0.25 vCPU, 0.5 GB
- ✅ Environment: NODE_ENV, PORT
- ✅ Secrets: DATABASE_URL, JWT_SECRET
- ✅ Health check: /api/health

**Click "Create & deploy"**

---

## ⏳ Deployment Process

1. **Initial deployment**: 5-10 minutes
2. **Status**: Check in App Runner console
3. **Service URL**: Will be provided after deployment (e.g., `https://xxxxx.us-east-1.awsapprunner.com`)

---

## ✅ After Deployment

### 1. Get Service URL
- Go to App Runner console
- Click on your service: `mv-os-backend`
- Copy the **Service URL**

### 2. Test Health Endpoint
```bash
curl https://YOUR_SERVICE_URL/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "mv-os-backend"
}
```

### 3. Run Database Migrations

**Option A: Via EC2 (Recommended)**
```bash
# Launch small EC2 instance (t3.micro)
# SSH into it
# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Clone your repo or copy files
git clone YOUR_REPO_URL
cd Mvalley\ System/backend

# Get database URL from Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id mv-os/database-url \
  --query SecretString --output text > .env
echo "DATABASE_URL=$(cat .env)" > .env

# Run migrations
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
```

**Option B: Via App Runner (One-time)**
- Create temporary App Runner service
- Start command: `cd backend && npx prisma migrate deploy && npm run prisma:seed && npm run start:prod`
- Delete after migrations complete

### 4. Update Frontend

Update `frontend/.env.local` or Amplify environment:
```
NEXT_PUBLIC_API_URL=https://YOUR_APP_RUNNER_URL/api
```

---

## 🔧 Troubleshooting

### Build Fails
- Check CloudWatch logs in App Runner console
- Verify build command is correct
- Check Node.js version compatibility

### Service Won't Start
- Check CloudWatch logs
- Verify environment variables are set
- Check database connectivity

### Health Check Fails
- Verify `/api/health` endpoint exists
- Check service logs
- Verify port is 3000

---

## 📊 Monitoring

- **CloudWatch Logs**: Automatic
- **Metrics**: CPU, Memory, Request count
- **Service URL**: Available in App Runner console

---

**Next**: Deploy frontend to Amplify (see `DEPLOY_NOW.md`)











