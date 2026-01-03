#!/bin/bash

echo "☁️  Deploying MV-OS Backend to AWS App Runner"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-1")

echo "✅ AWS Account: $ACCOUNT_ID"
echo "✅ Region: $REGION"
echo ""

# Step 1: Build backend
echo "📦 Step 1: Building Backend..."
cd ../backend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo "✅ Backend built"
echo ""

# Step 2: Create ECR repository if needed
echo "📦 Step 2: Setting up ECR Repository..."
cd ../cloud-deployment

aws ecr describe-repositories --repository-names mv-os-backend --region $REGION &> /dev/null
if [ $? -ne 0 ]; then
    aws ecr create-repository --repository-name mv-os-backend --region $REGION > /dev/null
    echo "✅ Created ECR repository: mv-os-backend"
else
    echo "✅ ECR repository exists: mv-os-backend"
fi

# Step 3: Build and push Docker image
echo ""
echo "📦 Step 3: Building and Pushing Docker Image..."
echo ""

ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/mv-os-backend:latest"

# Login to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# Build image
echo "Building Docker image..."
docker build -f Dockerfile.backend -t mv-os-backend:latest ..
docker tag mv-os-backend:latest $ECR_URI

# Push image
echo "Pushing to ECR..."
docker push $ECR_URI

if [ $? -eq 0 ]; then
    echo "✅ Image pushed to ECR: $ECR_URI"
    echo ""
    
    # Step 4: Create App Runner service
    echo "📦 Step 4: Creating App Runner Service..."
    echo ""
    
    # Update task definition with account ID
    sed "s/ACCOUNT_ID/$ACCOUNT_ID/g" app-runner-service.json > app-runner-service-updated.json
    
    # Create service
    SERVICE_ARN=$(aws apprunner create-service \
        --service-name mv-os-backend \
        --source-configuration file://app-runner-service-updated.json \
        --instance-configuration Cpu=0.25,Memory=0.5 \
        --region $REGION \
        --query 'Service.ServiceArn' \
        --output text 2>/dev/null)
    
    if [ -n "$SERVICE_ARN" ] && [ "$SERVICE_ARN" != "None" ]; then
        echo "✅ App Runner service created!"
        echo "   Service ARN: $SERVICE_ARN"
        echo ""
        echo "⏳ Service is deploying (takes 5-10 minutes)..."
        echo "   Check status: https://console.aws.amazon.com/apprunner"
    else
        echo "⚠️  Service creation may have failed or already exists"
        echo "   Check: https://console.aws.amazon.com/apprunner"
        echo ""
        echo "You can also create it manually using the console"
    fi
    
    rm -f app-runner-service-updated.json
else
    echo "❌ Failed to push image"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Initiated!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Wait for App Runner service to be ready (5-10 minutes)"
echo "2. Get the service URL from AWS Console"
echo "3. Deploy frontend to Amplify (see CLOUD_QUICK_START.md)"
echo "4. Update frontend API URL to point to App Runner URL"











