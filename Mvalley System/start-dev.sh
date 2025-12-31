#!/bin/bash

echo "🚀 Starting MV-OS Local Development"
echo ""
echo "This will start both backend and frontend with hot-reload"
echo "Changes will appear instantly - no deployment needed!"
echo ""

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env not found"
    echo "Creating from example..."
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo "✅ Created backend/.env - Please update DATABASE_URL"
    else
        echo "❌ backend/.env.example not found"
        exit 1
    fi
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  frontend/.env.local not found"
    echo "Creating..."
    cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3000/api
EOF
    echo "✅ Created frontend/.env.local"
fi

echo ""
echo "📦 Installing dependencies (if needed)..."
npm install 2>/dev/null || echo "⚠️  npm install failed, continuing..."

echo ""
echo "🔧 Starting servers..."
echo ""
echo "Backend:  http://localhost:3000"
echo "Frontend: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start both servers
npm run dev

