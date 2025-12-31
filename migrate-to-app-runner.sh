#!/bin/bash

# Script to migrate backend to App Runner

set -e

echo "🚀 Migrating Backend to App Runner"
echo ""

# Get ECR repository URI
ECR_REPO=$(aws ecr describe-repositories --repository-names mv-os-backend --query 'repositories[0].repositoryUri' --output text)
ECR_IMAGE="${ECR_REPO}:latest"

echo "📦 ECR Image: $ECR_IMAGE"
echo ""

# Check if image exists
echo "🔍 Checking if image exists in ECR..."
LATEST_TAG=$(aws ecr describe-images --repository-name mv-os-backend --query 'sort_by(imageDetails, &imagePushedAt)[-1].imageTags[0]' --output text 2>/dev/null || echo "latest")

if [ "$LATEST_TAG" != "null" ] && [ ! -z "$LATEST_TAG" ]; then
    ECR_IMAGE="${ECR_REPO}:${LATEST_TAG}"
    echo "✅ Found image with tag: $LATEST_TAG"
else
    echo "⚠️  Using 'latest' tag. Consider building a new image first."
fi

echo ""
echo "📝 Creating App Runner service configuration..."

# Create App Runner service JSON
cat > /tmp/app-runner-service.json <<EOF
{
  "ServiceName": "mv-os-backend",
  "SourceConfiguration": {
    "ImageRepository": {
      "ImageIdentifier": "${ECR_IMAGE}",
      "ImageConfiguration": {
        "Port": "3000",
        "RuntimeEnvironmentVariables": {
          "NODE_ENV": "production",
          "PORT": "3000"
        },
        "RuntimeEnvironmentSecrets": {
          "DATABASE_URL": "arn:aws:secretsmanager:us-east-1:149959196988:secret:mv-os/database-url-goZxlg",
          "JWT_SECRET": "arn:aws:secretsmanager:us-east-1:149959196988:secret:mv-os/jwt-secret-6um1fs"
        }
      },
      "ImageRepositoryType": "ECR"
    },
    "AutoDeploymentsEnabled": true
  },
  "InstanceConfiguration": {
    "Cpu": "0.25 vCPU",
    "Memory": "0.5 GB",
    "InstanceRoleArn": "arn:aws:iam::149959196988:role/AppRunner-mv-os-role"
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

echo "✅ Configuration created"
echo ""
echo "🚀 Creating App Runner service..."
echo "   (This may take 5-10 minutes)"
echo ""

# Create the service
SERVICE_ARN=$(aws apprunner create-service \
  --cli-input-json file:///tmp/app-runner-service.json \
  --query 'Service.ServiceArn' \
  --output text)

if [ $? -eq 0 ]; then
    echo "✅ App Runner service created!"
    echo ""
    echo "📋 Service ARN: $SERVICE_ARN"
    echo ""
    echo "⏳ Waiting for service to be ready..."
    
    # Wait for service to be ready
    for i in {1..30}; do
        STATUS=$(aws apprunner describe-service --service-arn "$SERVICE_ARN" --query 'Service.Status' --output text)
        SERVICE_URL=$(aws apprunner describe-service --service-arn "$SERVICE_ARN" --query 'Service.ServiceUrl' --output text 2>/dev/null || echo "")
        
        echo "[$i/30] Status: $STATUS"
        
        if [ "$STATUS" = "RUNNING" ] && [ ! -z "$SERVICE_URL" ]; then
            echo ""
            echo "✅ Service is running!"
            echo ""
            echo "🌐 Service URL: $SERVICE_URL"
            echo "📝 API Base URL: ${SERVICE_URL}/api"
            echo ""
            echo "Next steps:"
            echo "1. Test the API: curl ${SERVICE_URL}/api/health"
            echo "2. Update frontend NEXT_PUBLIC_API_URL to: ${SERVICE_URL}/api"
            echo "3. Deploy frontend to Amplify"
            break
        fi
        
        if [ "$STATUS" = "CREATE_FAILED" ] || [ "$STATUS" = "DELETE_FAILED" ]; then
            echo "❌ Service creation failed. Check AWS Console for details."
            exit 1
        fi
        
        sleep 10
    done
else
    echo "❌ Failed to create App Runner service"
    exit 1
fi

