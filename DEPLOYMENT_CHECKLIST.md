# ✅ MV-OS Deployment Checklist

## Pre-Deployment
- [x] All code committed to GitHub
- [x] All changes pushed to main branch
- [ ] AWS Account configured
- [ ] AWS CLI installed and configured
- [ ] RDS Database instance created
- [ ] Secrets Manager configured

## Step 1: Backend Deployment (AWS App Runner)

### Configuration
- [ ] Go to: https://console.aws.amazon.com/apprunner
- [ ] Click "Create service"
- [ ] Select "Source code repository"
- [ ] Connect GitHub account
- [ ] Select repository: `ayoussef83/bot`
- [ ] Branch: `main`

### Build Settings
- [ ] Build command: `cd backend && npm install && npm run build`
- [ ] Start command: `cd backend && npm run start:prod`
- [ ] Port: `3000`

### Service Configuration
- [ ] Service name: `mv-os-backend`
- [ ] Instance: 0.25 vCPU, 0.5 GB memory
- [ ] Auto-deploy: Enabled

### Environment Variables
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `3000`

### Secrets (from Secrets Manager)
- [ ] `DATABASE_URL` = `mv-os/database-url`
- [ ] `JWT_SECRET` = `mv-os/jwt-secret`

### Health Check
- [ ] Path: `/api/health`
- [ ] Interval: 10 seconds

### Deploy
- [ ] Click "Create & deploy"
- [ ] Wait 5-10 minutes
- [ ] **Note Backend URL**: `https://xxxxx.us-east-1.awsapprunner.com`

## Step 2: Frontend Deployment (AWS Amplify)

### Configuration
- [ ] Go to: https://console.aws.amazon.com/amplify
- [ ] Click "New app" → "Host web app"
- [ ] Connect GitHub account
- [ ] Select repository: `ayoussef83/bot`
- [ ] Branch: `main`

### Build Settings
- [ ] Verify amplify.yml exists (already configured)
- [ ] Base directory: `frontend` (or auto-detect)

### Environment Variables
- [ ] `NEXT_PUBLIC_API_URL` = `https://YOUR_APP_RUNNER_URL/api`
  - Replace `YOUR_APP_RUNNER_URL` with backend URL from Step 1

### Deploy
- [ ] Click "Save and deploy"
- [ ] Wait 5-10 minutes
- [ ] **Note Frontend URL**: `https://main.xxxxx.amplifyapp.com`

## Step 3: Database Migrations

### Option A: Via EC2
- [ ] Launch t3.micro EC2 instance
- [ ] SSH into instance
- [ ] Install Node.js
- [ ] Clone repository
- [ ] Install dependencies
- [ ] Get DATABASE_URL from Secrets Manager
- [ ] Run: `npx prisma generate`
- [ ] Run: `npx prisma migrate deploy`
- [ ] Run: `npm run prisma:seed`
- [ ] Terminate EC2 instance

### Option B: Via Local Machine
- [ ] Configure AWS CLI
- [ ] Get DATABASE_URL from Secrets Manager
- [ ] Run: `npx prisma generate`
- [ ] Run: `npx prisma migrate deploy`
- [ ] Run: `npm run prisma:seed`

## Step 4: Verification

### Backend
- [ ] Health check: `https://YOUR_APP_RUNNER_URL/api/health`
- [ ] Should return: `{"status":"ok"}`

### Frontend
- [ ] Visit Amplify URL
- [ ] Should load login page
- [ ] Test login:
  - Email: `admin@mindvalley.eg`
  - Password: `admin123`

### Database
- [ ] Verify tables created
- [ ] Verify seed data loaded
- [ ] Test user login works

## Post-Deployment

### Monitoring
- [ ] Set up CloudWatch alarms (optional)
- [ ] Monitor App Runner logs
- [ ] Monitor Amplify build logs
- [ ] Check RDS performance

### Security
- [ ] Verify CORS settings
- [ ] Check security groups
- [ ] Review IAM roles
- [ ] Enable MFA (recommended)

### Documentation
- [ ] Document backend URL
- [ ] Document frontend URL
- [ ] Document database connection
- [ ] Save credentials securely

---

**Status**: Ready to deploy
**Estimated Time**: 20-30 minutes
**Cost**: ~$20-25/month







