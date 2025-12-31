#!/usr/bin/env bash
set -euo pipefail

# MV-OS: one-time staging setup (safe)
# - Creates a dedicated staging RDS instance (mv-os-db-staging)
# - Creates dedicated staging secrets:
#   - mv-os/staging/database-url
#   - mv-os/staging/jwt-secret
#
# It does NOT touch production resources (mv-os-db, mv-os/database-url, mv-os/jwt-secret).
#
# Usage:
#   ./cloud-deployment/setup-staging.sh
#
# Optional env:
#   DB_INSTANCE_ID=mv-os-db-staging
#   DB_NAME=mv_os_staging
#   DB_USERNAME=postgres
#   DB_CLASS=db.t3.micro
#   ALLOCATED_STORAGE=20

confirm() {
  local PROMPT="$1"
  read -r -p "$PROMPT (type 'STAGING' to continue): " ans
  if [ "${ans}" != "STAGING" ]; then
    echo "Aborted."
    exit 1
  fi
}

if ! command -v aws >/dev/null 2>&1; then
  echo "❌ AWS CLI not found. Install awscli first."
  exit 1
fi

if ! aws sts get-caller-identity >/dev/null 2>&1; then
  echo "❌ AWS credentials not configured. Run: aws configure"
  exit 1
fi

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
REGION="${AWS_REGION:-$(aws configure get region 2>/dev/null || true)}"
REGION="${REGION:-us-east-1}"

DB_INSTANCE_ID="${DB_INSTANCE_ID:-mv-os-db-staging}"
DB_NAME="${DB_NAME:-mv_os_staging}"
DB_USERNAME="${DB_USERNAME:-postgres}"
DB_CLASS="${DB_CLASS:-db.t3.micro}"
ALLOCATED_STORAGE="${ALLOCATED_STORAGE:-20}"

DB_SECRET_NAME="mv-os/staging/database-url"
JWT_SECRET_NAME="mv-os/staging/jwt-secret"

echo "🧪 MV-OS Staging Setup"
echo "  Account: $ACCOUNT_ID"
echo "  Region:  $REGION"
echo ""
echo "Resources to create/update (STAGING ONLY):"
echo "  RDS:     $DB_INSTANCE_ID ($DB_CLASS, ${ALLOCATED_STORAGE}GB)"
echo "  DB:      $DB_NAME"
echo "  Secrets: $DB_SECRET_NAME , $JWT_SECRET_NAME"
echo ""

confirm "This will create cloud resources and may incur cost. Continue?"

# Generate a strong password (stored only in Secrets Manager via DATABASE_URL)
DB_PASSWORD="$(openssl rand -base64 32 | tr -d '=+/' | cut -c1-25)"

# Find default VPC
VPC_ID="$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text --region "$REGION" 2>/dev/null || true)"
if [ -z "$VPC_ID" ] || [ "$VPC_ID" = "None" ]; then
  echo "❌ No default VPC found. Create/select a VPC and rerun with AWS configured."
  exit 1
fi

# Subnet group
SUBNET_GROUP="$(aws rds describe-db-subnet-groups --query "DBSubnetGroups[?DBSubnetGroupName=='mv-os-staging-subnet-group'].DBSubnetGroupName | [0]" --output text --region "$REGION" 2>/dev/null || true)"
if [ -z "$SUBNET_GROUP" ] || [ "$SUBNET_GROUP" = "None" ]; then
  SUBNETS="$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[*].SubnetId" --output text --region "$REGION")"
  if [ -z "$SUBNETS" ]; then
    echo "❌ No subnets found in default VPC"
    exit 1
  fi
  SUBNET_GROUP="mv-os-staging-subnet-group"
  aws rds create-db-subnet-group \
    --db-subnet-group-name "$SUBNET_GROUP" \
    --db-subnet-group-description "MV-OS Staging Subnet Group" \
    --subnet-ids $SUBNETS \
    --region "$REGION" >/dev/null
fi

# Security group (restrict inbound to your current IP)
SG_NAME="mv-os-db-staging-sg"
SG_ID="$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$SG_NAME" "Name=vpc-id,Values=$VPC_ID" --query "SecurityGroups[0].GroupId" --output text --region "$REGION" 2>/dev/null || true)"
if [ -z "$SG_ID" ] || [ "$SG_ID" = "None" ]; then
  SG_ID="$(aws ec2 create-security-group --group-name "$SG_NAME" --description "MV-OS Staging RDS Security Group" --vpc-id "$VPC_ID" --query 'GroupId' --output text --region "$REGION")"
fi

MY_IP="$(curl -s https://checkip.amazonaws.com || true)"
if [ -n "$MY_IP" ]; then
  aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp \
    --port 5432 \
    --cidr "$MY_IP/32" \
    --region "$REGION" 2>/dev/null || true
fi

# Create RDS if missing
if aws rds describe-db-instances --db-instance-identifier "$DB_INSTANCE_ID" --region "$REGION" >/dev/null 2>&1; then
  echo "✅ RDS instance already exists: $DB_INSTANCE_ID"
else
  echo "📦 Creating RDS instance (staging)..."

  PG_VERSION="$(aws rds describe-db-engine-versions --engine postgres --query "DBEngineVersions[?starts_with(EngineVersion, '14.')].EngineVersion | sort(@) | [-1]" --output text --region "$REGION" 2>/dev/null || true)"
  PG_VERSION="${PG_VERSION:-14.12}"

  aws rds create-db-instance \
    --db-instance-identifier "$DB_INSTANCE_ID" \
    --db-instance-class "$DB_CLASS" \
    --engine postgres \
    --engine-version "$PG_VERSION" \
    --master-username "$DB_USERNAME" \
    --master-user-password "$DB_PASSWORD" \
    --allocated-storage "$ALLOCATED_STORAGE" \
    --storage-type gp3 \
    --db-name "$DB_NAME" \
    --vpc-security-group-ids "$SG_ID" \
    --db-subnet-group-name "$SUBNET_GROUP" \
    --publicly-accessible \
    --backup-retention-period 3 \
    --storage-encrypted \
    --no-multi-az \
    --tags Key=Project,Value=MV-OS Key=Environment,Value=Staging \
    --region "$REGION" >/dev/null

  echo "⏳ Waiting for RDS to become available..."
  aws rds wait db-instance-available --db-instance-identifier "$DB_INSTANCE_ID" --region "$REGION"
fi

ENDPOINT="$(aws rds describe-db-instances --db-instance-identifier "$DB_INSTANCE_ID" --query "DBInstances[0].Endpoint.Address" --output text --region "$REGION")"
PORT="$(aws rds describe-db-instances --db-instance-identifier "$DB_INSTANCE_ID" --query "DBInstances[0].Endpoint.Port" --output text --region "$REGION")"

DB_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${ENDPOINT}:${PORT}/${DB_NAME}?schema=public"

echo "🔐 Creating/updating staging secrets..."
aws secretsmanager create-secret \
  --name "$DB_SECRET_NAME" \
  --secret-string "$DB_URL" \
  --region "$REGION" 2>/dev/null || \
aws secretsmanager update-secret \
  --secret-id "$DB_SECRET_NAME" \
  --secret-string "$DB_URL" \
  --region "$REGION" >/dev/null

JWT_SECRET_VALUE="mv-os-staging-jwt-$(openssl rand -hex 16)"
aws secretsmanager create-secret \
  --name "$JWT_SECRET_NAME" \
  --secret-string "$JWT_SECRET_VALUE" \
  --region "$REGION" 2>/dev/null || \
aws secretsmanager update-secret \
  --secret-id "$JWT_SECRET_NAME" \
  --secret-string "$JWT_SECRET_VALUE" \
  --region "$REGION" >/dev/null

echo ""
echo "✅ Staging setup complete"
echo "  RDS:     $ENDPOINT:$PORT / $DB_NAME"
echo "  Secrets: $DB_SECRET_NAME , $JWT_SECRET_NAME"
echo ""
echo "Next: deploy staging backend App Runner using:"
echo "  ENV=staging SERVICE_NAME=mv-os-backend-staging DB_SECRET_NAME=$DB_SECRET_NAME JWT_SECRET_NAME=$JWT_SECRET_NAME ./cloud-deployment/create-or-update-app-runner-from-ecr.sh"


