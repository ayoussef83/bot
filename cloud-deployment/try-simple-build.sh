#!/bin/bash

# Try creating service with simplest possible build command
# This will help us isolate the issue

set -e

echo "🔄 Creating App Runner with Simplest Build Command"
echo ""

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-1")

# Delete existing failed service
EXISTING=$(aws apprunner list-services \
    --query "ServiceSummaryList[?ServiceName=='mv-os-backend'].ServiceArn" \
    --output text 2>/dev/null || echo "")

if [ -n "$EXISTING" ] && [ "$EXISTING" != "None" ]; then
    echo "Deleting existing service..."
    aws apprunner delete-service --service-arn "$EXISTING" > /dev/null
    sleep 30
fi

# Get secrets
DB_SECRET_ARN=$(aws secretsmanager describe-secret \
    --secret-id mv-os/database-url \
    --query 'ARN' \
    --output text)

JWT_SECRET_ARN=$(aws secretsmanager describe-secret \
    --secret-id mv-os/jwt-secret \
    --query 'ARN' \
    --output text)

# Create with SIMPLEST build command - just npm install and build
cat > /tmp/simple-config.json <<EOF
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
          "BuildCommand": "cd backend && npm install && npm run build",
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

echo "Creating service with simple build command..."
SERVICE_ARN=$(aws apprunner create-service \
    --cli-input-json file:///tmp/simple-config.json \
    --region $REGION \
    --query 'Service.ServiceArn' \
    --output text)

if [ -n "$SERVICE_ARN" ] && [ "$SERVICE_ARN" != "None" ]; then
    echo "✅ Service created: $SERVICE_ARN"
    echo ""
    echo "Build command: cd backend && npm install && npm run build"
    echo "(No Prisma generate - testing if that's the issue)"
else
    echo "❌ Failed to create service"
    exit 1
fi

rm -f /tmp/simple-config.json












