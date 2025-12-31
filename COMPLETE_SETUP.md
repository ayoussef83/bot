# ✅ Complete Setup Guide

## Current Status
- ✅ Frontend running at http://localhost:3001
- ✅ All code ready
- ⚠️  Need PostgreSQL database

## Easiest Solution: Use Free Cloud Database (5 minutes)

### Option 1: Supabase (Recommended - Easiest)

1. **Sign up**: Go to https://supabase.com and create free account
2. **Create project**: Click "New Project"
3. **Get connection string**:
   - Go to Settings → Database
   - Copy the "Connection string" (URI format)
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

4. **Update backend/.env**:
   ```bash
   cd backend
   # Edit .env and replace DATABASE_URL with your Supabase connection string
   ```

5. **Run setup**:
   ```bash
   cd backend
   npx prisma migrate dev --name init
   npm run prisma:seed
   npm run start:dev
   ```

**Done!** Backend will be running at http://localhost:3000

---

### Option 2: Neon (Alternative Cloud Database)

1. **Sign up**: Go to https://neon.tech and create free account
2. **Create project**: Click "Create Project"
3. **Get connection string**: Copy from dashboard
4. **Update backend/.env** with connection string
5. **Run setup** (same as above)

---

## Alternative: Install PostgreSQL Locally

### macOS with Homebrew

```bash
# Install Homebrew (if needed - requires password)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install PostgreSQL
brew install postgresql@14

# Start PostgreSQL
brew services start postgresql@14

# Create database
createdb mv_os

# Update backend/.env
# DATABASE_URL="postgresql://$(whoami)@localhost:5432/mv_os?schema=public"

# Run setup
cd backend
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev
```

### macOS without Homebrew

1. Download PostgreSQL: https://www.postgresql.org/download/macosx/
2. Install the .dmg file
3. Open Terminal and run:
   ```bash
   createdb mv_os
   ```
4. Update `backend/.env` with:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/mv_os?schema=public"
   ```
5. Run setup commands

---

## Quick Commands (After Database is Ready)

```bash
# Navigate to backend
cd backend

# Run migrations (creates all tables)
npx prisma migrate dev --name init

# Seed database (creates default users)
npm run prisma:seed

# Start backend server
npm run start:dev
```

## Verify Setup

1. **Frontend**: http://localhost:3001 ✅ (already running)
2. **Backend**: http://localhost:3000/api ✅ (after setup)
3. **Login**: 
   - Email: `admin@mindvalley.eg`
   - Password: `admin123`

## Troubleshooting

**"Can't reach database server"**
- Check if PostgreSQL is running: `pg_isready`
- Verify connection string in `backend/.env`
- For cloud databases, check firewall/network settings

**"Database does not exist"**
- Create it: `createdb mv_os`
- Or in psql: `CREATE DATABASE mv_os;`

**Migration errors**
- Run: `npx prisma generate`
- Check: `npx prisma migrate status`

---

## Recommended: Use Supabase (Fastest)

The cloud database option is fastest because:
- ✅ No installation needed
- ✅ Free tier available
- ✅ Works immediately
- ✅ Can access from anywhere
- ✅ Automatic backups

Just sign up, get connection string, update `.env`, and run migrations!











