# 🚀 Quick Start Guide

## Prerequisites

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/)
3. **npm** (comes with Node.js)

## Step 1: Setup Database

1. Create a PostgreSQL database:
```sql
CREATE DATABASE mv_os;
```

2. Update `backend/.env` with your database credentials:
```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/mv_os?schema=public"
```

## Step 2: Install Dependencies

### Option A: Use the run script (Recommended)

**Mac/Linux:**
```bash
chmod +x run.sh
./run.sh
```

**Windows:**
```powershell
.\run.ps1
```

### Option B: Manual installation

```bash
# Install all dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

## Step 3: Setup Database Schema

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database (creates default users)
npm run prisma:seed
```

## Step 4: Start Servers

### Option A: Use the run script
The run script will start both servers automatically.

### Option B: Manual start

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

## Step 5: Access the Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000/api

## Default Login Credentials

After running the seed script:

- **Super Admin**: 
  - Email: `admin@mindvalley.eg`
  - Password: `admin123`

- **Management**: 
  - Email: `management@mindvalley.eg`
  - Password: `admin123`

- **Instructor**: 
  - Email: `instructor@mindvalley.eg`
  - Password: `admin123`

## Troubleshooting

### Database Connection Error
- Check PostgreSQL is running: `pg_isready` or check service status
- Verify DATABASE_URL in `backend/.env`
- Ensure database exists: `psql -l` to list databases

### Port Already in Use
- Backend uses port 3000, frontend uses 3001
- Change ports in `.env` files if needed

### Prisma Errors
- Run `npx prisma generate` after schema changes
- Check migration status: `npx prisma migrate status`

### Module Not Found
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

## Next Steps

1. Login with default credentials
2. Explore the dashboards
3. Create students, classes, and other entities
4. Configure notification services (optional)

## Development

- Backend hot-reload: Enabled (NestJS watch mode)
- Frontend hot-reload: Enabled (Next.js dev mode)
- Database GUI: Run `npx prisma studio` in backend folder












