# 🎯 Next Steps to Complete Setup

## Current Status

✅ **Completed:**
- All dependencies installed
- Prisma client generated
- Environment files created
- Frontend server starting (check http://localhost:3001)

⚠️ **Remaining:**
- PostgreSQL database setup
- Database migrations
- Backend server (needs database first)

## Step-by-Step Completion

### 1. Install PostgreSQL

**Easiest Option - macOS with Homebrew:**
```bash
# Install Homebrew (if needed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install PostgreSQL
brew install postgresql@14

# Start PostgreSQL
brew services start postgresql@14

# Create database
createdb mv_os
```

**Alternative - Download PostgreSQL:**
- Visit: https://www.postgresql.org/download/
- Download and install for your OS
- Create database: `createdb mv_os` or use pgAdmin

**Cloud Option (No Installation):**
- Sign up for free at https://supabase.com or https://neon.tech
- Get connection string
- Update `backend/.env` with the connection string

### 2. Update Database Credentials

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/mv_os?schema=public"
```

**Default macOS user:**
```env
DATABASE_URL="postgresql://$(whoami)@localhost:5432/mv_os?schema=public"
```

### 3. Run Database Setup

```bash
cd backend
npx prisma migrate dev --name init
npm run prisma:seed
```

### 4. Start Backend Server

```bash
cd backend
npm run start:dev
```

Backend will run on: http://localhost:3000

### 5. Access the Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000/api
- **Login**: `admin@mindvalley.eg` / `admin123`

## Quick Commands Reference

```bash
# Check if PostgreSQL is running
pg_isready

# Create database
createdb mv_os

# Run migrations
cd backend && npx prisma migrate dev --name init

# Seed database
cd backend && npm run prisma:seed

# Start backend
cd backend && npm run start:dev

# Start frontend (already running)
cd frontend && npm run dev
```

## Troubleshooting

**PostgreSQL connection error:**
- Check if PostgreSQL is running: `pg_isready`
- Verify credentials in `backend/.env`
- Ensure database exists: `psql -l`

**Port already in use:**
- Frontend: Change port in `frontend/package.json` scripts
- Backend: Change `PORT` in `backend/.env`

**Prisma errors:**
- Run `npx prisma generate` after schema changes
- Check migration status: `npx prisma migrate status`

## Need Help?

- See `INSTALL_POSTGRES.md` for detailed PostgreSQL installation
- See `SETUP.md` for full setup guide
- See `DEVELOPMENT.md` for development workflow











