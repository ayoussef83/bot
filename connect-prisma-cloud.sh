#!/bin/bash
# Connect MV-OS Backend to Prisma Cloud
# Usage: ./connect-prisma-cloud.sh

set -euo pipefail

echo "🔗 Prisma Cloud Connection Setup"
echo "=================================="
echo ""

# Check if .env exists
ENV_FILE="Mvalley System/backend/.env"
if [ -f "$ENV_FILE" ]; then
    echo "⚠️  Found existing .env file"
    read -p "Backup existing .env to .env.backup? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp "$ENV_FILE" "$ENV_FILE.backup"
        echo "✅ Backed up to .env.backup"
    fi
fi

echo ""
echo "📋 Enter your Prisma Cloud connection details:"
echo ""

# Get connection string from user
read -p "Paste your Prisma Cloud connection string: " PRISMA_URL
echo ""

# Validate connection string
if [[ ! "$PRISMA_URL" =~ ^postgres:// ]] && [[ ! "$PRISMA_URL" =~ ^prisma:// ]]; then
    echo "❌ Invalid connection string. Should start with 'postgres://' or 'prisma://'"
    exit 1
fi

# Ask about environment
echo "Which environment is this for?"
echo "1) Local Development"
echo "2) Production (AWS)"
echo "3) Both"
read -p "Enter choice (1-3): " ENV_CHOICE
echo ""

case $ENV_CHOICE in
    1)
        ENV_FILE="Mvalley System/backend/.env"
        ENV_TYPE="development"
        ;;
    2)
        echo "⚠️  For production, you'll need to update AWS Secrets Manager"
        echo "Secret name: mv-os/database-url"
        echo ""
        read -p "Update AWS secret now? (requires AWS CLI) (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            aws secretsmanager update-secret \
                --secret-id mv-os/database-url \
                --secret-string "$PRISMA_URL" \
                --region us-east-1 2>/dev/null || {
                echo "❌ Failed to update AWS secret. Please update manually:"
                echo "   Secret: mv-os/database-url"
                echo "   Value: $PRISMA_URL"
            }
        fi
        exit 0
        ;;
    3)
        ENV_FILE="Mvalley System/backend/.env"
        ENV_TYPE="development"
        echo "⚠️  For production, update AWS Secrets Manager separately"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

# Get other required values
read -p "JWT Secret (min 32 chars, or press Enter for default): " JWT_SECRET
JWT_SECRET=${JWT_SECRET:-"mv-os-dev-jwt-secret-change-in-production-min-32-chars"}

read -p "Frontend URL (default: http://localhost:3001): " FRONTEND_URL
FRONTEND_URL=${FRONTEND_URL:-"http://localhost:3001"}

# Create .env file
cat > "$ENV_FILE" << EOF
# Database - Prisma Cloud
DATABASE_URL="$PRISMA_URL"

# JWT
JWT_SECRET="$JWT_SECRET"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=$ENV_TYPE
FRONTEND_URL="$FRONTEND_URL"

# AWS Configuration (if needed)
AWS_REGION="us-east-1"
EOF

echo ""
echo "✅ Created/updated $ENV_FILE"
echo ""

# Test connection
echo "🧪 Testing connection..."
cd "Mvalley System/backend"

if npx prisma generate > /dev/null 2>&1; then
    echo "✅ Prisma Client generated"
else
    echo "⚠️  Failed to generate Prisma Client"
fi

if npx prisma db pull --force > /dev/null 2>&1; then
    echo "✅ Database connection successful!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Run migrations: npx prisma migrate deploy"
    echo "   2. Seed database: npm run prisma:seed"
    echo "   3. Start backend: npm run start:dev"
else
    echo "❌ Database connection failed"
    echo ""
    echo "Common issues:"
    echo "  • Check your connection string"
    echo "  • Ensure SSL is enabled (sslmode=require)"
    echo "  • Check network/firewall settings"
    echo ""
    echo "You can test manually with:"
    echo "  npx prisma db pull"
fi

