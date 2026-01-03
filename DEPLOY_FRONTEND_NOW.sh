#!/bin/bash
# Deploy Frontend to AWS Amplify

set -e

echo "🚀 Deploying Frontend to AWS Amplify"
echo "======================================"
echo ""

APP_ID="du3m4x9j7wlp6"
REGION="us-east-1"
BACKEND_URL="https://mzmeyp2cw9.us-east-1.awsapprunner.com/api"

echo "📋 App Details:"
echo "   App ID: $APP_ID"
echo "   Region: $REGION"
echo "   Backend URL: $BACKEND_URL"
echo ""

# Check if app exists
echo "🔍 Checking Amplify app..."
APP_EXISTS=$(aws amplify get-app --app-id $APP_ID --region $REGION 2>&1 | grep -q "appId" && echo "yes" || echo "no")

if [ "$APP_EXISTS" != "yes" ]; then
    echo "❌ Amplify app not found. Please create it first via AWS Console."
    echo "   Go to: https://console.aws.amazon.com/amplify"
    exit 1
fi

echo "✅ Amplify app found"
echo ""

# List branches
echo "📦 Available branches:"
aws amplify list-branches --app-id $APP_ID --region $REGION --query "branches[].branchName" --output table
echo ""

# Get default branch
DEFAULT_BRANCH=$(aws amplify get-app --app-id $APP_ID --region $REGION --query "defaultDomain" --output text 2>/dev/null || echo "main")
echo "🌿 Default branch: $DEFAULT_BRANCH"
echo ""

# Check environment variables
echo "🔧 Checking environment variables..."
ENV_VARS=$(aws amplify get-branch --app-id $APP_ID --branch-name main --region $REGION --query "environmentVariables" --output json 2>/dev/null || echo "[]")

if echo "$ENV_VARS" | grep -q "NEXT_PUBLIC_API_URL"; then
    echo "✅ NEXT_PUBLIC_API_URL already set"
else
    echo "⚠️  NEXT_PUBLIC_API_URL not set"
    echo ""
    echo "📝 To set environment variable, run:"
    echo "   aws amplify update-branch \\"
    echo "     --app-id $APP_ID \\"
    echo "     --branch-name main \\"
    echo "     --region $REGION \\"
    echo "     --environment-variables NEXT_PUBLIC_API_URL=$BACKEND_URL"
    echo ""
    read -p "Set environment variable now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        aws amplify update-branch \
            --app-id $APP_ID \
            --branch-name main \
            --region $REGION \
            --environment-variables NEXT_PUBLIC_API_URL=$BACKEND_URL
        echo "✅ Environment variable set"
    fi
fi

echo ""
echo "🚀 To trigger deployment:"
echo ""
echo "Option 1: Push to Git (Recommended)"
echo "   git push origin main"
echo "   (Amplify will auto-deploy if auto-build is enabled)"
echo ""
echo "Option 2: Manual start via AWS Console"
echo "   Go to: https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID"
echo "   Click on your branch → 'Redeploy this version'"
echo ""
echo "Option 3: Start build via CLI"
echo "   aws amplify start-job \\"
echo "     --app-id $APP_ID \\"
echo "     --branch-name main \\"
echo "     --job-type RELEASE \\"
echo "     --region $REGION"
echo ""

# Check if we should start build now
read -p "Start build now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Starting build..."
    aws amplify start-job \
        --app-id $APP_ID \
        --branch-name main \
        --job-type RELEASE \
        --region $REGION
    echo ""
    echo "✅ Build started!"
    echo ""
    echo "📊 Monitor progress:"
    echo "   https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID/main"
fi

echo ""
echo "✅ Deployment process initiated!"
echo ""
echo "📊 Your Amplify app:"
echo "   https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID"
echo ""
echo "🌐 Once deployed, your app will be available at:"
echo "   https://main.$APP_ID.amplifyapp.com"
echo "   or"
echo "   https://$APP_ID.amplifyapp.com"

