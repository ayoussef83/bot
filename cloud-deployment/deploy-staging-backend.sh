#!/usr/bin/env bash
set -euo pipefail

# Staging deploy entrypoint:
# - Build image via CodeBuild (recommended)
# - Then create/update App Runner staging service from ECR digest

export ENV="${ENV:-staging}"
export SERVICE_NAME="${SERVICE_NAME:-mv-os-backend-staging}"
export DB_SECRET_NAME="${DB_SECRET_NAME:-mv-os/staging/database-url}"
export JWT_SECRET_NAME="${JWT_SECRET_NAME:-mv-os/staging/jwt-secret}"

echo "🚀 Deploying BACKEND to STAGING"
echo ""

echo "1) Trigger CodeBuild (mv-os-backend-build)"
aws codebuild start-build --project-name mv-os-backend-build --query 'build.id' --output text
echo ""
echo "2) Wait until CodeBuild succeeds, then run:"
echo "   ENV=staging SERVICE_NAME=$SERVICE_NAME DB_SECRET_NAME=$DB_SECRET_NAME JWT_SECRET_NAME=$JWT_SECRET_NAME ./cloud-deployment/create-or-update-app-runner-from-ecr.sh"


