#!/bin/bash

echo "🚀 MV-OS Quick Setup"
echo ""

# Option 1: Try to use existing PostgreSQL
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL client found"
    
    # Try to create database
    if createdb mv_os 2>/dev/null; then
        echo "✅ Database created"
        DB_USER=$(whoami)
        cat > backend/.env << EOF
# Database
DATABASE_URL="postgresql://${DB_USER}@localhost:5432/mv_os?schema=public"

# JWT
JWT_SECRET="mv-os-super-secret-jwt-key-change-in-production-min-32-chars"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:3001"
EOF
        echo "✅ Updated backend/.env"
        
        # Run migrations
        echo ""
        echo "Running migrations..."
        cd backend
        npx prisma migrate dev --name init
        
        echo ""
        echo "Seeding database..."
        npm run prisma:seed
        
        echo ""
        echo "✅ Database setup complete!"
        echo ""
        echo "Starting backend server..."
        npm run start:dev &
        BACKEND_PID=$!
        echo "Backend PID: $BACKEND_PID"
        echo ""
        echo "✅ Setup complete! Backend is starting..."
        echo "   Frontend: http://localhost:3001"
        echo "   Backend: http://localhost:3000"
        exit 0
    fi
fi

# Option 2: Cloud database setup
echo ""
echo "📦 Setting up with Cloud Database (Supabase)..."
echo ""
echo "To use a free cloud database:"
echo "1. Go to https://supabase.com and sign up (free)"
echo "2. Create a new project"
echo "3. Go to Settings > Database"
echo "4. Copy the connection string"
echo "5. Update backend/.env with:"
echo "   DATABASE_URL=\"your-supabase-connection-string\""
echo ""
echo "Then run:"
echo "   cd backend"
echo "   npx prisma migrate dev --name init"
echo "   npm run prisma:seed"
echo "   npm run start:dev"
echo ""

# Option 3: Docker
if command -v docker &> /dev/null; then
    echo "🐳 Docker found! Starting PostgreSQL in Docker..."
    docker run -d \
      --name mv-os-postgres \
      -e POSTGRES_PASSWORD=postgres \
      -e POSTGRES_DB=mv_os \
      -p 5432:5432 \
      postgres:14-alpine
    
    sleep 5
    
    cat > backend/.env << 'EOF'
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mv_os?schema=public"

# JWT
JWT_SECRET="mv-os-super-secret-jwt-key-change-in-production-min-32-chars"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:3001"
EOF
    
    echo "✅ PostgreSQL started in Docker"
    echo "✅ Updated backend/.env"
    
    # Run migrations
    echo ""
    echo "Running migrations..."
    cd backend
    npx prisma migrate dev --name init
    
    echo ""
    echo "Seeding database..."
    npm run prisma:seed
    
    echo ""
    echo "✅ Database setup complete!"
    echo ""
    echo "Starting backend server..."
    npm run start:dev &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
    echo ""
    echo "✅ Setup complete! Backend is starting..."
    echo "   Frontend: http://localhost:3001"
    echo "   Backend: http://localhost:3000"
    echo ""
    echo "To stop PostgreSQL: docker stop mv-os-postgres"
    echo "To start PostgreSQL: docker start mv-os-postgres"
    exit 0
fi

echo ""
echo "❌ Could not automatically set up database"
echo ""
echo "Please install PostgreSQL manually:"
echo "  macOS: brew install postgresql@14"
echo "  Or use: https://www.postgresql.org/download/"
echo ""
echo "Or use a cloud database:"
echo "  https://supabase.com (free tier)"
echo "  https://neon.tech (free tier)"
echo ""












