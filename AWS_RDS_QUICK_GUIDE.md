# 🚀 AWS RDS Quick Setup Guide

## ⚡ Fastest Path (5-10 minutes)

### Step 1: Create RDS Instance (5 minutes)

1. **Go to AWS Console**: https://console.aws.amazon.com/rds
2. **Click**: "Create database"
3. **Quick Settings**:
   ```
   Engine: PostgreSQL
   Version: 14.x
   Template: Free tier (if eligible)
   
   Settings:
   - DB instance identifier: mv-os-db
   - Master username: postgres
   - Master password: [CREATE STRONG PASSWORD]
   - Confirm password: [SAME PASSWORD]
   
   Instance configuration:
   - DB instance class: db.t3.micro (free tier)
   
   Storage:
   - Allocated storage: 20 GB
   
   Connectivity:
   - Public access: YES ✅
   - VPC security group: Create new
   - Initial database name: mv_os
   ```
4. **Click**: "Create database"
5. **Wait**: 5-10 minutes (status will change to "Available")

### Step 2: Configure Security Group (1 minute)

1. **In RDS Console** → Click your database (`mv-os-db`)
2. **Connectivity & security** tab
3. **Click** the Security Group link (e.g., `sg-xxxxx`)
4. **Inbound rules** → **Edit inbound rules**
5. **Add rule**:
   ```
   Type: PostgreSQL
   Port: 5432
   Source: My IP (or 0.0.0.0/0 for development)
   Description: MV-OS access
   ```
6. **Save rules**

### Step 3: Get Connection Details (30 seconds)

In RDS Console, note:
- **Endpoint**: `mv-os-db.xxxxx.us-east-1.rds.amazonaws.com`
- **Port**: `5432`
- **Database**: `mv_os`
- **Username**: `postgres`
- **Password**: (the one you created)

### Step 4: Run Setup Script (1 minute)

```bash
chmod +x aws-rds-step-by-step.sh
./aws-rds-step-by-step.sh
```

The script will:
- Prompt for connection details
- Update `backend/.env`
- Test connection
- Run migrations
- Seed database
- Start backend server

### OR Manual Setup:

```bash
# 1. Update backend/.env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@YOUR_ENDPOINT:5432/mv_os?schema=public"

# 2. Run setup
cd backend
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run start:dev
```

## ✅ That's It!

Your system will be running:
- **Frontend**: http://localhost:3001
- **Backend**: http://localhost:3000/api
- **Login**: `admin@mindvalley.eg` / `admin123`

## 🔒 Security Notes

**For Development:**
- Public access: OK
- Security Group: Allow your IP or 0.0.0.0/0

**For Production:**
- Public access: NO
- Use VPC with private subnets
- Use IAM authentication
- Enable SSL: Add `?sslmode=require` to connection string

## 💰 Cost

**Free Tier (12 months):**
- 750 hours/month of db.t3.micro
- 20 GB storage
- 20 GB backup storage
- **Total: $0/month**

**After Free Tier:**
- db.t3.micro: ~$15/month
- Storage: ~$2.30/month (20 GB)
- **Total: ~$17/month**

## 🐛 Troubleshooting

**"Can't reach database server"**
- Check Security Group allows your IP
- Wait for database to be "Available" (5-10 min)
- Verify endpoint is correct

**"Password authentication failed"**
- Check username and password
- Verify database name is correct

**"Connection timeout"**
- Security Group may not be configured
- Check if database is in "Available" status
- Verify VPC and subnet settings

## 📖 More Help

- See `AWS_SETUP.md` for detailed guide
- See `aws-rds-quickstart.md` for alternative quick guide
- AWS RDS Docs: https://docs.aws.amazon.com/rds/











