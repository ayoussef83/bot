#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="${PROJECT_NAME:-mv-os-backend-build}"

echo "🔍 Checking CodeBuild Status (latest build for: $PROJECT_NAME)..."
echo ""

BUILD_ID="$(aws codebuild list-builds-for-project --project-name "$PROJECT_NAME" --query 'ids[0]' --output text 2>/dev/null || true)"

if [ -z "${BUILD_ID}" ] || [ "${BUILD_ID}" = "None" ]; then
  echo "⚠️  No builds found for project: $PROJECT_NAME"
  exit 0
fi

STATUS="$(aws codebuild batch-get-builds --ids "$BUILD_ID" --query 'builds[0].buildStatus' --output text 2>/dev/null || echo "UNKNOWN")"
PHASE="$(aws codebuild batch-get-builds --ids "$BUILD_ID" --query 'builds[0].currentPhase' --output text 2>/dev/null || echo "UNKNOWN")"
SOURCE_SHA="$(aws codebuild batch-get-builds --ids "$BUILD_ID" --query 'builds[0].resolvedSourceVersion' --output text 2>/dev/null || echo "UNKNOWN")"
LOG_GROUP="$(aws codebuild batch-get-builds --ids "$BUILD_ID" --query 'builds[0].logs.groupName' --output text 2>/dev/null || true)"
LOG_STREAM="$(aws codebuild batch-get-builds --ids "$BUILD_ID" --query 'builds[0].logs.streamName' --output text 2>/dev/null || true)"

echo "Build: $BUILD_ID"
echo "Status: $STATUS"
echo "Phase:  $PHASE"
echo "Source: $SOURCE_SHA"
echo ""

if [ "$STATUS" = "IN_PROGRESS" ]; then
  echo "⏳ Build in progress..."
  echo "Monitor: https://console.aws.amazon.com/codesuite/codebuild/projects/$PROJECT_NAME"
  exit 0
fi

if [ "$STATUS" = "SUCCEEDED" ]; then
  echo "✅ Build succeeded! Docker image should be in ECR."
  echo ""
  echo "Next step:"
  echo "  ./cloud-deployment/create-app-runner-from-ecr.sh"
  exit 0
fi

echo "❌ Build did not succeed."
echo "Console: https://console.aws.amazon.com/codesuite/codebuild/projects/$PROJECT_NAME"

if [ -n "${LOG_GROUP:-}" ] && [ "${LOG_GROUP}" != "None" ] && [ -n "${LOG_STREAM:-}" ] && [ "${LOG_STREAM}" != "None" ]; then
  echo ""
  echo "📄 Recent log tail (errors/high-signal):"
  aws logs get-log-events \
    --log-group-name "$LOG_GROUP" \
    --log-stream-name "$LOG_STREAM" \
    --limit 250 \
    --query 'events[*].message' \
    --output text 2>/dev/null \
    | tail -200 \
    | egrep -i 'error|failed|fail|exception|npm ERR|prisma|tsc|nest|docker build|docker push|ENOENT|EAI_|ECONN' \
    | tail -80 \
    || true
else
  echo ""
  echo "⚠️  No CloudWatch logs were attached to this build (yet)."
fi

echo ""

