#!/bin/bash

# Try a simpler build command that's more likely to work
# This uses npm install instead of npm ci, and adds error handling

echo "Testing simpler build command..."
echo ""

cd backend

# Try the exact command App Runner will use
set -e

echo "Installing dependencies..."
npm install --legacy-peer-deps

echo "Generating Prisma client..."
npx prisma generate || echo "Prisma generate warning (may need DB)"

echo "Building..."
npm run build

echo "✅ Build successful!"











