# MV-OS Setup Guide

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## Installation Steps

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE mv_os;
```

2. Create `.env` file in `backend/` directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/mv_os?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
```

3. Run Prisma migrations:
```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 3. Seed Database

Run the seed script to create initial users:

```bash
cd backend
npm run prisma:seed
```

This will create:
- Super Admin: `admin@mindvalley.eg` / `admin123`
- Management User: `management@mindvalley.eg` / `admin123`
- Instructor: `instructor@mindvalley.eg` / `admin123`

### 4. Start Development Servers

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

- Backend API: http://localhost:3000
- Frontend: http://localhost:3001

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login

### Students
- `GET /api/students` - List all students
- `POST /api/students` - Create student
- `GET /api/students/:id` - Get student details
- `PATCH /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Classes
- `GET /api/classes` - List all classes
- `POST /api/classes` - Create class
- `GET /api/classes/:id` - Get class details
- `PATCH /api/classes/:id` - Update class

### Sessions
- `GET /api/sessions` - List sessions
- `POST /api/sessions` - Create session
- `GET /api/sessions/:id` - Get session details

### Attendance
- `POST /api/attendance` - Create attendance
- `POST /api/attendance/bulk` - Bulk update attendance
- `GET /api/attendance/session/:sessionId` - Get attendance for session

### Finance
- `GET /api/finance/summary` - Financial summary
- `GET /api/payments` - List payments
- `POST /api/payments` - Create payment
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Create expense

### Sales
- `GET /api/leads` - List leads
- `POST /api/leads` - Create lead
- `POST /api/follow-ups` - Create follow-up

### Dashboards
- `GET /api/dashboard/management` - Management dashboard
- `GET /api/dashboard/ops` - Operations dashboard
- `GET /api/dashboard/accounting` - Accounting dashboard
- `GET /api/dashboard/instructor` - Instructor dashboard

## User Roles

- `super_admin` - Full access
- `management` - Dashboards & reports
- `operations` - Classes, schedules, attendance
- `accounting` - Payments, expenses, financial reports
- `sales` - Leads, follow-ups, enrollments
- `instructor` - Own classes, attendance, student list (no finance)

## Next Steps

1. **Configure Notification Services:**
   - Set up AWS SES for email
   - Configure SMS Misr API
   - Set up WhatsApp Business API

2. **Build Frontend UI:**
   - Create login page
   - Build role-based dashboards
   - Create CRUD interfaces for all modules

3. **Deploy:**
   - Backend: AWS ECS (Fargate) or EC2
   - Database: AWS RDS (PostgreSQL)
   - Frontend: Vercel or AWS Amplify

## Architecture Notes

- **Backend**: NestJS with Prisma ORM
- **Frontend**: Next.js with Tailwind CSS
- **Database**: PostgreSQL with soft deletes
- **Auth**: JWT-based with role guards
- **API**: RESTful, mobile-ready

All business logic is in the backend. Frontend is purely presentational and can be replaced with mobile apps without backend changes.

