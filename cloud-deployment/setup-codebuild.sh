#!/bin/bash

set -e

echo "🔨 Setting up AWS CodeBuild for Docker Image Building"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-1")

echo "✅ AWS Account: $ACCOUNT_ID"
echo "✅ Region: $REGION"
echo ""

# Step 1: Create IAM role for CodeBuild
echo "📦 Step 1: Creating IAM Role for CodeBuild..."
echo ""

ROLE_NAME="CodeBuild-mv-os-backend-role"

# Trust policy
cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "codebuild.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Policy document
cat > /tmp/codebuild-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:${REGION}:${ACCOUNT_ID}:log-group:/aws/codebuild/mv-os-backend*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "codebuild:CreateReport",
        "codebuild:UpdateReport",
        "codebuild:BatchPutTestCases"
      ],
      "Resource": "arn:aws:codebuild:${REGION}:${ACCOUNT_ID}:report-group/mv-os-backend*"
    }
  ]
}
EOF

# Create role
aws iam create-role \
    --role-name $ROLE_NAME \
    --assume-role-policy-document file:///tmp/trust-policy.json \
    > /dev/null 2>&1 || echo "Role may already exist"

# Attach policy
aws iam put-role-policy \
    --role-name $ROLE_NAME \
    --policy-name CodeBuildPolicy \
    --policy-document file:///tmp/codebuild-policy.json \
    > /dev/null 2>&1

# Wait for role to be ready
sleep 2

echo "✅ IAM Role created"
echo ""

# Step 2: Delete existing project if it exists
echo "📦 Step 2: Setting up CodeBuild Project..."
echo ""

aws codebuild delete-project --name mv-os-backend-build > /dev/null 2>&1 || echo "No existing project to delete"

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

# Get GitHub connection ARN
CONNECTION_ARN="arn:aws:apprunner:us-east-1:149959196988:connection/test3/5f29bfc587644e8f8170408856705e70"

cat > /tmp/codebuild-project.json <<EOF
{
  "name": "mv-os-backend-build",
  "description": "Build MV-OS backend Docker image",
  "source": {
    "type": "GITHUB",
    "location": "https://github.com/ayoussef83/bot.git",
    "buildspec": "cloud-deployment/buildspec-docker.yml"
  },
  "artifacts": {
    "type": "NO_ARTIFACTS"
  },
  "environment": {
    "type": "LINUX_CONTAINER",
    "image": "aws/codebuild/standard:7.0",
    "computeType": "BUILD_GENERAL1_SMALL",
    "privilegedMode": true,
    "environmentVariables": [
      {
        "name": "AWS_DEFAULT_REGION",
        "value": "${REGION}"
      },
      {
        "name": "AWS_ACCOUNT_ID",
        "value": "${ACCOUNT_ID}"
      }
    ]
  },
  "serviceRole": "$ROLE_ARN",
  "timeoutInMinutes": 60,
  "queuedTimeoutInMinutes": 480
}
EOF

aws codebuild create-project \
    --cli-input-json file:///tmp/codebuild-project.json

if [ $? -eq 0 ]; then
    echo "✅ CodeBuild project created"
else
    echo "❌ Failed to create CodeBuild project"
    exit 1
fi

echo ""

# Step 3: Start build
echo "📦 Step 3: Starting Build..."
echo ""

BUILD_ID=$(aws codebuild start-build \
    --project-name mv-os-backend-build \
    --query 'build.id' \
    --output text)

if [ -n "$BUILD_ID" ] && [ "$BUILD_ID" != "None" ]; then
    echo "✅ Build started: $BUILD_ID"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ CodeBuild Setup Complete!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Monitor build progress:"
    echo "  https://console.aws.amazon.com/codesuite/codebuild/projects/mv-os-backend-build/build/$BUILD_ID"
    echo ""
    echo "⏳ Build takes 5-10 minutes"
    echo ""
    echo "Once build completes, run:"
    echo "  ./cloud-deployment/create-app-runner-from-ecr.sh"
    echo ""
else
    echo "❌ Failed to start build"
    exit 1
fi

rm -f /tmp/trust-policy.json /tmp/codebuild-policy.json /tmp/codebuild-project.json
