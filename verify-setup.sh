#!/bin/bash

echo "🔍 MV-OS Setup Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ $NODE_VERSION"
else
    echo "❌ Not found"
    exit 1
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ $NPM_VERSION"
else
    echo "❌ Not found"
    exit 1
fi

# Check dependencies
echo -n "Checking backend dependencies... "
if [ -d "backend/node_modules" ]; then
    echo "✅ Installed"
else
    echo "❌ Missing - run: cd backend && npm install"
fi

echo -n "Checking frontend dependencies... "
if [ -d "frontend/node_modules" ]; then
    echo "✅ Installed"
else
    echo "❌ Missing - run: cd frontend && npm install"
fi

# Check .env file
echo -n "Checking backend/.env... "
if [ -f "backend/.env" ]; then
    echo "✅ Exists"
    
    # Check DATABASE_URL
    if grep -q "DATABASE_URL" backend/.env; then
        DB_URL=$(grep "DATABASE_URL" backend/.env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
        if [[ "$DB_URL" == *"user:password"* ]] || [[ "$DB_URL" == *"localhost"* ]] && [[ "$DB_URL" != *"@"* ]]; then
            echo "   ⚠️  DATABASE_URL needs to be updated with actual credentials"
        else
            echo "   ✅ DATABASE_URL is configured"
        fi
    else
        echo "   ⚠️  DATABASE_URL not found in .env"
    fi
else
    echo "❌ Missing - create backend/.env"
fi

# Check Prisma
echo -n "Checking Prisma client... "
if [ -d "backend/node_modules/@prisma/client" ]; then
    echo "✅ Generated"
else
    echo "⚠️  Not generated - run: cd backend && npx prisma generate"
fi

# Check database connection
echo -n "Testing database connection... "
cd backend
if npx prisma db pull --force 2>&1 | grep -q "Introspecting" || npx prisma db pull --force 2>&1 | grep -q "schema"; then
    echo "✅ Connected"
    DB_CONNECTED=true
elif npx prisma db pull --force 2>&1 | grep -q "Can't reach"; then
    echo "❌ Cannot reach database"
    echo "   Check:"
    echo "   - Database is running"
    echo "   - DATABASE_URL in backend/.env is correct"
    echo "   - Security Group allows your IP (for AWS RDS)"
    DB_CONNECTED=false
elif npx prisma db pull --force 2>&1 | grep -q "authentication"; then
    echo "❌ Authentication failed"
    echo "   Check username and password in DATABASE_URL"
    DB_CONNECTED=false
else
    echo "⚠️  Connection status unknown"
    DB_CONNECTED=false
fi
cd ..

# Check migrations
if [ "$DB_CONNECTED" = true ]; then
    echo -n "Checking database migrations... "
    cd backend
    MIGRATION_STATUS=$(npx prisma migrate status 2>&1)
    if echo "$MIGRATION_STATUS" | grep -q "Database schema is up to date"; then
        echo "✅ Up to date"
    elif echo "$MIGRATION_STATUS" | grep -q "following migration have not yet been applied"; then
        echo "⚠️  Migrations pending"
        echo "   Run: cd backend && npx prisma migrate deploy"
    else
        echo "⚠️  Status unknown"
    fi
    cd ..
fi

# Check if servers are running
echo -n "Checking frontend server... "
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Running on http://localhost:3001"
else
    echo "❌ Not running"
    echo "   Start with: cd frontend && npm run dev"
fi

echo -n "Checking backend server... "
if curl -s http://localhost:3000/api > /dev/null 2>&1; then
    echo "✅ Running on http://localhost:3000"
else
    echo "❌ Not running"
    if [ "$DB_CONNECTED" = true ]; then
        echo "   Start with: cd backend && npm run start:dev"
    else
        echo "   Fix database connection first"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$DB_CONNECTED" = true ]; then
    echo "✅ Database: Connected"
    echo "✅ Ready to run migrations and start backend"
else
    echo "⚠️  Database: Not connected"
    echo ""
    echo "Next steps:"
    echo "1. Set up PostgreSQL (AWS RDS, Supabase, or local)"
    echo "2. Update backend/.env with DATABASE_URL"
    echo "3. Run: cd backend && npx prisma migrate deploy"
    echo "4. Run: cd backend && npm run prisma:seed"
    echo "5. Start backend: cd backend && npm run start:dev"
fi

echo ""
echo "📖 Documentation:"
echo "   • AWS_SETUP.md - AWS RDS setup"
echo "   • COMPLETE_SETUP.md - All setup options"
echo "   • NEXT_STEPS.md - Step-by-step guide"












