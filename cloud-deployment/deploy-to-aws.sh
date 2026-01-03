#!/bin/bash

echo "☁️  Deploying MV-OS to AWS Cloud"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found"
    exit 1
fi

# Get AWS account info
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-1")

echo "✅ AWS Account: $ACCOUNT_ID"
echo "✅ Region: $REGION"
echo ""

# Step 1: Create ECR repositories
echo "📦 Step 1: Creating ECR Repositories..."
echo ""

# Backend repository
aws ecr describe-repositories --repository-names mv-os-backend &> /dev/null
if [ $? -ne 0 ]; then
    aws ecr create-repository --repository-name mv-os-backend --region $REGION > /dev/null
    echo "✅ Created ECR repository: mv-os-backend"
else
    echo "✅ ECR repository exists: mv-os-backend"
fi

# Frontend repository
aws ecr describe-repositories --repository-names mv-os-frontend &> /dev/null
if [ $? -ne 0 ]; then
    aws ecr create-repository --repository-name mv-os-frontend --region $REGION > /dev/null
    echo "✅ Created ECR repository: mv-os-frontend"
else
    echo "✅ ECR repository exists: mv-os-frontend"
fi

echo ""

# Step 2: Build and push backend
echo "📦 Step 2: Building and Pushing Backend..."
echo ""

ECR_BACKEND="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/mv-os-backend:latest"
ECR_FRONTEND="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/mv-os-frontend:latest"

# Login to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# Build backend
echo "Building backend Docker image..."
cd ..
docker build -f cloud-deployment/Dockerfile.backend -t mv-os-backend:latest backend/
docker tag mv-os-backend:latest $ECR_BACKEND

# Push backend
echo "Pushing backend to ECR..."
docker push $ECR_BACKEND
echo "✅ Backend pushed to ECR"
echo ""

# Step 3: Build and push frontend
echo "📦 Step 3: Building and Pushing Frontend..."
echo ""

# Build frontend
echo "Building frontend Docker image..."
docker build -t mv-os-frontend:latest frontend/
docker tag mv-os-frontend:latest $ECR_FRONTEND

# Push frontend
echo "Pushing frontend to ECR..."
docker push $ECR_FRONTEND
echo "✅ Frontend pushed to ECR"
echo ""

# Step 4: Create ECS cluster
echo "📦 Step 4: Creating ECS Cluster..."
echo ""

aws ecs describe-clusters --clusters mv-os-cluster &> /dev/null
if [ $? -ne 0 ]; then
    aws ecs create-cluster --cluster-name mv-os-cluster --region $REGION > /dev/null
    echo "✅ Created ECS cluster: mv-os-cluster"
else
    echo "✅ ECS cluster exists: mv-os-cluster"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Docker Images Built and Pushed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Create ECS Task Definitions (see cloud-deployment/ecs-task-definition.json)"
echo "2. Create ECS Services (see cloud-deployment/ecs-service.json)"
echo "3. Set up Application Load Balancer"
echo "4. Configure Secrets Manager for environment variables"
echo ""
echo "Or use AWS App Runner for simpler deployment (see CLOUD_DEPLOYMENT.md)"












