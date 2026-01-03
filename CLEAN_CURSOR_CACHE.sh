#!/bin/bash
# Clean Cursor IDE cache (12GB!)
# Close Cursor before running this script

set -e

echo "🧹 Cleaning Cursor IDE Cache (12GB)"
echo "===================================="
echo ""
echo "⚠️  IMPORTANT: Close Cursor IDE before running this script!"
echo ""
read -p "Have you closed Cursor? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please close Cursor first, then run this script again."
    exit 1
fi

echo ""
echo "📦 Cleaning Cursor caches..."

# Check current size
if [ -d "$HOME/Library/Application Support/Cursor" ]; then
    current_size=$(du -sh "$HOME/Library/Application Support/Cursor" 2>/dev/null | cut -f1)
    echo "   Current size: $current_size"
    echo ""
fi

# Safe to remove (caches)
echo "1️⃣  Removing cache directories..."
rm -rf "$HOME/Library/Application Support/Cursor/Cache" 2>/dev/null && echo "   ✅ Cache removed" || echo "   ℹ️  Cache not found"
rm -rf "$HOME/Library/Application Support/Cursor/CachedData" 2>/dev/null && echo "   ✅ CachedData removed" || echo "   ℹ️  CachedData not found"
rm -rf "$HOME/Library/Application Support/Cursor/Code Cache" 2>/dev/null && echo "   ✅ Code Cache removed" || echo "   ℹ️  Code Cache not found"
rm -rf "$HOME/Library/Application Support/Cursor/GPUCache" 2>/dev/null && echo "   ✅ GPUCache removed" || echo "   ℹ️  GPUCache not found"
rm -rf "$HOME/Library/Application Support/Cursor/ShaderCache" 2>/dev/null && echo "   ✅ ShaderCache removed" || echo "   ℹ️  ShaderCache not found"
rm -rf "$HOME/Library/Application Support/Cursor/blob_storage" 2>/dev/null && echo "   ✅ blob_storage removed" || echo "   ℹ️  blob_storage not found"
rm -rf "$HOME/Library/Application Support/Cursor/IndexedDB" 2>/dev/null && echo "   ✅ IndexedDB removed" || echo "   ℹ️  IndexedDB not found"
rm -rf "$HOME/Library/Application Support/Cursor/Local Storage" 2>/dev/null && echo "   ✅ Local Storage removed" || echo "   ℹ️  Local Storage not found"
rm -rf "$HOME/Library/Application Support/Cursor/Session Storage" 2>/dev/null && echo "   ✅ Session Storage removed" || echo "   ℹ️  Session Storage not found"
rm -rf "$HOME/Library/Application Support/Cursor/Service Worker" 2>/dev/null && echo "   ✅ Service Worker removed" || echo "   ℹ️  Service Worker not found"
echo ""

# Check new size
if [ -d "$HOME/Library/Application Support/Cursor" ]; then
    new_size=$(du -sh "$HOME/Library/Application Support/Cursor" 2>/dev/null | cut -f1)
    echo "   New size: $new_size"
    echo ""
fi

# Also clean Cursor caches in Library/Caches
echo "2️⃣  Cleaning Cursor system caches..."
rm -rf "$HOME/Library/Caches/com.todesktop.230313mzl4w4u92" 2>/dev/null && echo "   ✅ System cache removed" || echo "   ℹ️  System cache not found"
rm -rf "$HOME/Library/Caches/Cursor" 2>/dev/null && echo "   ✅ Cursor cache removed" || echo "   ℹ️  Cursor cache not found"
echo ""

echo "✅ Cursor cache cleanup complete!"
echo ""
echo "💡 Next steps:"
echo "   1. Restart your Mac to free purgeable space"
echo "   2. Or run: sudo purge (requires admin password)"
echo "   3. Check System Settings > General > Storage"



