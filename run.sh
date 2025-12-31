#!/bin/bash

echo "🚀 Starting MV-OS System..."
echo ""

# Check if PostgreSQL is running
echo "📦 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL client not found. Make sure PostgreSQL is installed and running."
else
    echo "✅ PostgreSQL found"
fi

echo ""
echo "📥 Installing dependencies..."

# Install root dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing root dependencies..."
    npm install
fi

# Install backend dependencies
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Install frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

echo ""
echo "🗄️  Setting up database..."

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env not found. Please create it with your database credentials."
    echo "   See backend/.env.example for reference"
    exit 1
fi

# Check if DATABASE_URL is set
source backend/.env 2>/dev/null || true
if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "postgresql://user:password@localhost:5432/mv_os?schema=public" ]; then
    echo "⚠️  Please update DATABASE_URL in backend/.env with your actual database credentials"
    echo ""
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Run Prisma migrations
echo "Running database migrations..."
cd backend
npx prisma generate
npx prisma migrate deploy 2>/dev/null || npx prisma migrate dev --name init

# Seed database
echo "Seeding database..."
npm run prisma:seed 2>/dev/null || echo "⚠️  Seed script failed. You may need to run it manually: cd backend && npm run prisma:seed"
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Starting servers..."
echo ""
echo "Backend will run on: http://localhost:3000"
echo "Frontend will run on: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Start backend in background
cd backend
npm run start:dev &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for user interrupt
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# Wait for both processes
wait











