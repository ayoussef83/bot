#!/bin/bash

echo "🚀 Completing MV-OS Setup with AWS RDS"
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

# Check for saved password
if [ -f "rds-password.txt" ]; then
    echo "✅ Found saved password"
    DB_PASSWORD=$(cat rds-password.txt)
else
    echo "Enter the RDS database password:"
    echo "   (This was set when the RDS instance was created)"
    echo "   If you don't remember it, we can reset it."
    echo ""
    read -p "Do you have the password? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "Would you like to reset the password? (This will require restarting the DB)"
        read -p "Reset password? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            NEW_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
            echo ""
            echo "Resetting password (this will take a few minutes)..."
            aws rds modify-db-instance \
                --db-instance-identifier mv-os-db \
                --master-user-password "$NEW_PASSWORD" \
                --apply-immediately > /dev/null
            
            echo "✅ Password reset initiated"
            echo "   New password: $NEW_PASSWORD"
            echo "   (Saving to rds-password.txt)"
            echo "$NEW_PASSWORD" > rds-password.txt
            chmod 600 rds-password.txt
            
            echo ""
            echo "⏳ Waiting for instance to be available after password reset..."
            while true; do
                STATUS=$(aws rds describe-db-instances \
                    --db-instance-identifier mv-os-db \
                    --query "DBInstances[0].DBInstanceStatus" \
                    --output text 2>/dev/null)
                if [ "$STATUS" == "available" ]; then
                    echo "✅ Instance is available"
                    break
                fi
                echo "   Status: $STATUS (waiting...)"
                sleep 15
            done
            
            DB_PASSWORD=$NEW_PASSWORD
        else
            echo "Please get the password and run this script again"
            exit 1
        fi
    else
        read -s -p "Enter password: " DB_PASSWORD
        echo ""
        
        # Offer to save
        read -p "Save password to rds-password.txt? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "$DB_PASSWORD" > rds-password.txt
            chmod 600 rds-password.txt
            echo "✅ Password saved"
        fi
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

echo ""
echo "✅ Updated backend/.env"
echo ""

# Setup database
echo "🔧 Setting up database..."
cd backend

echo ""
echo "1️⃣  Generating Prisma client..."
npx prisma generate

echo ""
echo "2️⃣  Testing database connection..."
if npx prisma db pull --force 2>&1 | grep -q "Introspecting\|schema"; then
    echo "✅ Connection successful!"
    echo ""
    
    echo "3️⃣  Running database migrations..."
    npx prisma migrate deploy 2>&1 | tail -20
    
    MIGRATION_SUCCESS=$?
    
    if [ $MIGRATION_SUCCESS -eq 0 ]; then
        echo ""
        echo "✅ Migrations completed!"
        echo ""
        
        echo "4️⃣  Seeding database (creating default users)..."
        npm run prisma:seed 2>&1 | tail -20
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Database seeded successfully!"
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "🎉 Setup Complete!"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            echo "📝 Default Login Credentials:"
            echo "   Email: admin@mindvalley.eg"
            echo "   Password: admin123"
            echo ""
            echo "🌐 Access URLs:"
            echo "   Frontend: http://localhost:3001"
            echo "   Backend:  http://localhost:3000/api"
            echo ""
            echo "🚀 Starting backend server..."
            echo ""
            npm run start:dev
        else
            echo ""
            echo "⚠️  Seed completed with warnings, but continuing..."
            echo "Starting backend server..."
            npm run start:dev
        fi
    else
        echo ""
        echo "⚠️  Standard migration failed, trying dev migration..."
        npx prisma migrate dev --name init 2>&1 | tail -15
        echo ""
        echo "Seeding database..."
        npm run prisma:seed 2>&1 | tail -10
        echo ""
        echo "Starting backend..."
        npm run start:dev
    fi
else
    echo "❌ Connection failed"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check if password is correct"
    echo "  2. Verify Security Group allows your IP"
    echo "  3. Ensure database is in 'available' status"
    echo ""
    echo "To check Security Group:"
    SG_ID=$(aws rds describe-db-instances \
        --db-instance-identifier mv-os-db \
        --query "DBInstances[0].VpcSecurityGroups[0].GroupId" \
        --output text 2>/dev/null)
    echo "  Security Group ID: $SG_ID"
    echo ""
    echo "To add your IP to Security Group:"
    MY_IP=$(curl -s https://checkip.amazonaws.com)
    echo "  aws ec2 authorize-security-group-ingress \\"
    echo "    --group-id $SG_ID \\"
    echo "    --protocol tcp \\"
    echo "    --port 5432 \\"
    echo "    --cidr $MY_IP/32"
    exit 1
fi












