#!/bin/bash

set -e

echo "🚀 Creating AWS App Runner Service for MV-OS Backend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-1")

# Check if ECR image exists
ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/mv-os-backend:latest"
IMAGE_EXISTS=$(aws ecr describe-images \
    --repository-name mv-os-backend \
    --image-ids imageTag=latest \
    --query 'imageDetails[0].imageTags[0]' \
    --output text 2>/dev/null || echo "")

if [ -z "$IMAGE_EXISTS" ] || [ "$IMAGE_EXISTS" = "None" ]; then
    echo "⚠️  ECR image not found. Building and pushing..."
    echo ""
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker not found. Cannot build image."
        echo ""
        echo "📝 Please use source-based deployment via AWS Console:"
        echo "   1. Go to: https://console.aws.amazon.com/apprunner"
        echo "   2. Create service → Source code repository"
        echo "   3. Connect GitHub/GitLab"
        echo "   4. Build: cd backend && npm install && npm run build"
        echo "   5. Start: cd backend && npm run start:prod"
        exit 1
    fi
    
    # Build and push
    cd "$(dirname "$0")/.."
    ./cloud-deployment/deploy-to-aws.sh
    cd cloud-deployment
fi

echo "✅ ECR image found: $ECR_URI"
echo ""

# Get secrets ARNs
DB_SECRET_ARN=$(aws secretsmanager describe-secret \
    --secret-id mv-os/database-url \
    --query 'ARN' \
    --output text)

JWT_SECRET_ARN=$(aws secretsmanager describe-secret \
    --secret-id mv-os/jwt-secret \
    --query 'ARN' \
    --output text)

echo "✅ Secrets configured"
echo ""

# Create App Runner service configuration
cat > app-runner-config.json <<EOF
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
        "RuntimeEnvironmentSecrets": [
          {
            "Name": "DATABASE_URL",
            "Value": "$DB_SECRET_ARN"
          },
          {
            "Name": "JWT_SECRET",
            "Value": "$JWT_SECRET_ARN"
          }
        ]
      },
      "ImageRepositoryType": "ECR"
    },
    "AutoDeploymentsEnabled": true
  },
  "InstanceConfiguration": {
    "Cpu": "0.25 vCPU",
    "Memory": "0.5 GB"
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

echo "📝 Creating App Runner service..."
echo ""

# Check if service already exists
EXISTING_SERVICE=$(aws apprunner list-services \
    --query "ServiceSummaryList[?ServiceName=='mv-os-backend'].ServiceArn" \
    --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_SERVICE" ] && [ "$EXISTING_SERVICE" != "None" ]; then
    echo "⚠️  Service already exists: $EXISTING_SERVICE"
    echo ""
    echo "Updating service..."
    aws apprunner update-service \
        --service-arn "$EXISTING_SERVICE" \
        --source-configuration file://app-runner-config.json \
        --instance-configuration Cpu=0.25,Memory=0.5 \
        --region $REGION > /dev/null
    
    echo "✅ Service updated"
    SERVICE_ARN="$EXISTING_SERVICE"
else
    # Create new service
    SERVICE_ARN=$(aws apprunner create-service \
        --cli-input-json file://app-runner-config.json \
        --region $REGION \
        --query 'Service.ServiceArn' \
        --output text)
    
    if [ -n "$SERVICE_ARN" ] && [ "$SERVICE_ARN" != "None" ]; then
        echo "✅ Service created: $SERVICE_ARN"
    else
        echo "❌ Failed to create service"
        exit 1
    fi
fi

# Get service URL
echo ""
echo "⏳ Waiting for service to be created..."
sleep 5

SERVICE_URL=$(aws apprunner describe-service \
    --service-arn "$SERVICE_ARN" \
    --query 'Service.ServiceUrl' \
    --output text 2>/dev/null || echo "")

if [ -z "$SERVICE_URL" ] || [ "$SERVICE_URL" = "None" ]; then
    echo "⚠️  Service URL not available yet. Check console:"
    echo "   https://console.aws.amazon.com/apprunner"
else
    echo "✅ Service URL: $SERVICE_URL"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ App Runner Service Deployed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Service ARN: $SERVICE_ARN"
if [ -n "$SERVICE_URL" ] && [ "$SERVICE_URL" != "None" ]; then
    echo "Service URL: $SERVICE_URL"
    echo ""
    echo "Test health endpoint:"
    echo "  curl $SERVICE_URL/api/health"
fi
echo ""
echo "⏳ Deployment takes 5-10 minutes. Check status:"
echo "   https://console.aws.amazon.com/apprunner"
echo ""
echo "Next: Deploy frontend to Amplify (see DEPLOY_CLOUD.md)"

rm -f app-runner-config.json












