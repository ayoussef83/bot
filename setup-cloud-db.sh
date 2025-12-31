#!/bin/bash

echo "🌐 Cloud Database Setup Helper"
echo ""
echo "This will help you set up a free cloud PostgreSQL database"
echo ""
echo "Choose your provider:"
echo "1. Supabase (Recommended - easiest)"
echo "2. Neon"
echo "3. Manual setup (I'll provide connection string)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
  1)
    echo ""
    echo "📋 Steps for Supabase:"
    echo "1. Go to: https://supabase.com"
    echo "2. Sign up (free)"
    echo "3. Create new project"
    echo "4. Go to Settings → Database"
    echo "5. Copy the 'Connection string' (URI format)"
    echo ""
    read -p "Paste your Supabase connection string: " db_url
    ;;
  2)
    echo ""
    echo "📋 Steps for Neon:"
    echo "1. Go to: https://neon.tech"
    echo "2. Sign up (free)"
    echo "3. Create new project"
    echo "4. Copy connection string from dashboard"
    echo ""
    read -p "Paste your Neon connection string: " db_url
    ;;
  3)
    echo ""
    read -p "Paste your PostgreSQL connection string: " db_url
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

if [ -n "$db_url" ]; then
  # Update .env file
  cat > backend/.env << EOF
# Database
DATABASE_URL="$db_url"

# JWT
JWT_SECRET="mv-os-super-secret-jwt-key-change-in-production-min-32-chars"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:3001"
EOF
  
  echo ""
  echo "✅ Updated backend/.env"
  echo ""
  echo "Running database setup..."
  cd backend
  npx prisma migrate dev --name init
  npm run prisma:seed
  
  echo ""
  echo "✅ Database setup complete!"
  echo ""
  echo "Starting backend server..."
  npm run start:dev
else
  echo "No connection string provided"
fi
