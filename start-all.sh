#!/bin/bash

echo "🚀 Starting MV-OS System"
echo ""

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "❌ backend/.env not found"
    echo "Please set up your database first"
    exit 1
fi

# Check DATABASE_URL
DB_URL=$(grep "DATABASE_URL" backend/.env | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
if [[ -z "$DB_URL" ]] || [[ "$DB_URL" == *"user:password"* ]]; then
    echo "⚠️  DATABASE_URL not configured properly"
    echo "Please update backend/.env with your database connection string"
    exit 1
fi

# Check if database is accessible
echo "Testing database connection..."
cd backend
if ! npx prisma db pull --force 2>&1 | grep -q "Introspecting\|schema"; then
    echo "❌ Cannot connect to database"
    echo "Please check:"
    echo "  - Database is running"
    echo "  - DATABASE_URL is correct"
    echo "  - Security Group allows your IP (for AWS RDS)"
    cd ..
    exit 1
fi
cd ..

echo "✅ Database connection OK"
echo ""

# Check if migrations are up to date
echo "Checking migrations..."
cd backend
MIGRATION_STATUS=$(npx prisma migrate status 2>&1)
if echo "$MIGRATION_STATUS" | grep -q "following migration have not yet been applied"; then
    echo "Running migrations..."
    npx prisma migrate deploy || npx prisma migrate dev --name init
fi
cd ..

echo ""
echo "Starting servers..."
echo ""

# Start backend in background
echo "Starting backend server..."
cd backend
npm run start:dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Check if backend started successfully
if ps -p $BACKEND_PID > /dev/null; then
    echo "✅ Backend started (PID: $BACKEND_PID)"
    echo "   Logs: tail -f backend.log"
else
    echo "❌ Backend failed to start"
    echo "   Check: cat backend.log"
    exit 1
fi

# Start frontend
echo "Starting frontend server..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 3

if ps -p $FRONTEND_PID > /dev/null; then
    echo "✅ Frontend started (PID: $FRONTEND_PID)"
    echo "   Logs: tail -f frontend.log"
else
    echo "❌ Frontend failed to start"
    echo "   Check: cat frontend.log"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ MV-OS System Started!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Frontend: http://localhost:3001"
echo "🔧 Backend:  http://localhost:3000/api"
echo ""
echo "📝 Login Credentials:"
echo "   Email: admin@mindvalley.eg"
echo "   Password: admin123"
echo ""
echo "📊 View Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop servers:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   Or: pkill -f 'npm run start:dev' && pkill -f 'npm run dev'"
echo ""
echo "Press Ctrl+C to stop (servers will continue in background)"
echo ""

# Trap to cleanup on exit
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# Wait
wait











