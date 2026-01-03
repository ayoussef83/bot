# 🚀 AWS RDS Quick Start (5 Minutes)

## Fastest Path to AWS RDS Setup

### Step 1: Create RDS Instance (3 minutes)

1. **Go to**: https://console.aws.amazon.com/rds
2. **Click**: "Create database"
3. **Quick Settings**:
   - Engine: **PostgreSQL 14**
   - Template: **Free tier** (or Dev/Test)
   - DB instance: `mv-os-db`
   - Username: `postgres`
   - Password: **[Create strong password]**
   - Instance: `db.t3.micro` (free tier)
   - **Public access: Yes**
   - Database name: `mv_os`
4. **Click**: "Create database"
5. **Wait**: 5-10 minutes for creation

### Step 2: Configure Security (1 minute)

1. **In RDS Console** → Click your database
2. **Security Group** → Click the security group link
3. **Inbound Rules** → Edit inbound rules
4. **Add Rule**:
   - Type: PostgreSQL
   - Port: 5432
   - Source: **My IP** (or 0.0.0.0/0 for dev)
5. **Save**

### Step 3: Get Connection String (30 seconds)

1. **In RDS Console** → Your database
2. **Copy Endpoint** (e.g., `mv-os-db.xxxxx.us-east-1.rds.amazonaws.com`)
3. **Note**: Username, Password, Database name

### Step 4: Run Setup (30 seconds)

```bash
# Option 1: Use automated script
./setup-aws.sh

# Option 2: Manual
# Edit backend/.env with your connection string:
# DATABASE_URL="postgresql://postgres:PASSWORD@ENDPOINT:5432/mv_os?schema=public"

cd backend
npx prisma migrate deploy
npm run prisma:seed
npm run start:dev
```

## Connection String Format

```
postgresql://USERNAME:PASSWORD@ENDPOINT:5432/DATABASE_NAME?schema=public
```

Example:
```
postgresql://postgres:MyPassword123@mv-os-db.abc123.us-east-1.rds.amazonaws.com:5432/mv_os?schema=public
```

## That's It! 🎉

Your backend will connect to AWS RDS and you're ready to go!

**Access:**
- Frontend: http://localhost:3001
- Backend: http://localhost:3000/api
- Login: `admin@mindvalley.eg` / `admin123`











