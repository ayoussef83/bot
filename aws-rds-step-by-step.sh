#!/bin/bash

echo "☁️  AWS RDS PostgreSQL Setup - Step by Step"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Instructions
echo "📋 STEP 1: Create RDS Instance in AWS Console"
echo ""
echo "1. Open: https://console.aws.amazon.com/rds"
echo "2. Click 'Create database'"
echo "3. Select 'Standard create'"
echo ""
echo "Configuration:"
echo "  • Engine: PostgreSQL"
echo "  • Version: 14.x (recommended)"
echo "  • Template: Free tier (if eligible) or Dev/Test"
echo "  • DB instance identifier: mv-os-db"
echo "  • Master username: postgres"
echo "  • Master password: [CREATE STRONG PASSWORD - SAVE IT!]"
echo "  • DB instance class: db.t3.micro (free tier)"
echo "  • Storage: 20 GB"
echo "  • Public access: YES (for development)"
echo "  • VPC security group: Create new (mv-os-db-sg)"
echo "  • Initial database name: mv_os"
echo ""
echo "4. Click 'Create database'"
echo "5. Wait 5-10 minutes for creation"
echo ""
read -p "Press Enter when RDS instance is created and status is 'Available'..."

# Step 2: Security Group
echo ""
echo "📋 STEP 2: Configure Security Group"
echo ""
echo "1. In RDS Console, click on your database (mv-os-db)"
echo "2. Go to 'Connectivity & security' tab"
echo "3. Click on the Security Group link (e.g., mv-os-db-sg)"
echo "4. Click 'Edit inbound rules'"
echo "5. Click 'Add rule':"
echo "   • Type: PostgreSQL"
echo "   • Port: 5432"
echo "   • Source: My IP (or 0.0.0.0/0 for development)"
echo "6. Click 'Save rules'"
echo ""
read -p "Press Enter when Security Group is configured..."

# Step 3: Get connection details
echo ""
echo "📋 STEP 3: Get Connection Details"
echo ""
echo "In RDS Console, note these details:"
echo "  • Endpoint (e.g., mv-os-db.xxxxx.us-east-1.rds.amazonaws.com)"
echo "  • Port (usually 5432)"
echo "  • Database name (mv_os)"
echo "  • Username (postgres)"
echo "  • Password (the one you created)"
echo ""

read -p "Enter RDS Endpoint: " rds_endpoint
read -p "Enter Database Name (default: mv_os): " db_name
db_name=${db_name:-mv_os}
read -p "Enter Username (default: postgres): " db_user
db_user=${db_user:-postgres}
read -s -p "Enter Password: " db_password
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
echo "✅ Updated backend/.env"
echo ""

# Step 4: Test connection
echo "📋 STEP 4: Testing Connection..."
cd backend

echo "Generating Prisma client..."
npx prisma generate

echo "Testing database connection..."
if npx prisma db pull --force 2>&1 | grep -q "Introspecting\|schema"; then
    echo "✅ Connection successful!"
    CONNECTION_OK=true
else
    echo "❌ Connection failed!"
    echo ""
    echo "Common issues:"
    echo "  • Security Group may not allow your IP"
    echo "  • Database may still be creating (wait a few more minutes)"
    echo "  • Endpoint or credentials may be incorrect"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    CONNECTION_OK=false
fi

# Step 5: Run migrations
if [ "$CONNECTION_OK" = true ]; then
    echo ""
    echo "📋 STEP 5: Running Database Migrations..."
    npx prisma migrate deploy 2>&1 | tail -10
    
    if [ $? -eq 0 ]; then
        echo "✅ Migrations completed!"
        
        echo ""
        echo "📋 STEP 6: Seeding Database..."
        npm run prisma:seed 2>&1 | tail -10
        
        if [ $? -eq 0 ]; then
            echo "✅ Database seeded!"
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "✅ AWS RDS Setup Complete!"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            echo "Starting backend server..."
            echo ""
            npm run start:dev
        else
            echo "⚠️  Seed failed, but you can continue"
            echo "Run manually: npm run prisma:seed"
        fi
    else
        echo "⚠️  Migrations failed"
        echo "Try: npx prisma migrate dev --name init"
    fi
else
    echo ""
    echo "⚠️  Please fix connection issues first"
    echo "Then run manually:"
    echo "  cd backend"
    echo "  npx prisma migrate deploy"
    echo "  npm run prisma:seed"
    echo "  npm run start:dev"
fi

cd ..












