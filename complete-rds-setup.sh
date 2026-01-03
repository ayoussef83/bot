#!/bin/bash

echo "🔧 Completing RDS Setup for MV-OS"
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

echo "📋 RDS Connection Details:"
echo "   Endpoint: $ENDPOINT"
echo "   Port: $PORT"
echo "   Database: $DB_NAME"
echo "   Username: $USERNAME"
echo ""

# Check if password is in a file or environment
if [ -f "rds-password.txt" ]; then
    echo "✅ Found saved password"
    DB_PASSWORD=$(cat rds-password.txt)
else
    echo "Enter the database password (created when RDS instance was set up):"
    echo "   (If you don't remember, check the script output or AWS Secrets Manager)"
    read -s DB_PASSWORD
    echo ""
    
    # Offer to save it
    read -p "Save password to rds-password.txt? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "$DB_PASSWORD" > rds-password.txt
        chmod 600 rds-password.txt
        echo "✅ Password saved (file is protected)"
    fi
fi

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

# Test connection and setup
echo "🔧 Setting up database..."
cd backend

echo "1. Generating Prisma client..."
npx prisma generate

echo ""
echo "2. Testing connection..."
if npx prisma db pull --force 2>&1 | grep -q "Introspecting\|schema"; then
    echo "✅ Connection successful!"
    echo ""
    
    echo "3. Running migrations..."
    npx prisma migrate deploy 2>&1 | tail -15
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Migrations completed!"
        echo ""
        
        echo "4. Seeding database (creating default users)..."
        npm run prisma:seed 2>&1 | tail -15
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Database seeded!"
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "✅ Setup Complete!"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            echo "📝 Default Login Credentials:"
            echo "   Email: admin@mindvalley.eg"
            echo "   Password: admin123"
            echo ""
            echo "🚀 Starting backend server..."
            echo ""
            npm run start:dev
        else
            echo ""
            echo "⚠️  Seed had issues, but you can continue"
            echo "Starting backend anyway..."
            npm run start:dev
        fi
    else
        echo ""
        echo "⚠️  Migration issues detected"
        echo "Trying alternative migration method..."
        npx prisma migrate dev --name init 2>&1 | tail -10
        echo ""
        echo "Starting backend..."
        npm run start:dev
    fi
else
    echo "❌ Connection failed"
    echo ""
    echo "Please check:"
    echo "  - Password is correct"
    echo "  - Security Group allows your IP (41.38.193.84)"
    echo "  - Database is available"
    echo ""
    echo "To check Security Group:"
    echo "  aws ec2 describe-security-groups --group-ids \$(aws rds describe-db-instances --db-instance-identifier mv-os-db --query 'DBInstances[0].VpcSecurityGroups[0].GroupId' --output text)"
    exit 1
fi












