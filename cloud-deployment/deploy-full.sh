#!/bin/bash

set -e

echo "☁️  Full Cloud Deployment - MV-OS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check prerequisites
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first."
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-1")

echo "✅ AWS Account: $ACCOUNT_ID"
echo "✅ Region: $REGION"
echo ""

# Step 1: Verify RDS is running
echo "📦 Step 1: Verifying RDS Database..."
RDS_STATUS=$(aws rds describe-db-instances \
    --db-instance-identifier mv-os-db \
    --query "DBInstances[0].DBInstanceStatus" \
    --output text 2>/dev/null || echo "not-found")

if [ "$RDS_STATUS" != "available" ]; then
    echo "⚠️  RDS instance not found or not available"
    echo "   Status: $RDS_STATUS"
    echo "   Please ensure RDS is set up first"
    exit 1
fi

echo "✅ RDS Database: $RDS_STATUS"
echo ""

# Step 2: Verify Secrets Manager
echo "📦 Step 2: Verifying Secrets Manager..."
DB_SECRET=$(aws secretsmanager describe-secret \
    --secret-id mv-os/database-url \
    --query 'ARN' \
    --output text 2>/dev/null || echo "")

JWT_SECRET=$(aws secretsmanager describe-secret \
    --secret-id mv-os/jwt-secret \
    --query 'ARN' \
    --output text 2>/dev/null || echo "")

if [ -z "$DB_SECRET" ] || [ -z "$JWT_SECRET" ]; then
    echo "⚠️  Secrets not found. Setting up..."
    ./setup-secrets.sh
else
    echo "✅ Secrets configured"
fi
echo ""

# Step 3: Create ECR repositories
echo "📦 Step 3: Setting up ECR Repositories..."
echo ""

# Backend repository
aws ecr describe-repositories --repository-names mv-os-backend --region $REGION &> /dev/null
if [ $? -ne 0 ]; then
    aws ecr create-repository \
        --repository-name mv-os-backend \
        --region $REGION \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256 > /dev/null
    echo "✅ Created ECR repository: mv-os-backend"
else
    echo "✅ ECR repository exists: mv-os-backend"
fi

# Frontend repository
aws ecr describe-repositories --repository-names mv-os-frontend --region $REGION &> /dev/null
if [ $? -ne 0 ]; then
    aws ecr create-repository \
        --repository-name mv-os-frontend \
        --region $REGION \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256 > /dev/null
    echo "✅ Created ECR repository: mv-os-frontend"
else
    echo "✅ ECR repository exists: mv-os-frontend"
fi

echo ""

# Step 4: Check if Docker is available for building
echo "📦 Step 4: Checking Docker..."
if command -v docker &> /dev/null && docker info &> /dev/null; then
    echo "✅ Docker is available - can build images"
    DOCKER_AVAILABLE=true
else
    echo "⚠️  Docker not available - will use source-based deployment"
    DOCKER_AVAILABLE=false
fi
echo ""

# Step 5: Deploy Backend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Backend Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "Building and pushing Docker image..."
    ./deploy-to-aws.sh
    echo ""
    echo "✅ Docker image pushed to ECR"
    echo ""
    echo "Next: Deploy to App Runner via console:"
    echo "   https://console.aws.amazon.com/apprunner"
    echo "   Use ECR source: $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/mv-os-backend:latest"
else
    echo "📝 For source-based deployment, use AWS App Runner Console:"
    echo ""
    echo "1. Go to: https://console.aws.amazon.com/apprunner"
    echo "2. Click 'Create service'"
    echo "3. Select 'Source code repository'"
    echo "4. Connect your GitHub/GitLab repository"
    echo "5. Configuration:"
    echo "   - Build command: cd backend && npm install && npm run build"
    echo "   - Start command: cd backend && npm run start:prod"
    echo "   - Port: 3000"
    echo "6. Environment:"
    echo "   - DATABASE_URL: From Secrets Manager (mv-os/database-url)"
    echo "   - JWT_SECRET: From Secrets Manager (mv-os/jwt-secret)"
    echo "   - NODE_ENV: production"
    echo "   - PORT: 3000"
    echo "7. Instance: 0.25 vCPU, 0.5 GB"
    echo ""
fi

echo ""

# Step 6: Frontend Deployment Instructions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎨 Frontend Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Deploy frontend to AWS Amplify:"
echo ""
echo "1. Install Amplify CLI:"
echo "   npm install -g @aws-amplify/cli"
echo ""
echo "2. Initialize Amplify:"
echo "   cd ../frontend"
echo "   amplify init"
echo "   # Follow prompts (project name: mv-os-frontend)"
echo ""
echo "3. Add hosting:"
echo "   amplify add hosting"
echo "   # Select: Hosting with Amplify Console"
echo ""
echo "4. Configure environment:"
echo "   # Update .env or amplify env add"
echo "   # NEXT_PUBLIC_API_URL = https://YOUR_APP_RUNNER_URL/api"
echo ""
echo "5. Deploy:"
echo "   amplify publish"
echo ""

# Step 7: Database Migration Instructions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  Database Migrations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "After backend is deployed, run migrations:"
echo ""
echo "Option 1: Via EC2 (Temporary)"
echo "  1. Launch small EC2 instance (t3.micro)"
echo "  2. Install Node.js and Prisma"
echo "  3. Connect to RDS and run:"
echo "     npx prisma migrate deploy"
echo "     npm run prisma:seed"
echo ""
echo "Option 2: Via App Runner (One-time task)"
echo "  Create temporary App Runner service with migration command"
echo ""
echo "Option 3: Via ECS (If using ECS)"
echo "  aws ecs run-task with migration command"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📖 See DEPLOY_CLOUD.md for detailed instructions"
echo ""












