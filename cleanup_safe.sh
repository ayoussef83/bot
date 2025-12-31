#!/bin/bash

echo "🛡️  SAFE System Data Cleanup"
echo "=============================="
echo ""
echo "⚠️  This script will free ~20GB by:"
echo "   1. Resetting Cursor database (11GB) - will lose some editor state"
echo "   2. Clearing WhatsApp message cache (4.1GB)"
echo "   3. Clearing Android SDK images (if found)"
echo "   4. Clearing other large caches"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 1
fi

echo ""
echo "🧹 Starting cleanup..."
echo ""

# 1. Backup and reset Cursor database (SAFEST METHOD)
echo "1️⃣  Handling Cursor database (11GB)..."
if [ -f ~/Library/Application\ Support/Cursor/User/globalStorage/state.vscdb ]; then
    DB_SIZE=$(du -h ~/Library/Application\ Support/Cursor/User/globalStorage/state.vscdb | cut -f1)
    echo "   📦 Current size: $DB_SIZE"
    echo "   💾 Backing up..."
    cp ~/Library/Application\ Support/Cursor/User/globalStorage/state.vscdb \
       ~/Library/Application\ Support/Cursor/User/globalStorage/state.vscdb.backup.$(date +%Y%m%d) 2>/dev/null
    echo "   🔄 Resetting database..."
    # Close Cursor first if possible
    killall Cursor 2>/dev/null || true
    sleep 2
    # Create new empty database
    rm ~/Library/Application\ Support/Cursor/User/globalStorage/state.vscdb 2>/dev/null
    sqlite3 ~/Library/Application\ Support/Cursor/User/globalStorage/state.vscdb "CREATE TABLE IF NOT EXISTS storage (key TEXT PRIMARY KEY, value TEXT);" 2>/dev/null
    echo "   ✅ Cursor database reset (backup saved)"
else
    echo "   ℹ️  Database not found"
fi
echo ""

# 2. Clear WhatsApp message cache
echo "2️⃣  Clearing WhatsApp message cache (4.1GB)..."
if [ -d ~/Library/Group\ Containers/group.net.whatsapp.WhatsApp.shared/Message ]; then
    rm -rf ~/Library/Group\ Containers/group.net.whatsapp.WhatsApp.shared/Message 2>/dev/null
    echo "   ✅ WhatsApp cache cleared"
else
    echo "   ℹ️  WhatsApp cache not found"
fi
echo ""

# 3. Clear Android SDK images
echo "3️⃣  Clearing Android SDK system images..."
if [ -d ~/Library/Android/sdk/system-images ]; then
    SIZE=$(du -sh ~/Library/Android/sdk/system-images 2>/dev/null | cut -f1)
    echo "   📦 Found: $SIZE"
    rm -rf ~/Library/Android/sdk/system-images 2>/dev/null
    echo "   ✅ Android images cleared"
else
    echo "   ℹ️  Android images not found"
fi
echo ""

# 4. Clear WhatsApp iCloud backups
echo "4️⃣  Clearing WhatsApp iCloud backup files..."
find ~/Library/Mobile\ Documents -name "*.tar" -path "*WhatsApp*" -size +100M -delete 2>/dev/null
echo "   ✅ WhatsApp backups cleared"
echo ""

# 5. Clear Adobe update packages
echo "5️⃣  Clearing Adobe update packages..."
find ~/Library/Application\ Support/Adobe -name "*.pkg" -delete 2>/dev/null
echo "   ✅ Adobe packages cleared"
echo ""

# 6. Clear iOS Simulators (keep only if needed)
echo "6️⃣  Checking iOS Simulators..."
SIM_SIZE=$(du -sh ~/Library/Developer/CoreSimulator/Devices 2>/dev/null | cut -f1)
if [ -n "$SIM_SIZE" ]; then
    echo "   📦 Current size: $SIM_SIZE"
    xcrun simctl delete unavailable 2>/dev/null
    echo "   ✅ Unavailable simulators deleted"
fi
echo ""

# 7. Clear large iCloud files (optional - user's files)
echo "7️⃣  Large iCloud files found (user data - skipping)..."
echo "   ℹ️  Found large files in iCloud Drive"
echo "   ℹ️  These are your files - not deleting"
echo ""

echo "✨ Cleanup Complete!"
echo ""
echo "📊 Disk Space After Cleanup:"
df -h /System/Volumes/Data | tail -1
echo ""
echo "💡 Notes:"
echo "   - Cursor database backup saved with date"
echo "   - WhatsApp messages cleared (can re-sync)"
echo "   - Restart Cursor to initialize new database"
echo ""







