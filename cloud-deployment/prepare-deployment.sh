#!/bin/bash

set -e

echo "🔧 Preparing MV-OS for Cloud Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check prerequisites
echo "📋 Checking Prerequisites..."
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found"
    exit 1
fi
echo "✅ AWS CLI installed"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found"
    exit 1
fi
echo "✅ Node.js $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found"
    exit 1
fi
echo "✅ npm $(npm --version)"

# Verify AWS credentials
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "")
if [ -z "$ACCOUNT_ID" ]; then
    echo "❌ AWS credentials not configured"
    exit 1
fi
echo "✅ AWS Account: $ACCOUNT_ID"

REGION=$(aws configure get region || echo "us-east-1")
echo "✅ Region: $REGION"
echo ""

# Verify RDS
echo "📦 Verifying Infrastructure..."
echo ""

RDS_STATUS=$(aws rds describe-db-instances \
    --db-instance-identifier mv-os-db \
    --query "DBInstances[0].DBInstanceStatus" \
    --output text 2>/dev/null || echo "not-found")

if [ "$RDS_STATUS" = "available" ]; then
    echo "✅ RDS Database: Available"
    RDS_ENDPOINT=$(aws rds describe-db-instances \
        --db-instance-identifier mv-os-db \
        --query "DBInstances[0].Endpoint.Address" \
        --output text)
    echo "   Endpoint: $RDS_ENDPOINT"
else
    echo "⚠️  RDS Database: Not found or not available"
    echo "   Status: $RDS_STATUS"
fi

# Verify Secrets
DB_SECRET=$(aws secretsmanager describe-secret \
    --secret-id mv-os/database-url \
    --query 'ARN' \
    --output text 2>/dev/null || echo "")

JWT_SECRET=$(aws secretsmanager describe-secret \
    --secret-id mv-os/jwt-secret \
    --query 'ARN' \
    --output text 2>/dev/null || echo "")

if [ -n "$DB_SECRET" ] && [ -n "$JWT_SECRET" ]; then
    echo "✅ Secrets Manager: Configured"
else
    echo "⚠️  Secrets Manager: Not configured"
    echo "   Running setup-secrets.sh..."
    ./setup-secrets.sh
fi

# Verify ECR
ECR_BACKEND=$(aws ecr describe-repositories \
    --repository-names mv-os-backend \
    --query 'repositories[0].repositoryUri' \
    --output text 2>/dev/null || echo "")

if [ -n "$ECR_BACKEND" ]; then
    echo "✅ ECR Repository: mv-os-backend"
else
    echo "⚠️  ECR Repository: Creating..."
    aws ecr create-repository \
        --repository-name mv-os-backend \
        --region $REGION \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256 > /dev/null
    echo "✅ ECR Repository: Created"
fi

echo ""

# Build backend
echo "🔨 Building Backend..."
echo ""

cd ../backend

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Backend build successful"
else
    echo "❌ Backend build failed"
    exit 1
fi

cd ..

echo ""

# Check Git repository
echo "📦 Checking Git Repository..."
echo ""

if [ -d ".git" ]; then
    GIT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
    if [ -n "$GIT_REMOTE" ]; then
        echo "✅ Git repository: $GIT_REMOTE"
        echo "   Ready for source-based deployment"
    else
        echo "⚠️  Git repository: No remote configured"
        echo "   Consider pushing to GitHub/GitLab for App Runner deployment"
    fi
else
    echo "⚠️  Git repository: Not initialized"
    echo "   Consider initializing Git for source-based deployment"
fi

echo ""

# Create deployment summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Preparation Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📋 Deployment Information:"
echo ""
echo "   AWS Account: $ACCOUNT_ID"
echo "   Region: $REGION"
if [ -n "$RDS_ENDPOINT" ]; then
    echo "   Database: $RDS_ENDPOINT"
fi
if [ -n "$ECR_BACKEND" ]; then
    echo "   ECR Backend: $ECR_BACKEND"
fi
if [ -n "$GIT_REMOTE" ]; then
    echo "   Git Remote: $GIT_REMOTE"
fi
echo ""

echo "🚀 Next Steps:"
echo ""
echo "   1. Deploy Backend to App Runner:"
echo "      → https://console.aws.amazon.com/apprunner"
echo "      → Create service"
if [ -n "$GIT_REMOTE" ]; then
    echo "      → Source: Source code repository"
    echo "      → Connect: $GIT_REMOTE"
else
    echo "      → Source: Container registry (if Docker available)"
    echo "      → OR: Push code to GitHub/GitLab first"
fi
echo "      → Build: cd backend && npm install && npm run build"
echo "      → Start: cd backend && npm run start:prod"
echo "      → Secrets: Use mv-os/database-url and mv-os/jwt-secret"
echo ""
echo "   2. Deploy Frontend to Amplify:"
echo "      → cd frontend"
echo "      → npm install -g @aws-amplify/cli"
echo "      → amplify init && amplify add hosting"
echo "      → amplify publish"
echo ""
echo "   3. Run Database Migrations:"
echo "      → See cloud-deployment/DEPLOY_NOW.md"
echo ""











