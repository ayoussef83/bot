#!/bin/bash

set -e

echo "🐳 Deploying MV-OS Backend with Docker to App Runner"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-1")

echo "✅ AWS Account: $ACCOUNT_ID"
echo "✅ Region: $REGION"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker Desktop."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Step 1: Ensure ECR repository exists
echo "📦 Step 1: Setting up ECR Repository..."
echo ""

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

ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/mv-os-backend:latest"

echo ""

# Step 2: Login to ECR
echo "📦 Step 2: Logging in to ECR..."
echo ""

aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

echo "✅ Logged in to ECR"
echo ""

# Step 3: Build Docker image
echo "📦 Step 3: Building Docker Image..."
echo ""

cd ../backend

docker build -t mv-os-backend:latest -f Dockerfile .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed"
    exit 1
fi

echo "✅ Docker image built successfully"
echo ""

# Step 4: Tag and push to ECR
echo "📦 Step 4: Pushing to ECR..."
echo ""

docker tag mv-os-backend:latest $ECR_URI
docker push $ECR_URI

if [ $? -ne 0 ]; then
    echo "❌ Failed to push image"
    exit 1
fi

echo "✅ Image pushed to ECR: $ECR_URI"
echo ""

cd ../cloud-deployment

# Step 5: Delete existing service if it exists
echo "📦 Step 5: Cleaning up existing service..."
echo ""

EXISTING=$(aws apprunner list-services \
    --query "ServiceSummaryList[?ServiceName=='mv-os-backend'].ServiceArn" \
    --output text 2>/dev/null || echo "")

if [ -n "$EXISTING" ] && [ "$EXISTING" != "None" ]; then
    STATUS=$(aws apprunner describe-service \
        --service-arn "$EXISTING" \
        --query 'Service.Status' \
        --output text 2>/dev/null || echo "")
    
    if [ "$STATUS" != "DELETE_FAILED" ]; then
        echo "Deleting existing service..."
        aws apprunner delete-service --service-arn "$EXISTING" > /dev/null
        echo "✅ Service deletion initiated"
        echo "⏳ Waiting for deletion (30 seconds)..."
        sleep 30
    fi
fi

echo ""

# Step 6: Get secrets ARNs
DB_SECRET_ARN=$(aws secretsmanager describe-secret \
    --secret-id mv-os/database-url \
    --query 'ARN' \
    --output text)

JWT_SECRET_ARN=$(aws secretsmanager describe-secret \
    --secret-id mv-os/jwt-secret \
    --query 'ARN' \
    --output text)

# Step 7: Create App Runner service with Docker image
echo "📦 Step 6: Creating App Runner Service with Docker Image..."
echo ""

cat > /tmp/docker-apprunner-config.json <<EOF
{
  "ServiceName": "mv-os-backend",
  "SourceConfiguration": {
    "ImageRepository": {
      "ImageIdentifier": "$ECR_URI",
      "ImageConfiguration": {
        "Port": "3000",
        "RuntimeEnvironmentVariables": {
          "NODE_ENV": "production",
          "PORT": "3000"
        },
        "RuntimeEnvironmentSecrets": {
          "DATABASE_URL": "$DB_SECRET_ARN",
          "JWT_SECRET": "$JWT_SECRET_ARN"
        }
      },
      "ImageRepositoryType": "ECR"
    },
    "AutoDeploymentsEnabled": true
  },
  "InstanceConfiguration": {
    "Cpu": "0.25 vCPU",
    "Memory": "0.5 GB",
    "InstanceRoleArn": "arn:aws:iam::149959196988:role/AppRunnerSecretsRole"
  },
  "HealthCheckConfiguration": {
    "Protocol": "HTTP",
    "Path": "/api/health",
    "Interval": 10,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 5
  }
}
EOF

SERVICE_ARN=$(aws apprunner create-service \
    --cli-input-json file:///tmp/docker-apprunner-config.json \
    --region $REGION \
    --query 'Service.ServiceArn' \
    --output text)

if [ -n "$SERVICE_ARN" ] && [ "$SERVICE_ARN" != "None" ]; then
    echo "✅ Service created successfully!"
    echo "   Service ARN: $SERVICE_ARN"
    echo ""
    
    sleep 5
    SERVICE_URL=$(aws apprunner describe-service \
        --service-arn "$SERVICE_ARN" \
        --query 'Service.ServiceUrl' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$SERVICE_URL" ] && [ "$SERVICE_URL" != "None" ]; then
        echo "✅ Service URL: https://$SERVICE_URL"
    fi
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Docker Deployment Complete!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "⏳ Deployment takes 5-10 minutes"
    echo ""
    echo "Monitor progress:"
    echo "  https://console.aws.amazon.com/apprunner/home?region=$REGION#/services/mv-os-backend"
    echo ""
    echo "Check status:"
    echo "  ./cloud-deployment/check-service-status.sh"
    echo ""
else
    echo "❌ Failed to create service"
    exit 1
fi

rm -f /tmp/docker-apprunner-config.json












