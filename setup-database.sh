#!/bin/bash

echo "🗄️  MV-OS Database Setup"
echo ""

# Check for Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker found - Using Docker PostgreSQL"
    
    # Check if docker-compose is available
    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        echo "Starting PostgreSQL with Docker Compose..."
        
        # Start PostgreSQL
        if docker compose version &> /dev/null; then
            docker compose up -d postgres
        else
            docker-compose up -d postgres
        fi
        
        echo "Waiting for PostgreSQL to be ready..."
        sleep 5
        
        # Update .env file
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
        echo "✅ Updated backend/.env with Docker PostgreSQL credentials"
        
        # Run migrations
        echo ""
        echo "Running database migrations..."
        cd backend
        npx prisma migrate dev --name init
        
        echo ""
        echo "Seeding database..."
        npm run prisma:seed
        
        cd ..
        
        echo ""
        echo "✅ Database setup complete!"
        echo ""
        echo "To stop PostgreSQL: docker compose down"
        echo "To start PostgreSQL: docker compose up -d postgres"
        
    else
        echo "⚠️  docker-compose not found"
        exit 1
    fi

# Check for Homebrew (macOS)
elif command -v brew &> /dev/null; then
    echo "✅ Homebrew found"
    
    if ! command -v psql &> /dev/null; then
        echo "Installing PostgreSQL via Homebrew..."
        brew install postgresql@14
        brew services start postgresql@14
        sleep 3
    fi
    
    # Create database
    echo "Creating database..."
    createdb mv_os 2>/dev/null || psql -U $(whoami) -c "CREATE DATABASE mv_os;" 2>/dev/null || echo "⚠️  Could not create database automatically"
    
    # Update .env with default macOS user
    cat > backend/.env << EOF
# Database
DATABASE_URL="postgresql://$(whoami)@localhost:5432/mv_os?schema=public"

# JWT
JWT_SECRET="mv-os-super-secret-jwt-key-change-in-production-min-32-chars"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:3001"
EOF
    
    echo "✅ Updated backend/.env"
    echo ""
    echo "⚠️  If database creation failed, run manually:"
    echo "   createdb mv_os"
    echo "   Or: psql -U $(whoami) -c 'CREATE DATABASE mv_os;'"
    echo ""
    echo "Then run:"
    echo "   cd backend"
    echo "   npx prisma migrate dev --name init"
    echo "   npm run prisma:seed"

else
    echo "❌ Neither Docker nor Homebrew found"
    echo ""
    echo "Please install PostgreSQL manually:"
    echo "  - macOS: brew install postgresql@14"
    echo "  - Or use Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:14"
    echo ""
    echo "Then update backend/.env with your database credentials"
    exit 1
fi











