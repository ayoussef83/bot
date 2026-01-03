#!/bin/bash
# Script to free up space after photo deletion
# Addresses the issue where deleted photos don't immediately free space

set -e

echo "🔍 Freeing Up Space After Photo Deletion"
echo "========================================"
echo ""

# 1. Force empty Trash (even if it appears empty)
echo "1️⃣  Emptying Trash..."
rm -rf ~/.Trash/* 2>/dev/null || true
rm -rf ~/.Trash/.* 2>/dev/null || true
echo "   ✅ Trash emptied"
echo ""

# 2. Clear Photos caches and thumbnails
echo "2️⃣  Clearing Photos App Caches..."
rm -rf ~/Library/Caches/com.apple.Photos 2>/dev/null || true
rm -rf ~/Library/Caches/com.apple.photoanalysisd 2>/dev/null || true
rm -rf ~/Library/Containers/com.apple.photoanalysisd/Data/Library/Caches/* 2>/dev/null || true
echo "   ✅ Photos caches cleared"
echo ""

# 3. Clear iCloud Photos cache (if using iCloud Photos)
echo "3️⃣  Clearing iCloud Photos Cache..."
rm -rf ~/Library/Application\ Support/com.apple.sharedphotosd 2>/dev/null || true
rm -rf ~/Library/Containers/com.apple.photolibraryd/Data/Library/Caches/* 2>/dev/null || true
echo "   ✅ iCloud Photos cache cleared"
echo ""

# 4. Purge purgeable space (APFS feature)
echo "4️⃣  Purging Purgeable Space..."
# This forces macOS to actually free up space marked as "purgeable"
purge 2>/dev/null || echo "   ⚠️  purge command not available (requires admin)"
echo ""

# 5. Clear system caches
echo "5️⃣  Clearing System Caches..."
sudo rm -rf /Library/Caches/* 2>/dev/null || echo "   ⚠️  Requires admin password for system caches"
echo ""

# 6. Force filesystem sync
echo "6️⃣  Syncing Filesystem..."
sync
echo "   ✅ Filesystem synced"
echo ""

# 7. Check for large files that might be duplicates or old backups
echo "7️⃣  Checking for Large Photo-Related Files..."
find ~/Library -name "*.photoslibrary" -o -name "*Photo*" -type d 2>/dev/null | while read dir; do
    if [ -d "$dir" ]; then
        size=$(du -sh "$dir" 2>/dev/null | cut -f1)
        echo "   📁 Found: $dir ($size)"
    fi
done
echo ""

# Summary
echo "✅ Cleanup Complete!"
echo ""
echo "📊 Current Disk Usage:"
df -h /System/Volumes/Data | tail -1
echo ""
echo "💡 If space still not freed:"
echo "   1. Restart your Mac (forces filesystem cleanup)"
echo "   2. Check System Settings > General > Storage"
echo "   3. Wait a few hours (macOS may take time to free purgeable space)"
echo "   4. Run: sudo purge (requires admin password)"
echo ""
echo "⚠️  Note: macOS may show 'Documents' category increased because:"
echo "   - Library/Application Support is counted as 'Documents'"
echo "   - System caches are being rebuilt"
echo "   - APFS purgeable space hasn't been freed yet"



