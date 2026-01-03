#!/bin/bash

# Script to set up AWS Amplify for frontend deployment

set -e

echo "🚀 Setting up AWS Amplify for Frontend"
echo ""

BACKEND_URL="https://mzmeyp2cw9.us-east-1.awsapprunner.com"
API_URL="${BACKEND_URL}/api"

echo "📝 Backend API URL: $API_URL"
echo ""

# Check if Amplify CLI is installed
if ! command -v amplify &> /dev/null; then
    echo "⚠️  Amplify CLI not found. Installing..."
    npm install -g @aws-amplify/cli
    echo "✅ Amplify CLI installed"
    echo ""
fi

echo "📋 Next steps to deploy frontend to Amplify:"
echo ""
echo "1. Navigate to frontend directory:"
echo "   cd frontend"
echo ""
echo "2. Initialize Amplify (if not already done):"
echo "   amplify init"
echo "   # Follow prompts:"
echo "   # - Project name: mv-os-frontend"
echo "   # - Environment: production"
echo "   # - Framework: react"
echo "   # - Source directory: ."
echo "   # - Build command: npm run build"
echo "   # - Start command: npm start"
echo ""
echo "3. Add hosting:"
echo "   amplify add hosting"
echo "   # Select: Hosting with Amplify Console"
echo ""
echo "4. Set environment variable:"
echo "   amplify env add production"
echo "   # Or update .env.production:"
echo "   # NEXT_PUBLIC_API_URL=$API_URL"
echo ""
echo "5. Deploy:"
echo "   amplify publish"
echo ""
echo "Alternative: Use AWS Console"
echo "1. Go to: https://console.aws.amazon.com/amplify"
echo "2. Click 'New app' → 'Host web app'"
echo "3. Connect your GitHub repository"
echo "4. Select branch: main"
echo "5. Build settings:"
echo "   - Build command: npm run build"
echo "   - Output directory: .next"
echo "6. Environment variables:"
echo "   - NEXT_PUBLIC_API_URL = $API_URL"
echo "7. Deploy"
echo ""











