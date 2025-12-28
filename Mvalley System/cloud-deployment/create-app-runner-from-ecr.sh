#!/bin/bash

set -e

echo "🚀 Creating App Runner Service from ECR Docker Image"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-1")

ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/mv-os-backend:latest"

# Create/ensure ECR access role for App Runner (required to pull from private ECR)
ECR_ACCESS_ROLE_NAME="AppRunnerECRAccessRole"
ECR_ACCESS_ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/$ECR_ACCESS_ROLE_NAME"

echo "🔐 Ensuring App Runner ECR access role exists..."
aws iam get-role --role-name "$ECR_ACCESS_ROLE_NAME" > /dev/null 2>&1 || {
  cat > /tmp/apprunner-ecr-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "build.apprunner.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

  aws iam create-role \
    --role-name "$ECR_ACCESS_ROLE_NAME" \
    --assume-role-policy-document file:///tmp/apprunner-ecr-trust-policy.json \
    --description "Allows App Runner to pull images from private ECR" \
    > /dev/null

  rm -f /tmp/apprunner-ecr-trust-policy.json
}

# Attach managed policy for ECR access (idempotent; may already be attached)
aws iam attach-role-policy \
  --role-name "$ECR_ACCESS_ROLE_NAME" \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess \
  > /dev/null 2>&1 || true

echo "✅ ECR access role: $ECR_ACCESS_ROLE_ARN"
echo ""

# Check if image exists
echo "📦 Checking ECR Image..."
IMAGE_EXISTS=$(aws ecr describe-images \
    --repository-name mv-os-backend \
    --image-ids imageTag=latest \
    --query 'imageDetails[0].imageTags[0]' \
    --output text 2>/dev/null || echo "")

if [ -z "$IMAGE_EXISTS" ] || [ "$IMAGE_EXISTS" = "None" ]; then
    echo "❌ Docker image not found in ECR: $ECR_URI"
    echo ""
    echo "You need to build and push the image first:"
    echo "  1. Use CodeBuild: ./cloud-deployment/setup-codebuild.sh"
    echo "  2. Or install Docker and run: ./cloud-deployment/deploy-docker.sh"
    exit 1
fi

echo "✅ Docker image found: $ECR_URI"
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

# Delete existing service
EXISTING=$(aws apprunner list-services \
    --query "ServiceSummaryList[?ServiceName=='mv-os-backend'].ServiceArn" \
    --output text 2>/dev/null || echo "")

if [ -n "$EXISTING" ] && [ "$EXISTING" != "None" ]; then
    echo "🗑️  Deleting existing service..."
    aws apprunner delete-service --service-arn "$EXISTING" > /dev/null
    echo "✅ Service deletion initiated"
    echo "⏳ Waiting for deletion (30 seconds)..."
    sleep 30
fi

echo ""

# Create App Runner service
echo "📦 Creating App Runner Service..."
echo ""

cat > /tmp/ecr-apprunner-config.json <<EOF
{
  "ServiceName": "mv-os-backend",
  "SourceConfiguration": {
    "AuthenticationConfiguration": {
      "AccessRoleArn": "$ECR_ACCESS_ROLE_ARN"
    },
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
    --cli-input-json file:///tmp/ecr-apprunner-config.json \
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
    echo "✅ App Runner Service Created from Docker Image!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "⏳ Deployment takes 5-10 minutes"
    echo ""
    echo "Monitor: https://console.aws.amazon.com/apprunner/home?region=$REGION#/services/mv-os-backend"
else
    echo "❌ Failed to create service"
    exit 1
fi

rm -f /tmp/ecr-apprunner-config.json

