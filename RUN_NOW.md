# 🚀 Ready to Run!

## ✅ What's Done
- ✅ Dependencies installed
- ✅ Prisma client generated
- ✅ .env file created

## ⚠️ What You Need to Do

### 1. Setup PostgreSQL Database

**Option A: If PostgreSQL is already installed:**
```bash
# Create database
createdb mv_os

# Or using psql:
psql -U postgres
CREATE DATABASE mv_os;
\q
```

**Option B: Install PostgreSQL:**
- Mac: `brew install postgresql@14` then `brew services start postgresql@14`
- Windows: Download from https://www.postgresql.org/download/windows/
- Linux: `sudo apt-get install postgresql-14`

### 2. Update Database URL

Edit `backend/.env` and update the DATABASE_URL:
```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/mv_os?schema=public"
```

Replace:
- `YOUR_USERNAME` with your PostgreSQL username (often `postgres`)
- `YOUR_PASSWORD` with your PostgreSQL password

### 3. Run Database Setup

```bash
cd backend
npx prisma migrate dev --name init
npm run prisma:seed
```

### 4. Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 🎯 Quick Start (If DB is Ready)

If your database is already set up, you can run:

```bash
# Setup database
cd backend
npx prisma migrate dev --name init
npm run prisma:seed

# Then start servers (in separate terminals)
cd backend && npm run start:dev
cd frontend && npm run dev
```

## 📝 Default Login

After seeding:
- Email: `admin@mindvalley.eg`
- Password: `admin123`

## 🔗 URLs

- Frontend: http://localhost:3001
- Backend API: http://localhost:3000/api











