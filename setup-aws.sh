#!/bin/bash

echo "☁️  AWS RDS PostgreSQL Setup"
echo ""
echo "This script will help you set up MV-OS with AWS RDS PostgreSQL"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "⚠️  AWS CLI not found"
    echo ""
    echo "Please install AWS CLI first:"
    echo "  macOS: brew install awscli"
    echo "  Or: https://aws.amazon.com/cli/"
    echo ""
    read -p "Do you want to continue with manual setup? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📋 AWS RDS Setup Steps:"
echo ""
echo "1. Go to AWS Console: https://console.aws.amazon.com/rds"
echo "2. Click 'Create database'"
echo "3. Choose:"
echo "   - Engine: PostgreSQL"
echo "   - Version: 14.x or 15.x"
echo "   - Template: Free tier (if available) or Dev/Test"
echo "   - DB instance identifier: mv-os-db"
echo "   - Master username: postgres (or your choice)"
echo "   - Master password: [create a strong password]"
echo "   - DB instance class: db.t3.micro (free tier) or db.t3.small"
echo "   - Storage: 20 GB (free tier) or as needed"
echo "   - VPC: Default VPC"
echo "   - Public access: Yes (for development)"
echo "   - Security group: Create new or use existing"
echo ""
echo "4. After creation, note the endpoint (e.g., mv-os-db.xxxxx.us-east-1.rds.amazonaws.com)"
echo ""

read -p "Enter your RDS endpoint: " rds_endpoint
read -p "Enter database name (default: mv_os): " db_name
db_name=${db_name:-mv_os}
read -p "Enter master username (default: postgres): " db_user
db_user=${db_user:-postgres}
read -s -p "Enter master password: " db_password
echo ""

# Construct connection string
db_url="postgresql://${db_user}:${db_password}@${rds_endpoint}:5432/${db_name}?schema=public"

# Update .env file
cat > backend/.env << EOF
# Database - AWS RDS
DATABASE_URL="${db_url}"

# JWT
JWT_SECRET="mv-os-super-secret-jwt-key-change-in-production-min-32-chars"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:3001"

# AWS Configuration (for future use)
AWS_REGION="us-east-1"
AWS_SES_ACCESS_KEY_ID=""
AWS_SES_SECRET_ACCESS_KEY=""
AWS_SES_FROM_EMAIL="noreply@mindvalley.eg"
EOF

echo ""
echo "✅ Updated backend/.env with AWS RDS connection"
echo ""
echo "⚠️  Important: Update Security Group"
echo "   - Go to RDS → Your DB → Connectivity & security"
echo "   - Click on Security Group"
echo "   - Add inbound rule:"
echo "     Type: PostgreSQL"
echo "     Port: 5432"
echo "     Source: Your IP address (or 0.0.0.0/0 for development)"
echo ""
read -p "Press Enter when Security Group is updated..."

echo ""
echo "Testing connection..."
cd backend

# Test connection
if npx prisma db pull --force 2>&1 | grep -q "Introspecting"; then
    echo "✅ Connection successful!"
else
    echo "⚠️  Connection test failed. Please check:"
    echo "   - Security Group allows your IP"
    echo "   - Endpoint is correct"
    echo "   - Credentials are correct"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "Running migrations..."
npx prisma migrate deploy || npx prisma migrate dev --name init

echo ""
echo "Seeding database..."
npm run prisma:seed

echo ""
echo "✅ AWS RDS setup complete!"
echo ""
echo "Starting backend server..."
npm run start:dev












