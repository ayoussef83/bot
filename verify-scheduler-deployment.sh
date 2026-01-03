#!/bin/bash

echo "🔍 Verifying Scheduler System Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check CodeBuild status
echo "📦 Step 1: Checking CodeBuild Status..."
BUILD_ID=$(aws codebuild list-builds-for-project --project-name mv-os-backend-build --max-items 1 --query "ids[0]" --output text 2>/dev/null)

if [ -n "$BUILD_ID" ]; then
    BUILD_STATUS=$(aws codebuild batch-get-builds --ids "$BUILD_ID" --query "builds[0].buildStatus" --output text 2>/dev/null)
    BUILD_PHASE=$(aws codebuild batch-get-builds --ids "$BUILD_ID" --query "builds[0].currentPhase" --output text 2>/dev/null)
    
    echo "   Build ID: $BUILD_ID"
    echo "   Status: $BUILD_STATUS"
    echo "   Phase: $BUILD_PHASE"
    
    if [ "$BUILD_STATUS" = "SUCCEEDED" ]; then
        echo "   ✅ Build completed successfully"
    elif [ "$BUILD_STATUS" = "IN_PROGRESS" ]; then
        echo "   ⏳ Build in progress..."
    elif [ "$BUILD_STATUS" = "FAILED" ]; then
        echo "   ❌ Build failed - check logs"
    fi
else
    echo "   ⚠️  No recent build found"
fi

echo ""

# Check App Runner status
echo "🚀 Step 2: Checking App Runner Service..."
SERVICE_ARN=$(aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='mv-os-backend'].ServiceArn" --output text 2>/dev/null)

if [ -n "$SERVICE_ARN" ]; then
    SERVICE_STATUS=$(aws apprunner describe-service --service-arn "$SERVICE_ARN" --query "Service.Status" --output text 2>/dev/null)
    SERVICE_URL=$(aws apprunner describe-service --service-arn "$SERVICE_ARN" --query "Service.ServiceUrl" --output text 2>/dev/null)
    
    echo "   Service ARN: $SERVICE_ARN"
    echo "   Status: $SERVICE_STATUS"
    echo "   URL: https://$SERVICE_URL"
    
    if [ "$SERVICE_STATUS" = "RUNNING" ]; then
        echo "   ✅ Service is running"
    else
        echo "   ⚠️  Service status: $SERVICE_STATUS"
    fi
else
    echo "   ❌ App Runner service not found"
fi

echo ""

# Check health endpoint
echo "🏥 Step 3: Checking Health Endpoint..."
if [ -n "$SERVICE_URL" ]; then
    HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://$SERVICE_URL/api/health" 2>/dev/null)
    if [ "$HEALTH_RESPONSE" = "200" ]; then
        echo "   ✅ Health check passed (HTTP $HEALTH_RESPONSE)"
    else
        echo "   ⚠️  Health check returned: HTTP $HEALTH_RESPONSE"
    fi
else
    echo "   ⚠️  Cannot check health - service URL not available"
fi

echo ""

# Check for scheduler in logs
echo "📋 Step 4: Checking Scheduler Initialization..."
LOG_GROUP="/aws/apprunner/mv-os-backend"

# Check if log group exists
if aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP" --query "logGroups[?logGroupName=='$LOG_GROUP']" --output text 2>/dev/null | grep -q "$LOG_GROUP"; then
    echo "   Checking recent logs for scheduler..."
    
    SCHEDULER_LOGS=$(aws logs tail "$LOG_GROUP" --since 10m --format short 2>/dev/null | grep -i "scheduler\|SchedulerService" | tail -5)
    
    if [ -n "$SCHEDULER_LOGS" ]; then
        echo "   ✅ Scheduler logs found:"
        echo "$SCHEDULER_LOGS" | sed 's/^/      /'
    else
        echo "   ⏳ No scheduler logs found yet (may need to wait for deployment)"
    fi
else
    echo "   ⚠️  Log group not found or not accessible"
fi

echo ""

# Check ECR image
echo "🐳 Step 5: Checking ECR Image..."
ECR_REPO="149959196988.dkr.ecr.us-east-1.amazonaws.com/mv-os-backend"
LATEST_IMAGE=$(aws ecr describe-images --repository-name mv-os-backend --query "sort_by(imageDetails,&imagePushedAt)[-1].{Tag:imageTags[0],PushedAt:imagePushedAt}" --output json 2>/dev/null)

if [ -n "$LATEST_IMAGE" ] && [ "$LATEST_IMAGE" != "null" ]; then
    echo "   ✅ Latest image found in ECR"
    echo "$LATEST_IMAGE" | jq -r '   Tag: \(.Tag), Pushed: \(.PushedAt)' 2>/dev/null || echo "$LATEST_IMAGE"
else
    echo "   ⚠️  No images found in ECR"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. If build is still IN_PROGRESS, wait for it to complete"
echo "2. Once build succeeds, App Runner will auto-deploy (5-10 minutes)"
echo "3. After deployment, seed message templates:"
echo "   cd backend && npm run prisma:seed-templates"
echo "4. Verify scheduler in CloudWatch logs:"
echo "   aws logs tail /aws/apprunner/mv-os-backend --follow"
echo "5. Test email/SMS in Settings → Communications"
echo ""










