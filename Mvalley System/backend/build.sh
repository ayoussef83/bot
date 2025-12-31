#!/bin/bash
set -e

echo "Starting build process..."
cd "$(dirname "$0")"

echo "Step 1: Installing dependencies..."
npm install --legacy-peer-deps

echo "Step 2: Generating Prisma client..."
npx prisma@5 generate

echo "Step 3: Building application..."
npm run build

echo "Build completed successfully!"

