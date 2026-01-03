#!/bin/bash

echo "☁️  Setting up MV-OS with Existing AWS RDS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get RDS details
ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier mv-os-db \
    --query "DBInstances[0].Endpoint.Address" \
    --output text 2>/dev/null)

PORT=$(aws rds describe-db-instances \
    --db-instance-identifier mv-os-db \
    --query "DBInstances[0].Endpoint.Port" \
    --output text 2>/dev/null)

DB_NAME=$(aws rds describe-db-instances \
    --db-instance-identifier mv-os-db \
    --query "DBInstances[0].DBName" \
    --output text 2>/dev/null)

USERNAME=$(aws rds describe-db-instances \
    --db-instance-identifier mv-os-db \
    --query "DBInstances[0].MasterUsername" \
    --output text 2>/dev/null)

STATUS=$(aws rds describe-db-instances \
    --db-instance-identifier mv-os-db \
    --query "DBInstances[0].DBInstanceStatus" \
    --output text 2>/dev/null)

if [ -z "$ENDPOINT" ] || [ "$ENDPOINT" == "None" ]; then
    echo "❌ Could not find RDS instance 'mv-os-db'"
    exit 1
fi

echo "✅ Found RDS instance:"
echo "   Endpoint: $ENDPOINT"
echo "   Port: $PORT"
echo "   Database: $DB_NAME"
echo "   Username: $USERNAME"
echo "   Status: $STATUS"
echo ""

if [ "$STATUS" != "available" ]; then
    echo "⏳ Instance is not available yet (Status: $STATUS)"
    echo "   Waiting for it to become available..."
    
    while [ "$STATUS" != "available" ]; do
        if [ "$STATUS" == "failed" ] || [ "$STATUS" == "deleted" ]; then
            echo "❌ Instance status: $STATUS"
            exit 1
        fi
        sleep 10
        STATUS=$(aws rds describe-db-instances \
            --db-instance-identifier mv-os-db \
            --query "DBInstances[0].DBInstanceStatus" \
            --output text 2>/dev/null)
        echo "   Current status: $STATUS"
    done
    
    echo "✅ Instance is now available!"
    echo ""
fi

# Get password
echo "Enter the database password (created when RDS was set up):"
read -s DB_PASSWORD
echo ""

# Construct connection string
DB_URL="postgresql://${USERNAME}:${DB_PASSWORD}@${ENDPOINT}:${PORT}/${DB_NAME}?schema=public"

# Update .env file
REGION=$(aws configure get region || echo "us-east-1")

cat > backend/.env << EOF
# Database - AWS RDS
DATABASE_URL="${DB_URL}"

# JWT
JWT_SECRET="mv-os-super-secret-jwt-key-change-in-production-min-32-chars"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:3001"

# AWS Configuration
AWS_REGION="${REGION}"
AWS_SES_ACCESS_KEY_ID=""
AWS_SES_SECRET_ACCESS_KEY=""
AWS_SES_FROM_EMAIL="noreply@mindvalley.eg"
EOF

echo "✅ Updated backend/.env"
echo ""

# Test connection
echo "Testing database connection..."
cd backend

npx prisma generate

if npx prisma db pull --force 2>&1 | grep -q "Introspecting\|schema"; then
    echo "✅ Connection successful!"
    echo ""
    
    echo "Running migrations..."
    npx prisma migrate deploy 2>&1 | tail -10
    
    if [ $? -eq 0 ]; then
        echo "✅ Migrations completed!"
        echo ""
        
        echo "Seeding database..."
        npm run prisma:seed 2>&1 | tail -10
        
        if [ $? -eq 0 ]; then
            echo "✅ Database seeded!"
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "✅ Setup Complete!"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            echo "Starting backend server..."
            echo ""
            npm run start:dev
        else
            echo "⚠️  Seed completed with warnings"
            echo "Backend can still start"
        fi
    else
        echo "⚠️  Migration issues, but continuing..."
    fi
else
    echo "❌ Connection failed"
    echo "Please check:"
    echo "  - Password is correct"
    echo "  - Security Group allows your IP"
    echo "  - Database is available"
    exit 1
fi












