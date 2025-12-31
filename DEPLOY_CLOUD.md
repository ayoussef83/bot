# ☁️ Cloud Deployment - No Local Installation Required

## ✅ Current Status

- ✅ **RDS Database**: Already deployed on AWS (us-east-1)
- ✅ **Secrets Manager**: Database URL and JWT secret configured
- ✅ **Backend**: Deployed on AWS App Runner  
  - API Base: https://mzmeyp2cw9.us-east-1.awsapprunner.com/api
- ⚠️  **Frontend**: Ready to deploy

## 🚀 Deployment Options

### Option 1: AWS App Runner + Amplify (Recommended - Easiest)

**No Docker needed on your machine!** AWS will build everything.

#### Step 1: Deploy Backend to App Runner

**Via AWS Console (Easiest):**

1. Go to: https://console.aws.amazon.com/apprunner
2. Click **"Create service"**
3. **Source**: Select **"Source code repository"** → Connect GitHub/GitLab
   - OR **"Container registry"** → Use ECR (if you have Docker)
4. **Configuration**:
   - **Build command**: `cd backend && npm install && npm run build`
   - **Start command**: `cd backend && npm run start:prod`
   - **Port**: `3000`
5. **Environment variables**:
   - `DATABASE_URL`: From Secrets Manager → `mv-os/database-url`
   - `JWT_SECRET`: From Secrets Manager → `mv-os/jwt-secret`
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
6. **Instance**: 0.25 vCPU, 0.5 GB memory
7. Click **"Create & deploy"**
8. Wait 5-10 minutes for deployment
9. Note the service URL (e.g., `https://xxxxx.us-east-1.awsapprunner.com`)

#### Step 2: Deploy Frontend to Amplify

```bash
# Install Amplify CLI (one time)
npm install -g @aws-amplify/cli

# Initialize Amplify
cd frontend
amplify init
# Follow prompts:
# - Project name: mv-os-frontend
# - Environment: production
# - Framework: react
# - Source directory: .
# - Build command: npm run build
# - Start command: npm start

# Add hosting
amplify add hosting
# Select: Hosting with Amplify Console

# Configure environment
amplify env add
# Add: NEXT_PUBLIC_API_URL = https://YOUR_APP_RUNNER_URL/api

# Deploy
amplify publish
```

### Option 2: AWS CodeBuild + CodePipeline (Fully Automated)

This option builds and deploys automatically on every git push.

1. **Create CodeBuild Project**:
   - Source: GitHub/GitLab
   - Build spec: Use `buildspec.yml` (see below)
   - Environment: Node.js 18
   - Artifacts: Push to ECR

2. **Create CodePipeline**:
   - Source → Build → Deploy to App Runner

### Option 3: GitHub Actions (CI/CD)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Build Backend
        run: |
          cd backend
          npm install
          npm run build
      - name: Deploy to App Runner
        # Use AWS CLI or SDK to update App Runner service
```

## 📋 Pre-Deployment Checklist

- [x] RDS database created and accessible
- [x] Secrets Manager configured
- [ ] Backend builds successfully (`npm run build` in backend/)
- [ ] Frontend builds successfully (`npm run build` in frontend/)
- [ ] Environment variables documented
- [ ] CORS configured for frontend domain

## 🔧 Post-Deployment Steps

### 1. Run Database Migrations

Once backend is deployed, run migrations:

**Option A: Via AWS Systems Manager (SSM)**
```bash
# Create a one-time task to run migrations
aws ecs run-task \
  --cluster mv-os-cluster \
  --task-definition mv-os-migration \
  --launch-type FARGATE
```

**Option B: Via EC2 (Temporary)**
- Launch small EC2 instance
- Connect to RDS
- Run: `npx prisma migrate deploy && npm run prisma:seed`

**Option C: Via App Runner (One-time container)**
- Create temporary App Runner service with migration command

### 2. Update Frontend API URL

Update `NEXT_PUBLIC_API_URL` in Amplify environment to point to your App Runner URL.

### 3. Test Deployment

- Frontend: Visit Amplify URL
- Backend: Visit `https://YOUR_APP_RUNNER_URL/api/health`
- Login: Use default credentials from seed

## 💰 Cost Breakdown

- **App Runner (Backend)**: ~$5-10/month
- **Amplify (Frontend)**: $0/month (free tier)
- **RDS (Database)**: ~$14.71/month
- **Secrets Manager**: ~$0.40/month
- **Total**: ~$20-25/month

## 🔐 Security Notes

1. **Secrets**: All sensitive data in Secrets Manager
2. **SSL/TLS**: Automatic with App Runner and Amplify
3. **CORS**: Configured for frontend domain only
4. **Database**: Only accessible from App Runner security group

## 📊 Monitoring

- **CloudWatch Logs**: Automatic for App Runner
- **CloudWatch Metrics**: CPU, Memory, Request count
- **Amplify Console**: Frontend build logs and metrics

## 🆘 Troubleshooting

### Backend won't start
- Check CloudWatch logs
- Verify environment variables
- Check database connectivity

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings
- Verify App Runner service is running

### Database connection fails
- Check security group allows App Runner
- Verify Secrets Manager has correct URL
- Check RDS instance is running

---

**For detailed instructions, see `CLOUD_DEPLOYMENT.md`**

