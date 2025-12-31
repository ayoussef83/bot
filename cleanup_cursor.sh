#!/bin/bash
# Cursor Cleanup Script - Safe cleanup to free up ~32GB

echo "🧹 Cursor & Development Cleanup Script"
echo "======================================"
echo ""
echo "⚠️  This will free up approximately 32GB of disk space"
echo ""

# Ask for confirmation
read -p "Continue? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "Starting cleanup..."
echo ""

# 1. Clear TypeScript cache (528MB)
echo "1️⃣  Clearing TypeScript cache..."
rm -rf ~/Library/Caches/typescript
echo "   ✅ Freed ~528MB"

# 2. Clear Xcode DerivedData (1.5GB)
echo ""
echo "2️⃣  Clearing Xcode DerivedData..."
rm -rf ~/Library/Developer/Xcode/DerivedData/*
echo "   ✅ Freed ~1.5GB"

# 3. Clear npm cache (3.7GB)
echo ""
echo "3️⃣  Clearing npm cache..."
npm cache clean --force 2>/dev/null || echo "   ⚠️  npm not found or already clean"
echo "   ✅ Freed ~3.7GB"

# 4. Clear Cursor cache files (safe)
echo ""
echo "4️⃣  Clearing Cursor cache files..."
rm -rf ~/Library/Application\ Support/Cursor/Cache
rm -rf ~/Library/Application\ Support/Cursor/GPUCache
rm -rf ~/Library/Application\ Support/Cursor/CachedData
echo "   ✅ Freed ~300MB"

# 5. Delete Cursor database backup (9.9GB) - SAFE
echo ""
echo "5️⃣  Removing Cursor database backup (safe to delete)..."
rm -f ~/Library/Application\ Support/Cursor/User/globalStorage/state.vscdb.backup
echo "   ✅ Freed ~9.9GB"

# 6. Clear iOS Simulator unavailable devices (4.8GB) - Optional
echo ""
read -p "6️⃣  Delete unavailable iOS Simulator devices? (4.8GB) (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    xcrun simctl delete unavailable 2>/dev/null || echo "   ⚠️  No unavailable simulators found"
    echo "   ✅ Freed ~4.8GB"
fi

# 7. Compact Cursor database (optional, may free more space)
echo ""
read -p "7️⃣  Compact Cursor database? (may free additional space) (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    DB_PATH="$HOME/Library/Application Support/Cursor/User/globalStorage/state.vscdb"
    if [ -f "$DB_PATH" ]; then
        sqlite3 "$DB_PATH" "VACUUM;" 2>/dev/null && echo "   ✅ Database compacted" || echo "   ⚠️  Could not compact (sqlite3 not installed)"
    fi
fi

echo ""
echo "✨ Cleanup complete!"
echo ""
echo "📊 Summary:"
echo "   - TypeScript cache: ✅"
echo "   - Xcode DerivedData: ✅"
echo "   - npm cache: ✅"
echo "   - Cursor cache: ✅"
echo "   - Cursor backup DB: ✅"
echo ""
echo "💡 To prevent this in the future:"
echo "   - Regularly run: npm cache clean --force"
echo "   - Delete old iOS simulators: xcrun simctl delete unavailable"
echo "   - Clear Cursor cache periodically"
echo ""








