# ☁️ Cloud Deployment Quick Start

## Goal: Deploy Everything to AWS (No Local Installation)

### Current Status
- ✅ RDS Database: Already on AWS (us-east-1)
- ⚠️  Backend: Needs deployment
- ⚠️  Frontend: Needs deployment

## 🚀 Recommended: AWS App Runner + Amplify

### Step 1: Set Up Secrets (2 minutes)

```bash
cd cloud-deployment
./setup-secrets.sh
```

This creates:
- Database URL in Secrets Manager
- JWT Secret in Secrets Manager

### Step 2: Build and Push Docker Images (5 minutes)

```bash
# Make sure Docker is running
./deploy-to-aws.sh
```

This will:
- Create ECR repositories
- Build Docker images
- Push to AWS ECR

### Step 3: Deploy Backend to App Runner (5 minutes)

**Via AWS Console:**
1. Go to: https://console.aws.amazon.com/apprunner
2. Click "Create service"
3. Source: Container registry → ECR
4. Select: `mv-os-backend` repository
5. Configuration:
   - CPU: 0.25 vCPU
   - Memory: 0.5 GB
   - Port: 3000
6. Environment:
   - Add secrets from Secrets Manager:
     - `DATABASE_URL` → `mv-os/database-url`
     - `JWT_SECRET` → `mv-os/jwt-secret`
   - Add variable: `NODE_ENV` = `production`
7. Create service
8. Wait for deployment (5-10 minutes)
9. Note the service URL (e.g., `https://xxxxx.us-east-1.awsapprunner.com`)

### Step 4: Deploy Frontend to Amplify (5 minutes)

```bash
# Install Amplify CLI (if not installed)
npm install -g @aws-amplify/cli

# Initialize Amplify
cd frontend
amplify init
# Follow prompts:
# - Project name: mv-os-frontend
# - Environment: production
# - Default editor: (your choice)
# - App type: javascript
# - Framework: react
# - Source directory: .
# - Distribution directory: .next
# - Build command: npm run build
# - Start command: npm start

# Add hosting
amplify add hosting
# Select: Hosting with Amplify Console

# Configure environment variable
amplify env add
# Add: NEXT_PUBLIC_API_URL = https://YOUR_APP_RUNNER_URL/api

# Deploy
amplify publish
```

### Step 5: Run Database Migrations

Once backend is deployed, run migrations:

**Option A: Via ECS Exec (if using ECS)**
```bash
aws ecs execute-command \
  --cluster mv-os-cluster \
  --task TASK_ID \
  --container mv-os-backend \
  --command "npx prisma migrate deploy && npm run prisma:seed" \
  --interactive
```

**Option B: Via App Runner (temporary container)**
- Create a one-time task or use AWS Systems Manager

**Option C: Via EC2 (temporary)**
- Launch small EC2 instance
- Connect to RDS
- Run migrations

### Step 6: Access Your Cloud System

- **Frontend**: Amplify provides URL (e.g., `https://main.xxxxx.amplifyapp.com`)
- **Backend**: App Runner provides URL (e.g., `https://xxxxx.us-east-1.awsapprunner.com`)

## 📊 Architecture

```
Internet
   │
   ├─→ CloudFront + Amplify (Frontend)
   │   └─→ https://your-app.amplifyapp.com
   │
   └─→ App Runner (Backend API)
       └─→ https://xxxxx.awsapprunner.com/api
           │
           └─→ RDS PostgreSQL (Database)
               └─→ mv-os-db.xxxxx.rds.amazonaws.com
```

## 💰 Cloud Costs

**Monthly Estimate:**
- App Runner (Backend): ~$5-10/month
- Amplify (Frontend): $0/month (free tier)
- RDS (Database): ~$14.71/month
- **Total: ~$20-25/month**

## ✅ Benefits of Cloud Deployment

- ✅ No local installation needed
- ✅ Accessible from anywhere
- ✅ Auto-scaling
- ✅ Automatic backups
- ✅ High availability
- ✅ SSL/TLS included
- ✅ CDN for frontend

## 🔧 Alternative: Single EC2 Instance

If you prefer a simpler setup:

1. **Launch EC2 Instance:**
   - t3.medium or larger
   - Amazon Linux 2
   - Security group: Allow HTTP (80), HTTPS (443), SSH (22)

2. **Install Docker:**
   ```bash
   sudo yum update -y
   sudo yum install docker -y
   sudo systemctl start docker
   sudo usermod -aG docker ec2-user
   ```

3. **Deploy:**
   ```bash
   # Copy project files
   git clone YOUR_REPO
   cd Mvalley\ System
   
   # Update .env with RDS connection
   # Run with Docker Compose
   docker-compose -f cloud-deployment/docker-compose.prod.yml up -d
   ```

4. **Set up Nginx (reverse proxy):**
   ```bash
   sudo yum install nginx -y
   # Configure nginx to proxy to backend:3000
   # Serve frontend from /var/www/html
   ```

## 📖 Full Guide

See `CLOUD_DEPLOYMENT.md` for detailed instructions.












