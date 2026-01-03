# ☁️ AWS RDS PostgreSQL Setup Guide

## Overview

This guide will help you set up MV-OS with AWS RDS PostgreSQL. AWS RDS is a managed database service that handles backups, updates, and scaling.

## Prerequisites

1. **AWS Account** - Sign up at https://aws.amazon.com (free tier available)
2. **AWS CLI** (optional, for automation):
   ```bash
   brew install awscli
   # Or download from: https://aws.amazon.com/cli/
   ```

## Step 1: Create RDS PostgreSQL Instance

### Via AWS Console (Recommended)

1. **Go to RDS Console**
   - Visit: https://console.aws.amazon.com/rds
   - Sign in to your AWS account

2. **Create Database**
   - Click "Create database"
   - Choose "Standard create"

3. **Engine Options**
   - Engine type: **PostgreSQL**
   - Version: **14.x** or **15.x** (recommended: 14.9 or latest)

4. **Templates**
   - **Free tier** (if eligible) - 750 hours/month free
   - Or **Production** / **Dev/Test** based on needs

5. **Settings**
   - DB instance identifier: `mv-os-db`
   - Master username: `postgres` (or your choice)
   - Master password: **Create a strong password** (save it!)
   - Confirm password

6. **Instance Configuration**
   - DB instance class: 
     - Free tier: `db.t3.micro` (1 vCPU, 1 GB RAM)
     - Dev/Test: `db.t3.small` (2 vCPU, 2 GB RAM)
     - Production: `db.t3.medium` or larger

7. **Storage**
   - Storage type: General Purpose SSD (gp3)
   - Allocated storage: 20 GB (free tier) or as needed
   - Enable storage autoscaling (optional)

8. **Connectivity**
   - VPC: Default VPC (or your custom VPC)
   - Subnet group: Default
   - **Public access: Yes** (for development - change to No in production)
   - VPC security group: Create new
     - Name: `mv-os-db-sg`
   - Availability Zone: No preference
   - Database port: 5432

9. **Database Authentication**
   - Password authentication

10. **Additional Configuration**
    - Initial database name: `mv_os`
    - Backup retention: 7 days (free tier: 1 day)
    - Enable encryption: Yes (recommended)

11. **Create Database**
    - Click "Create database"
    - Wait 5-10 minutes for instance to be available

## Step 2: Configure Security Group

**Critical Step!** Your database won't be accessible without this.

1. **Go to RDS Console** → Your database → Connectivity & security
2. **Click on Security Group** (e.g., `mv-os-db-sg`)
3. **Edit Inbound Rules**
   - Click "Edit inbound rules"
   - Click "Add rule"
   - Type: **PostgreSQL**
   - Port: **5432**
   - Source: 
     - **My IP** (for your current IP)
     - Or **0.0.0.0/0** (for development only - NOT recommended for production)
   - Description: "MV-OS access"
   - Click "Save rules"

## Step 3: Get Connection Details

1. **In RDS Console**, click on your database
2. **Note the Endpoint** (e.g., `mv-os-db.xxxxx.us-east-1.rds.amazonaws.com`)
3. **Note the Port** (usually 5432)
4. **You already have**: Username and Password

## Step 4: Update MV-OS Configuration

### Option A: Use Setup Script

```bash
chmod +x setup-aws.sh
./setup-aws.sh
```

The script will prompt you for:
- RDS endpoint
- Database name (default: mv_os)
- Username (default: postgres)
- Password

### Option B: Manual Setup

Edit `backend/.env`:

```env
# Database - AWS RDS
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@mv-os-db.xxxxx.us-east-1.rds.amazonaws.com:5432/mv_os?schema=public"

# JWT
JWT_SECRET="mv-os-super-secret-jwt-key-change-in-production-min-32-chars"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:3001"
```

Replace:
- `YOUR_PASSWORD` with your master password
- `mv-os-db.xxxxx.us-east-1.rds.amazonaws.com` with your endpoint
- `mv_os` with your database name if different

## Step 5: Run Database Setup

```bash
cd backend

# Test connection
npx prisma db pull

# Run migrations
npx prisma migrate deploy
# Or for development:
npx prisma migrate dev --name init

# Seed database
npm run prisma:seed
```

## Step 6: Start Backend

```bash
cd backend
npm run start:dev
```

Backend will run on: http://localhost:3000

## AWS Free Tier

**Eligibility:**
- New AWS accounts get 12 months free tier
- 750 hours/month of db.t2.micro or db.t3.micro
- 20 GB storage
- 20 GB backup storage

**After Free Tier:**
- db.t3.micro: ~$15/month
- db.t3.small: ~$30/month
- Plus storage costs: ~$0.115/GB/month

## Security Best Practices

1. **Use Security Groups** - Only allow your IP or application servers
2. **Enable Encryption** - Encrypt data at rest
3. **Use IAM Authentication** - For production (more secure than passwords)
4. **Regular Backups** - Enable automated backups
5. **VPC Configuration** - Use private subnets in production
6. **SSL/TLS** - Enable SSL connections (add `?sslmode=require` to connection string)

## Connection String with SSL

For production, use SSL:

```env
DATABASE_URL="postgresql://postgres:PASSWORD@ENDPOINT:5432/mv_os?schema=public&sslmode=require"
```

## Troubleshooting

### "Can't reach database server"
- Check Security Group allows your IP
- Verify endpoint is correct
- Check if database is "Available" status in RDS console

### "Password authentication failed"
- Verify username and password
- Check if database name is correct

### "Connection timeout"
- Security Group may not allow your IP
- Database may still be creating (wait 5-10 minutes)
- Check VPC and subnet configuration

### "Database does not exist"
- Create it manually in RDS:
  - Connect via psql or pgAdmin
  - Run: `CREATE DATABASE mv_os;`

## Cost Optimization

1. **Use Free Tier** - If eligible
2. **Stop when not in use** - Stop RDS instance when not developing
3. **Right-size instance** - Use smallest instance that meets needs
4. **Reserved Instances** - For production (save up to 75%)
5. **Monitor usage** - Use AWS Cost Explorer

## Next Steps

After database is set up:
1. ✅ Run migrations
2. ✅ Seed database
3. ✅ Start backend server
4. ✅ Access frontend at http://localhost:3001
5. ✅ Login with: `admin@mindvalley.eg` / `admin123`

## Additional AWS Services (Future)

Once database is set up, you can also configure:
- **AWS SES** - For email notifications
- **AWS S3** - For file storage
- **AWS CloudWatch** - For monitoring
- **AWS Lambda** - For serverless functions

See the main README for notification service setup.











