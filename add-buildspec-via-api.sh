#!/bin/bash
# Script to add buildspec.yml via GitHub API

REPO="ayoussef83/bot"
FILE="buildspec.yml"
BRANCH="main"
MESSAGE="Add buildspec.yml for CodeBuild"

CONTENT=$(cat << 'BUILDSPEC'
version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/mv-os-backend
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=${COMMIT_HASH:=latest}
      - echo "Repository URI: $REPOSITORY_URI"
      - echo "Current directory: $(pwd)"
      - echo "Listing files:"
      - ls -la
      - echo "Finding Dockerfile..."
      - find . -name "Dockerfile" -type f 2>/dev/null | head -5
  build:
    commands:
      - echo Build started on `date`
      - echo "Building Docker image..."
      - |
        # Find backend directory
        if [ -f "Mvalley System/backend/Dockerfile" ]; then
          cd "Mvalley System/backend"
        elif [ -f "backend/Dockerfile" ]; then
          cd backend
        else
          echo "ERROR: Dockerfile not found!"
          find . -name "Dockerfile" -type f
          exit 1
        fi
      - echo "Building from: $(pwd)"
      - echo "Dockerfile exists: $(test -f Dockerfile && echo 'YES' || echo 'NO')"
      - docker build -t $REPOSITORY_URI:latest -f Dockerfile .
      - docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on `date`
      - echo "Pushing Docker images..."
      - docker push $REPOSITORY_URI:latest
      - docker push $REPOSITORY_URI:$IMAGE_TAG
      - echo "✅ Image pushed successfully: $REPOSITORY_URI:latest"
BUILDSPEC
)

# Base64 encode content
ENCODED=$(echo "$CONTENT" | base64)

# Get current SHA of main branch
SHA=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$REPO/git/refs/heads/$BRANCH" | \
  grep -o '"sha":"[^"]*' | cut -d'"' -f4)

if [ -z "$SHA" ]; then
  echo "❌ Could not get branch SHA. Need GitHub token."
  echo ""
  echo "Set GITHUB_TOKEN environment variable:"
  echo "  export GITHUB_TOKEN=your_token_here"
  exit 1
fi

# Create blob
BLOB_SHA=$(curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.github.com/repos/$REPO/git/blobs" \
  -d "{\"content\":\"$ENCODED\",\"encoding\":\"base64\"}" | \
  grep -o '"sha":"[^"]*' | cut -d'"' -f4)

# Create tree
TREE_SHA=$(curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.github.com/repos/$REPO/git/trees" \
  -d "{\"base_tree\":\"$SHA\",\"tree\":[{\"path\":\"$FILE\",\"mode\":\"100644\",\"type\":\"blob\",\"sha\":\"$BLOB_SHA\"}]}" | \
  grep -o '"sha":"[^"]*' | cut -d'"' -f4)

# Create commit
COMMIT_SHA=$(curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.github.com/repos/$REPO/git/commits" \
  -d "{\"message\":\"$MESSAGE\",\"tree\":\"$TREE_SHA\",\"parents\":[\"$SHA\"]}" | \
  grep -o '"sha":"[^"]*' | cut -d'"' -f4)

# Update ref
curl -s -X PATCH \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.github.com/repos/$REPO/git/refs/heads/$BRANCH" \
  -d "{\"sha\":\"$COMMIT_SHA\"}"

echo "✅ File added to GitHub!"
