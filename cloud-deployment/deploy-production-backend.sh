#!/usr/bin/env bash
set -euo pipefail

# Production deploy entrypoint (manual; after staging approval):
# - Build image via CodeBuild
# - Update production App Runner service from ECR digest (no deletion)

export ENV="${ENV:-production}"
export SERVICE_NAME="${SERVICE_NAME:-mv-os-backend}"
export DB_SECRET_NAME="${DB_SECRET_NAME:-mv-os/database-url}"
export JWT_SECRET_NAME="${JWT_SECRET_NAME:-mv-os/jwt-secret}"

echo "🚀 Deploying BACKEND to PRODUCTION"
echo "⚠️  This should only be run after staging approval."
echo ""

echo "1) Trigger CodeBuild (mv-os-backend-build)"
aws codebuild start-build --project-name mv-os-backend-build --query 'build.id' --output text
echo ""
echo "2) Wait until CodeBuild succeeds, then run:"
echo "   ENV=production SERVICE_NAME=$SERVICE_NAME DB_SECRET_NAME=$DB_SECRET_NAME JWT_SECRET_NAME=$JWT_SECRET_NAME ./cloud-deployment/create-or-update-app-runner-from-ecr.sh"


