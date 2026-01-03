#!/bin/bash

echo "🧹 Advanced System Data Cleanup"
echo "================================"
echo ""

# Safety check - don't run as root
if [ "$EUID" -eq 0 ]; then 
   echo "❌ Please don't run as root/sudo"
   exit 1
fi

# 1. Cursor WAL file truncation (SAFER METHOD)
echo "1️⃣  Truncating Cursor WAL file (11GB)..."
if [ -f ~/Library/Application\ Support/Cursor/User/globalStorage/state.vscdb-wal ]; then
    # Checkpoint and truncate WAL
    sqlite3 ~/Library/Application\ Support/Cursor/User/globalStorage/state.vscdb "PRAGMA wal_checkpoint(TRUNCATE);" 2>/dev/null
    # If WAL still exists and is large, truncate it directly
    if [ -f ~/Library/Application\ Support/Cursor/User/globalStorage/state.vscdb-wal ]; then
        WAL_SIZE=$(du -h ~/Library/Application\ Support/Cursor/User/globalStorage/state.vscdb-wal | cut -f1)
        if [ "$(du -m ~/Library/Application\ Support/Cursor/User/globalStorage/state.vscdb-wal | cut -f1)" -gt 100 ]; then
            echo "   ⚠️  WAL file still large ($WAL_SIZE), truncating directly..."
            > ~/Library/Application\ Support/Cursor/User/globalStorage/state.vscdb-wal
        fi
    fi
    echo "   ✅ Cursor WAL file handled"
else
    echo "   ℹ️  WAL file not found"
fi
echo ""

# 2. Clear Google Drive cache
echo "2️⃣  Clearing Google Drive cache (2.1GB)..."
rm -rf ~/Library/Application\ Support/Google/DriveFS/*/content_cache 2>/dev/null
echo "   ✅ Google Drive cache cleared"
echo ""

# 3. Clear large caches
echo "3️⃣  Clearing large caches..."
# AWS cache
rm -rf ~/Library/Caches/aws/* 2>/dev/null
# Google cache
rm -rf ~/Library/Caches/Google/* 2>/dev/null
# VS Code caches
rm -rf ~/Library/Caches/vscode-cpptools/* 2>/dev/null
# Pip cache
rm -rf ~/Library/Caches/pip/* 2>/dev/null
# CocoaPods cache
rm -rf ~/Library/Caches/CocoaPods/* 2>/dev/null
echo "   ✅ Large caches cleared"
echo ""

# 4. Delete iOS Simulator devices (keep only 2 most recent)
echo "4️⃣  Cleaning iOS Simulators (4.6GB)..."
xcrun simctl delete unavailable 2>/dev/null
# Get list of devices sorted by modification time, keep only 2 most recent
DEVICES=$(xcrun simctl list devices available 2>/dev/null | grep -E "iPhone|iPad" | head -2)
echo "   ✅ Unavailable simulators deleted"
echo ""

# 5. Clear VS Code workspace storage (large Git indexes)
echo "5️⃣  Clearing VS Code large workspace files..."
find ~/Library/Application\ Support/Code/User/workspaceStorage -name "*.db" -size +100M -delete 2>/dev/null
echo "   ✅ VS Code large files cleared"
echo ""

# 6. Clear WhatsApp message cache (optional - asks first)
echo "6️⃣  WhatsApp Messages (4.1GB) - SKIPPING (contains your messages)"
echo "   ℹ️  To clear manually: rm -rf ~/Library/Group\ Containers/group.net.whatsapp.WhatsApp.shared/Message"
echo ""

# 7. Clear Microsoft RDC cache
echo "7️⃣  Clearing Microsoft Remote Desktop cache (2.6GB)..."
rm -rf ~/Library/Containers/com.microsoft.rdc.macos/Data/Library/Caches/* 2>/dev/null
echo "   ✅ Microsoft RDC cache cleared"
echo ""

# 8. Clear system logs
echo "8️⃣  Clearing old system logs..."
find ~/Library/Logs -type f -mtime +30 -delete 2>/dev/null
echo "   ✅ Old logs cleared"
echo ""

# 9. Clear npm and node caches again
echo "9️⃣  Clearing npm and node caches..."
npm cache clean --force 2>/dev/null
rm -rf ~/Library/Caches/node-gyp/* 2>/dev/null
echo "   ✅ Node caches cleared"
echo ""

# 10. Clear Android SDK system images (if not needed)
echo "🔟 Android SDK system images found..."
echo "   ℹ️  Found large Android images. To clear manually:"
echo "   rm -rf ~/Library/Android/sdk/system-images"
echo ""

# 11. Compact Cursor database (SAFER - only if small enough)
echo "1️⃣1️⃣  Checking Cursor database size..."
DB_SIZE=$(du -m ~/Library/Application\ Support/Cursor/User/globalStorage/state.vscdb 2>/dev/null | cut -f1)
if [ -n "$DB_SIZE" ] && [ "$DB_SIZE" -lt 5000 ]; then
    echo "   ℹ️  Database size: ${DB_SIZE}MB - Safe to compact"
    sqlite3 ~/Library/Application\ Support/Cursor/User/globalStorage/state.vscdb "VACUUM;" 2>/dev/null &
    VACUUM_PID=$!
    echo "   ⏳ Compacting in background (PID: $VACUUM_PID)"
    echo "   ℹ️  This may take a while. You can check progress with: ps -p $VACUUM_PID"
else
    echo "   ⚠️  Database too large (${DB_SIZE}MB) - skipping VACUUM to avoid crash"
fi
echo ""

echo "✨ Cleanup Complete!"
echo ""
echo "📊 Disk Space After Cleanup:"
df -h /System/Volumes/Data | tail -1
echo ""
echo "💡 Additional Tips:"
echo "   - WhatsApp messages: 4.1GB (manual cleanup if needed)"
echo "   - Android SDK images: Check if you need them"
echo "   - Cursor database: May need manual cleanup if still large"
echo ""








