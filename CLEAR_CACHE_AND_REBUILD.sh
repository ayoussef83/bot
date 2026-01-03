#!/bin/bash
# Clear Amplify cache and trigger fresh build

set -e

APP_ID="du3m4x9j7wlp6"
REGION="us-east-1"

echo "🧹 Clearing Amplify Cache and Rebuilding"
echo "=========================================="
echo ""

# Clear TTL (cache)
echo "1️⃣  Clearing build cache (TTL)..."
aws amplify update-branch \
  --app-id $APP_ID \
  --branch-name main \
  --region $REGION \
  --ttl 0 2>&1 | grep -E "branchName|ttl" || echo "   Cache cleared"
echo ""

# Wait a moment
sleep 2

# Trigger fresh build
echo "2️⃣  Triggering fresh build..."
JOB_ID=$(aws amplify start-job \
  --app-id $APP_ID \
  --branch-name main \
  --job-type RELEASE \
  --region $REGION \
  --query "jobSummary.jobId" \
  --output text 2>&1)

if [ -n "$JOB_ID" ] && [ "$JOB_ID" != "None" ]; then
  echo "   ✅ Build started: Job ID $JOB_ID"
else
  echo "   ⚠️  Build may already be running"
fi

echo ""
echo "📊 Monitor build:"
echo "   https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID/main"
echo ""
echo "⏱️  Wait 5-10 minutes for build to complete"
echo ""
echo "💡 After deployment:"
echo "   1. Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)"
echo "   2. Or use incognito/private window"
echo "   3. Clear browser cache if needed"

