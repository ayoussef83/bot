# 🐳 Docker Deployment Guide - MV-OS

## Overview

Docker-based deployment is more reliable than source-based for NestJS applications. This guide shows how to deploy using Docker containers.

## Prerequisites

- Docker Desktop installed and running
- AWS CLI configured
- ECR repository created (script does this automatically)

## Quick Deploy

```bash
./cloud-deployment/deploy-docker.sh
```

This script will:
1. Build Docker image
2. Push to ECR
3. Create/update App Runner service with container image

## Manual Steps

### Step 1: Build Docker Image

```bash
cd backend
docker build -t mv-os-backend:latest -f Dockerfile .
```

### Step 2: Tag and Push to ECR

```bash
# Get ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 149959196988.dkr.ecr.us-east-1.amazonaws.com

# Tag image
docker tag mv-os-backend:latest 149959196988.dkr.ecr.us-east-1.amazonaws.com/mv-os-backend:latest

# Push image
docker push 149959196988.dkr.ecr.us-east-1.amazonaws.com/mv-os-backend:latest
```

### Step 3: Create App Runner Service

**Via Console:**
1. Go to: https://console.aws.amazon.com/apprunner
2. Click "Create service"
3. Source: **Container registry** → ECR
4. Select: `mv-os-backend` repository
5. Image tag: `latest`
6. Port: `3000`
7. Environment variables:
   - `NODE_ENV` = `production`
   - `PORT` = `3000`
8. Secrets (from Secrets Manager):
   - `DATABASE_URL` → `mv-os/database-url`
   - `JWT_SECRET` → `mv-os/jwt-secret`
9. Instance: 0.25 vCPU, 0.5 GB
10. Health check: `/api/health`
11. Create service

## Dockerfile Details

The Dockerfile uses multi-stage build:
- **Builder stage**: Installs dependencies, generates Prisma client, builds TypeScript
- **Production stage**: Only production dependencies, runs the built application

## Benefits

- ✅ Consistent builds (same locally and in cloud)
- ✅ No build issues (everything pre-built)
- ✅ Faster deployments
- ✅ Better for production
- ✅ Easier to debug (test locally first)

## Updating Deployment

After code changes:

```bash
# 1. Build new image
cd backend
docker build -t mv-os-backend:latest -f Dockerfile .

# 2. Push to ECR
./cloud-deployment/deploy-docker.sh

# Or manually:
docker tag mv-os-backend:latest 149959196988.dkr.ecr.us-east-1.amazonaws.com/mv-os-backend:latest
docker push 149959196988.dkr.ecr.us-east-1.amazonaws.com/mv-os-backend:latest

# 3. App Runner will auto-deploy if AutoDeploymentsEnabled is true
```

## Troubleshooting

### Docker build fails
- Check Dockerfile syntax
- Verify all files are in place
- Check .dockerignore isn't excluding needed files

### Image push fails
- Verify ECR login
- Check IAM permissions
- Verify repository exists

### App Runner service fails
- Check CloudWatch logs
- Verify environment variables
- Check health endpoint

---

**See `deploy-docker.sh` for automated deployment!**












