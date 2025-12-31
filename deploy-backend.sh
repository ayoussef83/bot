#!/bin/bash
# Deploy MV-OS Backend to App Runner

SERVICE_ARN="arn:aws:apprunner:us-east-1:149959196988:service/mv-os-backend/a9775dfe16034128b71f546793e3d7dd"
REGION="us-east-1"

echo "🔍 Getting latest ECR image..."
LATEST_IMAGE=$(aws ecr describe-images \
  --repository-name mv-os-backend \
  --region $REGION \
  --query 'sort_by(imageDetails,& imagePushedAt)[-1].imageTags[0]' \
  --output text)

if [ -z "$LATEST_IMAGE" ] || [ "$LATEST_IMAGE" == "None" ]; then
  LATEST_IMAGE="latest"
fi

IMAGE_URI="149959196988.dkr.ecr.us-east-1.amazonaws.com/mv-os-backend:$LATEST_IMAGE"

echo "📦 Latest image: $IMAGE_URI"
echo ""
echo "🚀 Starting App Runner deployment..."

aws apprunner start-deployment \
  --service-arn $SERVICE_ARN \
  --region $REGION \
  --query 'OperationId' \
  --output text

echo ""
echo "✅ Deployment initiated!"
echo "Monitor at: https://console.aws.amazon.com/apprunner/home?region=us-east-1#/services/mv-os-backend"
