#!/usr/bin/env bash
set -euo pipefail

# Create or update an App Runner service from a private ECR image digest.
# This script is ENV-aware (staging/prod) and DOES NOT delete services.
#
# Usage examples:
#   ENV=staging SERVICE_NAME=mv-os-backend-staging DB_SECRET_NAME=mv-os/staging/database-url JWT_SECRET_NAME=mv-os/staging/jwt-secret ./cloud-deployment/create-or-update-app-runner-from-ecr.sh
#   ENV=production SERVICE_NAME=mv-os-backend DB_SECRET_NAME=mv-os/database-url JWT_SECRET_NAME=mv-os/jwt-secret ./cloud-deployment/create-or-update-app-runner-from-ecr.sh

ENVIRONMENT="${ENV:-staging}"  # staging | production
SERVICE_NAME="${SERVICE_NAME:-mv-os-backend-staging}"
REGION="${AWS_REGION:-$(aws configure get region 2>/dev/null || true)}"
REGION="${REGION:-us-east-1}"

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
ECR_REPO_NAME="${ECR_REPO_NAME:-mv-os-backend}"
ECR_TAG="${ECR_TAG:-latest}"
ECR_REPO="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPO_NAME"

DB_SECRET_NAME="${DB_SECRET_NAME:-mv-os/staging/database-url}"
JWT_SECRET_NAME="${JWT_SECRET_NAME:-mv-os/staging/jwt-secret}"

CPU="${CPU:-0.25 vCPU}"
MEMORY="${MEMORY:-0.5 GB}"
PORT="${PORT:-3000}"

echo "🚀 App Runner Create/Update from ECR"
echo "  ENV:           $ENVIRONMENT"
echo "  Service:       $SERVICE_NAME"
echo "  Region:        $REGION"
echo "  ECR:           $ECR_REPO:$ECR_TAG"
echo "  DB secret:     $DB_SECRET_NAME"
echo "  JWT secret:    $JWT_SECRET_NAME"
echo ""

# Ensure ECR access role exists (to pull private ECR images)
ECR_ACCESS_ROLE_NAME="${ECR_ACCESS_ROLE_NAME:-AppRunnerECRAccessRole}"
ECR_ACCESS_ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/$ECR_ACCESS_ROLE_NAME"

aws iam get-role --role-name "$ECR_ACCESS_ROLE_NAME" >/dev/null 2>&1 || {
  cat > /tmp/apprunner-ecr-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "build.apprunner.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
  aws iam create-role \
    --role-name "$ECR_ACCESS_ROLE_NAME" \
    --assume-role-policy-document file:///tmp/apprunner-ecr-trust-policy.json \
    --description "Allows App Runner to pull images from private ECR" \
    >/dev/null
  rm -f /tmp/apprunner-ecr-trust-policy.json
}

aws iam attach-role-policy \
  --role-name "$ECR_ACCESS_ROLE_NAME" \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess \
  >/dev/null 2>&1 || true

# Resolve image digest (avoid tag caching ambiguity)
IMAGE_DIGEST="$(aws ecr describe-images \
  --repository-name "$ECR_REPO_NAME" \
  --image-ids "imageTag=$ECR_TAG" \
  --region "$REGION" \
  --query 'imageDetails[0].imageDigest' \
  --output text 2>/dev/null || true)"

if [ -z "$IMAGE_DIGEST" ] || [ "$IMAGE_DIGEST" = "None" ]; then
  echo "❌ Docker image not found: $ECR_REPO:$ECR_TAG"
  exit 1
fi

ECR_IMAGE_ID="$ECR_REPO@$IMAGE_DIGEST"
echo "✅ Using image digest: $ECR_IMAGE_ID"

# Resolve secrets ARNs
DB_SECRET_ARN="$(aws secretsmanager describe-secret --secret-id "$DB_SECRET_NAME" --query 'ARN' --output text --region "$REGION")"
JWT_SECRET_ARN="$(aws secretsmanager describe-secret --secret-id "$JWT_SECRET_NAME" --query 'ARN' --output text --region "$REGION")"

# Locate existing service by name
EXISTING_ARN="$(aws apprunner list-services \
  --region "$REGION" \
  --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceArn" \
  --output text 2>/dev/null || true)"

RUNTIME_ENV_VARS_JSON="$(cat <<EOF
{
  "NODE_ENV": "$ENVIRONMENT",
  "PORT": "$PORT"
}
EOF
)"

if [ -n "$EXISTING_ARN" ] && [ "$EXISTING_ARN" != "None" ]; then
  echo "🔁 Updating existing service: $EXISTING_ARN"
  aws apprunner update-service \
    --service-arn "$EXISTING_ARN" \
    --region "$REGION" \
    --source-configuration "{
      \"ImageRepository\": {
        \"ImageIdentifier\": \"$ECR_IMAGE_ID\",
        \"ImageRepositoryType\": \"ECR\",
        \"ImageConfiguration\": {
          \"Port\": \"$PORT\",
          \"RuntimeEnvironmentVariables\": $RUNTIME_ENV_VARS_JSON,
          \"RuntimeEnvironmentSecrets\": {
            \"DATABASE_URL\": \"$DB_SECRET_ARN\",
            \"JWT_SECRET\": \"$JWT_SECRET_ARN\"
          }
        }
      },
      \"AuthenticationConfiguration\": { \"AccessRoleArn\": \"$ECR_ACCESS_ROLE_ARN\" },
      \"AutoDeploymentsEnabled\": false
    }" \
    --query 'OperationId' \
    --output text

  echo "✅ Update initiated. Monitor App Runner in region $REGION."
  exit 0
fi

echo "🆕 Creating new service: $SERVICE_NAME"

cat > /tmp/ecr-apprunner-config.json <<EOF
{
  "ServiceName": "$SERVICE_NAME",
  "SourceConfiguration": {
    "AuthenticationConfiguration": { "AccessRoleArn": "$ECR_ACCESS_ROLE_ARN" },
    "ImageRepository": {
      "ImageIdentifier": "$ECR_IMAGE_ID",
      "ImageConfiguration": {
        "Port": "$PORT",
        "RuntimeEnvironmentVariables": $RUNTIME_ENV_VARS_JSON,
        "RuntimeEnvironmentSecrets": {
          "DATABASE_URL": "$DB_SECRET_ARN",
          "JWT_SECRET": "$JWT_SECRET_ARN"
        }
      },
      "ImageRepositoryType": "ECR"
    },
    "AutoDeploymentsEnabled": false
  },
  "InstanceConfiguration": {
    "Cpu": "$CPU",
    "Memory": "$MEMORY"
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

SERVICE_ARN="$(aws apprunner create-service \
  --cli-input-json file:///tmp/ecr-apprunner-config.json \
  --region "$REGION" \
  --query 'Service.ServiceArn' \
  --output text)"

rm -f /tmp/ecr-apprunner-config.json

echo "✅ Service created: $SERVICE_ARN"
SERVICE_URL="$(aws apprunner describe-service --service-arn "$SERVICE_ARN" --region "$REGION" --query 'Service.ServiceUrl' --output text 2>/dev/null || true)"
if [ -n "$SERVICE_URL" ] && [ "$SERVICE_URL" != "None" ]; then
  echo "✅ URL: https://$SERVICE_URL"
fi


