# MindValley Operating System (MV-OS)

Role-based Education & Operations Management System for MindValley Egypt.

## Architecture

- **Backend**: NestJS (Node.js) - REST API
- **Frontend**: Next.js (React) + Tailwind CSS
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT-based with role-based access control

## Project Structure

```
├── backend/          # NestJS API
├── frontend/         # Next.js Dashboard
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
npm run install:all
```

### Database Setup

1. Create a PostgreSQL database
2. Update `backend/.env` with your database URL
3. Run migrations:

```bash
cd backend
npx prisma migrate dev
```

### Development

```bash
# Backend (port 3000)
npm run dev:backend

# Frontend (port 3001)
npm run dev:frontend
```

## User Roles

- `super_admin` - Full access
- `management` - Dashboards & reports
- `operations` - Classes, schedules, attendance
- `accounting` - Payments, expenses, financial reports
- `sales` - Leads, follow-ups, enrollments
- `instructor` - Own classes, attendance, student list

## Core Modules

1. Students
2. Classes & Sessions
3. Instructors
4. Finance
5. Sales (CRM)
6. Notifications

