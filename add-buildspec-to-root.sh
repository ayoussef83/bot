#!/bin/bash
# Script to add buildspec.yml at the actual repository root

cd "/Users/ahmedyoussef/Mvalley System"

# The repository root appears to be the parent directory
# Let's create the file in a way that git will track it at root

# Check current git root
GIT_ROOT=$(git rev-parse --show-toplevel)
echo "Git root: $GIT_ROOT"
echo "Current dir: $(pwd)"

# If we're in "Mvalley System" subfolder, we need to go to parent
if [[ "$GIT_ROOT" == *"Mvalley System"* ]]; then
  echo "Repository includes 'Mvalley System' folder"
  # File should be at "Mvalley System/buildspec.yml" which is already there
  # But CodeBuild needs it at root
  echo "File exists at: Mvalley System/buildspec.yml"
  echo "Need to add at repository root"
fi

# Create buildspec at what git thinks is root
cat > "$GIT_ROOT/buildspec.yml" << 'BUILDSPEC'
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

echo "✅ Created buildspec.yml at: $GIT_ROOT/buildspec.yml"
echo ""
echo "Now add and commit:"
echo "  cd \"$GIT_ROOT\""
echo "  git add buildspec.yml"
echo "  git commit -m 'Add buildspec.yml at repository root'"
echo "  git push origin main"
