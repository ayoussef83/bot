# MV-OS Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies

```bash
# Root
npm install

# Backend
cd backend && npm install

# Frontend  
cd ../frontend && npm install
```

### Step 2: Setup Database

1. Create PostgreSQL database:
```sql
CREATE DATABASE mv_os;
```

2. Create `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/mv_os?schema=public"
JWT_SECRET="change-this-in-production-min-32-chars"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
```

3. Run migrations and seed:
```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed
```

### Step 3: Start Servers

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

### Step 4: Login

Open http://localhost:3001/login

**Default Credentials:**
- **Super Admin**: `admin@mindvalley.eg` / `admin123`
- **Management**: `management@mindvalley.eg` / `admin123`
- **Instructor**: `instructor@mindvalley.eg` / `admin123`

## 📋 What's Included

✅ Complete backend API with all modules
✅ Role-based authentication & authorization
✅ Database schema with Prisma
✅ Seed script with default users
✅ Frontend login page
✅ Role-based dashboards (Management, Ops, Accounting, Instructor)
✅ Error handling & validation
✅ Audit logging

## 🎯 Next Steps

1. **Explore the API**: Use Postman or curl to test endpoints
2. **Build CRUD Pages**: Create forms for Students, Classes, etc.
3. **Configure Notifications**: Set up AWS SES, SMS Misr, WhatsApp API
4. **Customize Dashboards**: Add charts and visualizations
5. **Deploy**: Follow deployment guide in SETUP.md

## 📚 API Documentation

All endpoints are under `/api` prefix:
- Auth: `/api/auth/login`
- Students: `/api/students`
- Classes: `/api/classes`
- Finance: `/api/finance`, `/api/payments`, `/api/expenses`
- Sales: `/api/leads`
- Dashboards: `/api/dashboard/{role}`

## 🔒 Security Notes

- Change JWT_SECRET in production
- Use strong passwords for database
- Enable HTTPS in production
- Review role permissions before deployment

## 🐛 Troubleshooting

**Database connection error:**
- Check DATABASE_URL in `.env`
- Ensure PostgreSQL is running
- Verify database exists

**Port already in use:**
- Change PORT in backend `.env`
- Update FRONTEND_URL if needed

**Prisma errors:**
- Run `npx prisma generate` after schema changes
- Check migration status with `npx prisma migrate status`











