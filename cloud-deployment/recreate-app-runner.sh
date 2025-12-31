#!/bin/bash

set -e

echo "🔄 Recreating App Runner Service with Fixed Build Command"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-1")

SERVICE_ARN="arn:aws:apprunner:us-east-1:149959196988:service/mv-os-backend/1919b90f9fec4c60a9e1a7fcb8cf293e"

# Get secrets ARNs
DB_SECRET_ARN=$(aws secretsmanager describe-secret \
    --secret-id mv-os/database-url \
    --query 'ARN' \
    --output text)

JWT_SECRET_ARN=$(aws secretsmanager describe-secret \
    --secret-id mv-os/jwt-secret \
    --query 'ARN' \
    --output text)

echo "✅ AWS Account: $ACCOUNT_ID"
echo "✅ Region: $REGION"
echo ""

# Check if service exists
EXISTING=$(aws apprunner list-services \
    --query "ServiceSummaryList[?ServiceName=='mv-os-backend'].ServiceArn" \
    --output text 2>/dev/null || echo "")

if [ -n "$EXISTING" ] && [ "$EXISTING" != "None" ]; then
    echo "🗑️  Deleting existing failed service..."
    aws apprunner delete-service --service-arn "$EXISTING" > /dev/null
    echo "✅ Service deletion initiated"
    echo "⏳ Waiting for deletion to complete (30 seconds)..."
    sleep 30
else
    echo "✅ No existing service found"
fi

echo ""

# Create service configuration JSON
cat > /tmp/apprunner-config.json <<EOF
{
  "ServiceName": "mv-os-backend",
  "SourceConfiguration": {
    "CodeRepository": {
      "RepositoryUrl": "https://github.com/ayoussef83/bot",
      "SourceCodeVersion": {
        "Type": "BRANCH",
        "Value": "main"
      },
      "SourceDirectory": "/",
      "CodeConfiguration": {
        "ConfigurationSource": "API",
        "CodeConfigurationValues": {
          "Runtime": "NODEJS_18",
          "BuildCommand": "cd backend && npm install && npx prisma@5.22.0 generate && npm run build",
          "StartCommand": "cd backend && npm run start:prod",
          "Port": "3000",
          "RuntimeEnvironmentVariables": {
            "NODE_ENV": "production",
            "PORT": "3000"
          },
          "RuntimeEnvironmentSecrets": {
            "DATABASE_URL": "$DB_SECRET_ARN",
            "JWT_SECRET": "$JWT_SECRET_ARN"
          }
        }
      }
    },
    "AuthenticationConfiguration": {
      "ConnectionArn": "arn:aws:apprunner:us-east-1:149959196988:connection/test3/5f29bfc587644e8f8170408856705e70"
    },
    "AutoDeploymentsEnabled": false
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

echo "📦 Creating new App Runner service..."
echo ""

SERVICE_ARN=$(aws apprunner create-service \
    --cli-input-json file:///tmp/apprunner-config.json \
    --region $REGION \
    --query 'Service.ServiceArn' \
    --output text)

if [ -n "$SERVICE_ARN" ] && [ "$SERVICE_ARN" != "None" ]; then
    echo "✅ Service created successfully!"
    echo "   Service ARN: $SERVICE_ARN"
    echo ""
    
    # Get service URL
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
    echo "✅ Service Recreation Complete!"
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

rm -f /tmp/apprunner-config.json

