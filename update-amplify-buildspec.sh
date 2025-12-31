#!/bin/bash
# Update Amplify buildspec via API

APP_ID="du3m4x9j7wlp6"
REGION="us-east-1"

BUILDSPEC=$(cat << 'BUILDSPEC_END'
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - echo "Installing dependencies..."
        - |
          if [ -d "Mvalley System/frontend" ]; then
            cd "Mvalley System/frontend"
          elif [ -d "frontend" ]; then
            cd "frontend"
          else
            echo "ERROR: Frontend directory not found"
            exit 1
          fi
          pwd
        - npm install --legacy-peer-deps
    build:
      commands:
        - echo "Building Next.js application..."
        - npm run build
  artifacts:
    baseDirectory: out
    files:
      - '**/*'
  cache:
    paths:
      - "Mvalley System/frontend/node_modules/**/*"
      - "Mvalley System/frontend/.next/cache/**/*"
BUILDSPEC_END
)

echo "Updating Amplify buildspec..."
aws amplify update-app \
  --app-id $APP_ID \
  --region $REGION \
  --build-spec "$BUILDSPEC" \
  --query 'app.appId' \
  --output text

echo ""
echo "✅ Buildspec updated!"
