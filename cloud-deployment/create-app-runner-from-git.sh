#!/bin/bash

# This script helps create App Runner service from Git repository
# Note: App Runner requires manual connection via console for first-time setup

set -e

echo "🔗 App Runner Git Repository Setup Helper"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Determine project root (parent of cloud-deployment directory)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Safety check: Never initialize git in home directory
if [[ "$PROJECT_ROOT" == "$HOME" ]]; then
    echo "❌ ERROR: Cannot initialize git in home directory!"
    echo "   This would track all your personal files."
    echo "   Please run this script from within the project directory."
    exit 1
fi

# Check if Git is initialized in project root
if [ ! -d "$PROJECT_ROOT/.git" ]; then
    echo "⚠️  Git repository not initialized"
    echo ""
    echo "Project root: $PROJECT_ROOT"
    echo ""
    read -p "Initialize Git repository here? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
    echo "Initializing Git repository..."
    cd "$PROJECT_ROOT"
    git init
    git add .
    git commit -m "Initial commit - MV-OS"
    echo "✅ Git repository initialized"
    echo ""
    echo "Next: Push to GitHub/GitLab:"
    echo "  1. Create repository on GitHub/GitLab"
    echo "  2. git remote add origin <your-repo-url>"
    echo "  3. git push -u origin main"
    exit 0
fi

cd "$PROJECT_ROOT"

# Check for remote
GIT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")

if [ -z "$GIT_REMOTE" ]; then
    echo "⚠️  No Git remote configured"
    echo ""
    echo "To deploy via App Runner source code:"
    echo "  1. Create repository on GitHub/GitLab/Bitbucket"
    echo "  2. Run: git remote add origin <your-repo-url>"
    echo "  3. Run: git push -u origin main"
    echo ""
    exit 0
fi

echo "✅ Git Remote: $GIT_REMOTE"
echo ""

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-1")

# Get secrets ARNs
DB_SECRET_ARN=$(aws secretsmanager describe-secret \
    --secret-id mv-os/database-url \
    --query 'ARN' \
    --output text)

JWT_SECRET_ARN=$(aws secretsmanager describe-secret \
    --secret-id mv-os/jwt-secret \
    --query 'ARN' \
    --output text)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 App Runner Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Use these settings in AWS App Runner Console:"
echo ""
echo "Service Name: mv-os-backend"
echo ""
echo "Source Configuration:"
echo "  Type: Source code repository"
echo "  Provider: $(echo $GIT_REMOTE | grep -oE '(github|gitlab|bitbucket)' || echo 'GitHub/GitLab/Bitbucket')"
echo "  Repository: $GIT_REMOTE"
echo "  Branch: main (or master)"
echo ""
echo "Build Configuration:"
echo "  Build command: cd backend && npm install && npm run build"
echo "  Start command: cd backend && npm run start:prod"
echo "  Port: 3000"
echo ""
echo "Instance Configuration:"
echo "  CPU: 0.25 vCPU"
echo "  Memory: 0.5 GB"
echo ""
echo "Environment Variables:"
echo "  NODE_ENV = production"
echo "  PORT = 3000"
echo ""
echo "Secrets (from Secrets Manager):"
echo "  DATABASE_URL = $DB_SECRET_ARN"
echo "  JWT_SECRET = $JWT_SECRET_ARN"
echo ""
echo "Health Check:"
echo "  Path: /api/health"
echo "  Interval: 10 seconds"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Deploy Now:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to: https://console.aws.amazon.com/apprunner"
echo "2. Click 'Create service'"
echo "3. Follow the configuration above"
echo "4. Click 'Create & deploy'"
echo ""
echo "⏳ Deployment takes 5-10 minutes"
echo ""











