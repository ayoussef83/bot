# ☁️ Cloud Deployment Guide - MV-OS

## Overview

This guide will help you deploy MV-OS entirely to AWS cloud, with no local installation required.

## Architecture

```
┌─────────────────┐
│   CloudFront    │  (CDN for Frontend)
│   + S3/Amplify  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Application    │  (ECS Fargate or App Runner)
│  Load Balancer  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend API   │  (ECS Fargate)
│   (NestJS)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   AWS RDS       │  (PostgreSQL - Already Set Up)
│   PostgreSQL    │
└─────────────────┘
```

## Deployment Options

### Option 1: AWS App Runner (Easiest - Recommended)

**Pros:**
- ✅ No infrastructure management
- ✅ Auto-scaling
- ✅ Built-in load balancing
- ✅ Simple deployment
- ✅ Pay per use

**Steps:**

1. **Deploy Backend to App Runner:**
   ```bash
   # Build and push to ECR first
   ./cloud-deployment/deploy-to-aws.sh
   
   # Then create App Runner service via AWS Console
   # Or use AWS CLI (see below)
   ```

2. **Deploy Frontend to Amplify:**
   ```bash
   # Install Amplify CLI
   npm install -g @aws-amplify/cli
   
   # Initialize Amplify
   cd frontend
   amplify init
   amplify add hosting
   amplify publish
   ```

### Option 2: ECS Fargate (More Control)

**Pros:**
- ✅ Full control over infrastructure
- ✅ Better for complex setups
- ✅ Can use existing VPC
- ✅ More cost-effective at scale

**Steps:**

1. **Create ECR Repositories:**
   ```bash
   ./cloud-deployment/deploy-to-aws.sh
   ```

2. **Create ECS Task Definitions:**
   - Use `cloud-deployment/ecs-task-definition.json` as template
   - Update with your account ID and secrets

3. **Create ECS Services:**
   - Use `cloud-deployment/ecs-service.json` as template
   - Configure load balancer

### Option 3: EC2 (Traditional)

**Pros:**
- ✅ Full server control
- ✅ Can run multiple services
- ✅ Good for custom requirements

**Steps:**

1. **Launch EC2 Instance:**
   - Use Amazon Linux 2 or Ubuntu
   - t3.medium or larger
   - Configure security groups

2. **Install Docker:**
   ```bash
   sudo yum install docker -y
   sudo systemctl start docker
   sudo usermod -aG docker ec2-user
   ```

3. **Deploy with Docker Compose:**
   ```bash
   # Copy files to EC2
   scp -r . ec2-user@YOUR_EC2_IP:/home/ec2-user/mv-os
   
   # SSH to EC2
   ssh ec2-user@YOUR_EC2_IP
   
   # Run
   cd mv-os
   docker-compose -f cloud-deployment/docker-compose.prod.yml up -d
   ```

## Recommended: AWS App Runner Setup

### Step 1: Deploy Backend to App Runner

1. **Build and Push to ECR:**
   ```bash
   ./cloud-deployment/deploy-to-aws.sh
   ```

2. **Create App Runner Service:**
   - Go to: https://console.aws.amazon.com/apprunner
   - Click "Create service"
   - Source: Container registry (ECR)
   - Select: mv-os-backend repository
   - Configure:
     - CPU: 0.25 vCPU
     - Memory: 0.5 GB
     - Port: 3000
   - Environment variables:
     - `DATABASE_URL`: From Secrets Manager
     - `JWT_SECRET`: From Secrets Manager
     - `NODE_ENV`: production
   - Auto-deploy: Enabled

3. **Get Backend URL:**
   - App Runner provides: `https://xxxxx.us-east-1.awsapprunner.com`

### Step 2: Deploy Frontend to Amplify

1. **Install Amplify CLI:**
   ```bash
   npm install -g @aws-amplify/cli
   amplify configure
   ```

2. **Initialize Amplify:**
   ```bash
   cd frontend
   amplify init
   # Follow prompts
   ```

3. **Add Hosting:**
   ```bash
   amplify add hosting
   # Select: Hosting with Amplify Console
   ```

4. **Configure Environment:**
   - Update `next.config.js`:
   ```javascript
   env: {
     NEXT_PUBLIC_API_URL: 'https://YOUR_APP_RUNNER_URL'
   }
   ```

5. **Deploy:**
   ```bash
   amplify publish
   ```

### Step 3: Set Up Secrets Manager

1. **Store Database URL:**
   ```bash
   aws secretsmanager create-secret \
     --name mv-os/database-url \
     --secret-string "postgresql://postgres:PASSWORD@ENDPOINT:5432/mv_os?schema=public"
   ```

2. **Store JWT Secret:**
   ```bash
   aws secretsmanager create-secret \
     --name mv-os/jwt-secret \
     --secret-string "your-super-secret-jwt-key"
   ```

## Environment Variables

### Backend (App Runner/ECS)
```env
DATABASE_URL=postgresql://... (from Secrets Manager)
JWT_SECRET=... (from Secrets Manager)
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=3000
```

### Frontend (Amplify)
```env
NEXT_PUBLIC_API_URL=https://mzmeyp2cw9.us-east-1.awsapprunner.com/api
```

## Cost Estimation

### App Runner (Backend)
- **CPU**: 0.25 vCPU = ~$0.007/hour = ~$5/month
- **Memory**: 0.5 GB = included
- **Requests**: $0.0000000084 per request
- **Total**: ~$5-10/month (low traffic)

### Amplify (Frontend)
- **Hosting**: Free tier (100 GB transfer/month)
- **Build minutes**: 1000 min/month free
- **Total**: $0/month (within free tier)

### RDS (Already Set Up)
- **db.t3.micro**: ~$12.41/month
- **Storage**: ~$2.30/month
- **Total**: ~$14.71/month

### **Total Estimated**: ~$20-25/month

## Quick Deploy Script

```bash
# 1. Build and push images
./cloud-deployment/deploy-to-aws.sh

# 2. Create App Runner service (via console or CLI)
# 3. Deploy frontend to Amplify
cd frontend && amplify publish
```

## Post-Deployment

1. **Run Migrations:**
   ```bash
   # Connect to App Runner container or use ECS exec
   npx prisma migrate deploy
   npm run prisma:seed
   ```

2. **Update Frontend API URL:**
   - Update `NEXT_PUBLIC_API_URL` in Amplify environment

3. **Configure CORS:**
   - Backend already configured for frontend domain

## Monitoring

- **CloudWatch Logs**: Automatic for App Runner/ECS
- **CloudWatch Metrics**: CPU, Memory, Request count
- **X-Ray**: Enable for distributed tracing

## Security

1. **Use Secrets Manager** for sensitive data
2. **Enable SSL/TLS** (automatic with App Runner/Amplify)
3. **Configure Security Groups** properly
4. **Use IAM Roles** (not access keys)
5. **Enable WAF** for production

## Scaling

- **App Runner**: Auto-scales based on traffic
- **ECS**: Configure auto-scaling policies
- **RDS**: Can scale instance size as needed

## Backup & Recovery

- **RDS**: Automated backups enabled (7 days retention)
- **Application**: Use ECR for image versioning
- **Database**: Regular snapshots

---

**See `cloud-deployment/` folder for Dockerfiles and configuration files.**

