#!/bin/bash

echo "☁️  Creating AWS RDS PostgreSQL Instance"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found"
    echo "Please install: brew install awscli"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    echo "Run: aws configure"
    exit 1
fi

# Get AWS account info
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-1")
echo "✅ AWS Account: $ACCOUNT_ID"
echo "✅ Region: $REGION"
echo ""

# Generate random password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
DB_INSTANCE_ID="mv-os-db"
DB_NAME="mv_os"
DB_USERNAME="postgres"

echo "📋 RDS Configuration:"
echo "   Instance ID: $DB_INSTANCE_ID"
echo "   Database: $DB_NAME"
echo "   Username: $DB_USERNAME"
echo "   Password: $DB_PASSWORD (SAVE THIS!)"
echo "   Region: $REGION"
echo ""

# Check if instance already exists
if aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE_ID &> /dev/null; then
    echo "⚠️  RDS instance '$DB_INSTANCE_ID' already exists"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Get default VPC
echo "Finding default VPC..."
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text 2>/dev/null)

if [ "$VPC_ID" == "None" ] || [ -z "$VPC_ID" ]; then
    echo "⚠️  No default VPC found"
    echo "Please specify VPC ID:"
    read VPC_ID
else
    echo "✅ Found default VPC: $VPC_ID"
fi

# Get default subnet group or create one
echo "Finding subnet group..."
SUBNET_GROUP=$(aws rds describe-db-subnet-groups --query "DBSubnetGroups[?contains(DBSubnetGroupName, 'default')].DBSubnetGroupName" --output text 2>/dev/null | head -1)

if [ -z "$SUBNET_GROUP" ]; then
    echo "Creating default subnet group..."
    # Get subnets in default VPC
    SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[*].SubnetId" --output text)
    
    if [ -z "$SUBNETS" ]; then
        echo "❌ No subnets found in VPC"
        exit 1
    fi
    
    SUBNET_GROUP="mv-os-subnet-group"
    aws rds create-db-subnet-group \
        --db-subnet-group-name $SUBNET_GROUP \
        --db-subnet-group-description "MV-OS Subnet Group" \
        --subnet-ids $SUBNETS &> /dev/null
    
    echo "✅ Created subnet group: $SUBNET_GROUP"
else
    echo "✅ Using subnet group: $SUBNET_GROUP"
fi

# Create security group
echo "Creating security group..."
SG_NAME="mv-os-db-sg"
SG_ID=$(aws ec2 create-security-group \
    --group-name $SG_NAME \
    --description "MV-OS RDS Security Group" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text 2>/dev/null)

if [ -z "$SG_ID" ]; then
    # Security group might already exist
    SG_ID=$(aws ec2 describe-security-groups \
        --filters "Name=group-name,Values=$SG_NAME" "Name=vpc-id,Values=$VPC_ID" \
        --query "SecurityGroups[0].GroupId" \
        --output text 2>/dev/null)
    echo "✅ Using existing security group: $SG_ID"
else
    echo "✅ Created security group: $SG_ID"
fi

# Get current IP
MY_IP=$(curl -s https://checkip.amazonaws.com)
echo "Adding inbound rule for your IP: $MY_IP"

aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 5432 \
    --cidr "$MY_IP/32" 2>/dev/null || echo "Rule may already exist"

echo "✅ Security group configured"
echo ""

# Create RDS instance
echo "Creating RDS instance (this will take 5-10 minutes)..."
echo ""

# Get available PostgreSQL 14 version
PG_VERSION=$(aws rds describe-db-engine-versions \
    --engine postgres \
    --query "DBEngineVersions[?starts_with(EngineVersion, '14.')].EngineVersion | sort(@) | [0]" \
    --output text 2>/dev/null)

if [ -z "$PG_VERSION" ] || [ "$PG_VERSION" == "None" ]; then
    # Fallback to latest available
    PG_VERSION=$(aws rds describe-db-engine-versions \
        --engine postgres \
        --query "DBEngineVersions[0].EngineVersion" \
        --output text 2>/dev/null)
fi

echo "Using PostgreSQL version: $PG_VERSION"
echo ""

aws rds create-db-instance \
    --db-instance-identifier $DB_INSTANCE_ID \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version "$PG_VERSION" \
    --master-username $DB_USERNAME \
    --master-user-password "$DB_PASSWORD" \
    --allocated-storage 20 \
    --storage-type gp3 \
    --db-name $DB_NAME \
    --vpc-security-group-ids $SG_ID \
    --db-subnet-group-name $SUBNET_GROUP \
    --publicly-accessible \
    --backup-retention-period 7 \
    --storage-encrypted \
    --no-multi-az \
    --no-auto-minor-version-upgrade \
    --tags Key=Project,Value=MV-OS Key=Environment,Value=Development \
    > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ RDS instance creation started!"
    echo ""
    echo "⏳ Waiting for instance to be available (this takes 5-10 minutes)..."
    echo "   You can check status in AWS Console: https://console.aws.amazon.com/rds"
    echo ""
    
    # Wait for instance to be available
    echo -n "Waiting"
    while true; do
        STATUS=$(aws rds describe-db-instances \
            --db-instance-identifier $DB_INSTANCE_ID \
            --query "DBInstances[0].DBInstanceStatus" \
            --output text 2>/dev/null)
        
        if [ "$STATUS" == "available" ]; then
            echo ""
            echo "✅ RDS instance is available!"
            break
        elif [ "$STATUS" == "failed" ] || [ "$STATUS" == "deleted" ]; then
            echo ""
            echo "❌ RDS instance creation failed"
            exit 1
        fi
        
        echo -n "."
        sleep 30
    done
    
    # Get endpoint
    ENDPOINT=$(aws rds describe-db-instances \
        --db-instance-identifier $DB_INSTANCE_ID \
        --query "DBInstances[0].Endpoint.Address" \
        --output text)
    
    PORT=$(aws rds describe-db-instances \
        --db-instance-identifier $DB_INSTANCE_ID \
        --query "DBInstances[0].Endpoint.Port" \
        --output text)
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ RDS Instance Created Successfully!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📋 Connection Details:"
    echo "   Endpoint: $ENDPOINT"
    echo "   Port: $PORT"
    echo "   Database: $DB_NAME"
    echo "   Username: $DB_USERNAME"
    echo "   Password: $DB_PASSWORD"
    echo ""
    echo "⚠️  IMPORTANT: Save the password above!"
    echo ""
    
    # Update .env file
    DB_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${ENDPOINT}:${PORT}/${DB_NAME}?schema=public"
    
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
    
    echo "✅ Updated backend/.env with connection string"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Run: cd backend"
    echo "   2. Run: npx prisma generate"
    echo "   3. Run: npx prisma migrate deploy"
    echo "   4. Run: npm run prisma:seed"
    echo "   5. Run: npm run start:dev"
    echo ""
    echo "Or run the automated setup:"
    echo "   cd backend && npx prisma generate && npx prisma migrate deploy && npm run prisma:seed && npm run start:dev"
    
else
    echo "❌ Failed to create RDS instance"
    echo "Check AWS Console for details"
    exit 1
fi

