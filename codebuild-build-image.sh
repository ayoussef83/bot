#!/usr/bin/env bash
set -euo pipefail

TARGET="${TARGET:-backend}"
ECR_REPO="${ECR_REPO:-mv-os-backend}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:?AWS_ACCOUNT_ID is required}"
AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:?AWS_DEFAULT_REGION is required}"
REPOSITORY_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$ECR_REPO"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# cd into repo subdir that contains the target
if [ -f "Mvalley System/$TARGET/Dockerfile" ]; then
  cd "Mvalley System/$TARGET"
elif [ -f "$TARGET/Dockerfile" ]; then
  cd "$TARGET"
else
  echo "ERROR: Dockerfile not found for target=$TARGET" >&2
  find . -name Dockerfile -type f || true
  exit 1
fi

echo "Building from: $(pwd)"

a=()
if [ -n "${NEXT_PUBLIC_API_URL:-}" ]; then
  a+=(--build-arg "NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL")
fi

echo "Docker build args: ${a[*]-<none>}"

docker build "${a[@]}" -t "$REPOSITORY_URI:latest" -f Dockerfile .
docker tag "$REPOSITORY_URI:latest" "$REPOSITORY_URI:$IMAGE_TAG"
