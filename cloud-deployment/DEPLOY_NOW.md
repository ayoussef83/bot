# 🚀 Deploy MV-OS to AWS Cloud - Right Now!

## Quick Deploy (Choose Your Path)

### Path 1: Automated Deployment (If you have Docker)

```bash
cd cloud-deployment
./create-app-runner-service.sh
```

This will:
1. Build Docker image
2. Push to ECR
3. Create App Runner service
4. Configure secrets automatically

### Path 2: Console-Based Deployment (No Docker Needed!)

#### Step 1: Deploy Backend (5 minutes)

1. **Go to AWS App Runner**: https://console.aws.amazon.com/apprunner
2. **Click**: "Create service"
3. **Source**: Choose one:
   
   **Option A: Source Code Repository (Recommended)**
   - Select "Source code repository"
   - Connect GitHub/GitLab/Bitbucket
   - Select your repository
   - Branch: `main` or `master`
   - **Build command**: `cd backend && npm install && npm run build`
   - **Start command**: `cd backend && npm run start:prod`
   - **Port**: `3000`
   
   **Option B: Container Registry (If you have Docker)**
   - Select "Container registry"
   - Choose ECR: `mv-os-backend`
   - Image tag: `latest`

4. **Configuration**:
   - **Service name**: `mv-os-backend`
   - **Instance**: 0.25 vCPU, 0.5 GB memory
   - **Port**: `3000`

5. **Environment Variables**:
   - Click "Add environment variable"
   - Add these:
     ```
     NODE_ENV = production
     PORT = 3000
     ```
   - Click "Add secret"
   - Add:
     ```
     DATABASE_URL = mv-os/database-url (from Secrets Manager)
     JWT_SECRET = mv-os/jwt-secret (from Secrets Manager)
     ```

6. **Health Check**:
   - Path: `/api/health`
   - Interval: 10 seconds

7. **Auto-deploy**: Enable

8. **Click**: "Create & deploy"

9. **Wait**: 5-10 minutes for deployment

10. **Note the URL**: e.g., `https://xxxxx.us-east-1.awsapprunner.com`

#### Step 2: Deploy Frontend (5 minutes)

```bash
# Install Amplify CLI (one time)
npm install -g @aws-amplify/cli

# Initialize
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

# Set environment variable
# Update .env.local or use Amplify console:
# NEXT_PUBLIC_API_URL = https://YOUR_APP_RUNNER_URL/api

# Deploy
amplify publish
```

#### Step 3: Run Database Migrations

Once backend is deployed, you need to run migrations:

**Option A: Via EC2 (Easiest)**
```bash
# 1. Launch small EC2 instance (t3.micro)
# 2. SSH into it
# 3. Install Node.js:
   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
   sudo yum install -y nodejs

# 4. Clone your repo or copy files
# 5. Install dependencies:
   cd backend
   npm install

# 6. Get database URL from Secrets Manager:
   aws secretsmanager get-secret-value \
     --secret-id mv-os/database-url \
     --query SecretString --output text > .env
   echo "DATABASE_URL=$(cat .env)" >> .env

# 7. Run migrations:
   npx prisma generate
   npx prisma migrate deploy
   npm run prisma:seed

# 8. Terminate EC2 instance when done
```

**Option B: Via App Runner (One-time task)**
- Create temporary App Runner service
- Set start command to: `cd backend && npx prisma migrate deploy && npm run prisma:seed && npm run start:prod`
- Delete after migrations complete

#### Step 4: Test Your Deployment

1. **Frontend**: Visit Amplify URL
2. **Backend Health**: Visit `https://YOUR_APP_RUNNER_URL/api/health`
3. **Login**: Use default credentials:
   - Email: `admin@mindvalley.eg`
   - Password: `admin123`

## ✅ You're Done!

Your system is now fully cloud-based:
- ✅ Backend: AWS App Runner
- ✅ Frontend: AWS Amplify
- ✅ Database: AWS RDS
- ✅ Secrets: AWS Secrets Manager

**Total Cost**: ~$20-25/month

## 🔧 Troubleshooting

### Backend won't start
- Check CloudWatch logs in App Runner console
- Verify environment variables are set
- Check database connectivity

### Frontend can't connect
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings in backend
- Verify App Runner service is running

### Database connection fails
- Check RDS security group allows App Runner
- Verify Secrets Manager has correct URL
- Check RDS instance is running

## 📊 Monitoring

- **App Runner**: CloudWatch logs and metrics
- **Amplify**: Build logs and deployment history
- **RDS**: CloudWatch metrics

---

**Need help?** See `DEPLOY_CLOUD.md` for detailed instructions.











