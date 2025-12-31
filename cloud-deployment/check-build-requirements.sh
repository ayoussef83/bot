#!/bin/bash

echo "🔍 Checking Build Requirements for App Runner"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd backend

echo "📦 Checking required files..."
echo ""

# Check package.json
if [ ! -f "package.json" ]; then
    echo "❌ package.json missing"
    exit 1
fi
echo "✅ package.json exists"

# Check prisma schema
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ prisma/schema.prisma missing"
    exit 1
fi
echo "✅ prisma/schema.prisma exists"

# Check tsconfig.json
if [ ! -f "tsconfig.json" ]; then
    echo "❌ tsconfig.json missing"
    exit 1
fi
echo "✅ tsconfig.json exists"

# Check nest-cli.json
if [ ! -f "nest-cli.json" ]; then
    echo "❌ nest-cli.json missing"
    exit 1
fi
echo "✅ nest-cli.json exists"

# Check src directory
if [ ! -d "src" ]; then
    echo "❌ src directory missing"
    exit 1
fi
echo "✅ src directory exists"

echo ""
echo "📝 Checking if files are in Git..."
echo ""

cd ..

# Check if backend files are tracked
if git ls-files backend/package.json > /dev/null 2>&1; then
    echo "✅ backend/package.json is tracked in Git"
else
    echo "⚠️  backend/package.json NOT in Git - needs to be committed"
fi

if git ls-files backend/prisma/schema.prisma > /dev/null 2>&1; then
    echo "✅ backend/prisma/schema.prisma is tracked in Git"
else
    echo "⚠️  backend/prisma/schema.prisma NOT in Git - needs to be committed"
fi

if git ls-files backend/tsconfig.json > /dev/null 2>&1; then
    echo "✅ backend/tsconfig.json is tracked in Git"
else
    echo "⚠️  backend/tsconfig.json NOT in Git - needs to be committed"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 If files are missing from Git, commit and push them:"
echo ""
echo "   git add backend/"
echo "   git commit -m 'Add backend files'"
echo "   git push origin main"
echo ""











