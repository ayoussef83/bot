#!/bin/bash

echo "🔐 Setting up AWS Secrets Manager for MV-OS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-1")

# Get RDS connection details
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

# Get password
if [ -f "../rds-password.txt" ]; then
    DB_PASSWORD=$(cat ../rds-password.txt)
else
    read -s -p "Enter RDS password: " DB_PASSWORD
    echo ""
fi

# Construct database URL
DB_URL="postgresql://${USERNAME}:${DB_PASSWORD}@${ENDPOINT}:${PORT}/${DB_NAME}?schema=public"

# Create or update database URL secret
echo "Creating/updating database URL secret..."
aws secretsmanager create-secret \
    --name mv-os/database-url \
    --secret-string "$DB_URL" \
    --region $REGION 2>/dev/null || \
aws secretsmanager update-secret \
    --secret-id mv-os/database-url \
    --secret-string "$DB_URL" \
    --region $REGION > /dev/null

echo "✅ Database URL secret created/updated"

# Create or update JWT secret
JWT_SECRET="mv-os-production-jwt-secret-$(openssl rand -hex 16)"
echo "Creating/updating JWT secret..."
aws secretsmanager create-secret \
    --name mv-os/jwt-secret \
    --secret-string "$JWT_SECRET" \
    --region $REGION 2>/dev/null || \
aws secretsmanager update-secret \
    --secret-id mv-os/jwt-secret \
    --secret-string "$JWT_SECRET" \
    --region $REGION > /dev/null

echo "✅ JWT secret created/updated"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Secrets Created in AWS Secrets Manager"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Secrets ARNs:"
echo "  Database URL: arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:mv-os/database-url"
echo "  JWT Secret: arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:mv-os/jwt-secret"
echo ""
echo "Use these ARNs in your App Runner or ECS task definitions"












