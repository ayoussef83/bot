#!/bin/bash
# Storage Cleanup Script for MV-OS Development
# This script safely removes caches and build artifacts to free up disk space

set -e

echo "🧹 Starting Storage Cleanup..."
echo ""

# Track space freed
SPACE_FREED=0

# Function to calculate space before and after
cleanup_dir() {
    local dir=$1
    local name=$2
    
    if [ -d "$dir" ]; then
        local size=$(du -sh "$dir" 2>/dev/null | cut -f1)
        echo "  - Removing $name ($size)..."
        rm -rf "$dir"
        echo "    ✅ Removed"
    else
        echo "  - $name: Not found (already clean)"
    fi
}

# 1. Project Build Caches
echo "📦 Cleaning Project Build Caches..."
cleanup_dir "/Users/ahmedyoussef/Mvalley System/frontend/.next" "Next.js build cache"
cleanup_dir "/Users/ahmedyoussef/Mvalley System/frontend/.turbo" "Turborepo cache"
cleanup_dir "/Users/ahmedyoussef/Mvalley System/backend/dist" "Backend build output"
cleanup_dir "/Users/ahmedyoussef/Mvalley System/backend/.nest" "NestJS cache"
echo ""

# 2. Node.js Caches
echo "📚 Cleaning Node.js Caches..."
if [ -d "$HOME/.npm" ]; then
    npm_size=$(du -sh "$HOME/.npm" 2>/dev/null | cut -f1)
    echo "  - Clearing npm cache ($npm_size)..."
    npm cache clean --force 2>/dev/null || true
    echo "    ✅ Cleared"
fi

if [ -d "$HOME/Library/Caches/typescript" ]; then
    ts_size=$(du -sh "$HOME/Library/Caches/typescript" 2>/dev/null | cut -f1)
    echo "  - Clearing TypeScript cache ($ts_size)..."
    rm -rf "$HOME/Library/Caches/typescript"
    echo "    ✅ Cleared"
fi
echo ""

# 3. System Caches (Safe to remove)
echo "💻 Cleaning System Caches (Safe)..."
if [ -d "$HOME/Library/Caches" ]; then
    # Clean specific safe caches
    for cache_dir in "$HOME/Library/Caches/com.apple.dt.Xcode" \
                     "$HOME/Library/Caches/Homebrew" \
                     "$HOME/Library/Caches/pip" \
                     "$HOME/Library/Caches/com.microsoft.VSCode" \
                     "$HOME/Library/Caches/com.tinyspeck.slackmacgap"; do
        if [ -d "$cache_dir" ]; then
            cache_name=$(basename "$cache_dir")
            cache_size=$(du -sh "$cache_dir" 2>/dev/null | cut -f1)
            echo "  - Removing $cache_name cache ($cache_size)..."
            rm -rf "$cache_dir"
            echo "    ✅ Removed"
        fi
    done
fi
echo ""

# 4. Git Cleanup (optional - removes untracked files)
echo "🔍 Checking for large untracked files..."
if [ -d "/Users/ahmedyoussef/Mvalley System/.git" ]; then
    cd "/Users/ahmedyoussef/Mvalley System"
    echo "  - Running git clean (dry-run)..."
    untracked=$(git clean -nfd 2>/dev/null | wc -l)
    if [ "$untracked" -gt 0 ]; then
        echo "    Found $untracked untracked files/directories"
        read -p "    Remove untracked files? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git clean -fd
            echo "    ✅ Cleaned"
        fi
    else
        echo "    ✅ No untracked files"
    fi
fi
echo ""

# 5. Log Files
echo "📝 Cleaning Log Files..."
find "/Users/ahmedyoussef/Mvalley System" -name "*.log" -type f -size +1M -delete 2>/dev/null && echo "  ✅ Removed large log files" || echo "  ℹ️  No large log files found"
echo ""

# Summary
echo "✅ Cleanup Complete!"
echo ""
echo "💡 Additional Space-Saving Tips:"
echo "   1. Empty Trash: rm -rf ~/.Trash/*"
echo "   2. Clear Downloads folder if not needed"
echo "   3. Check iOS Simulator data: ~/Library/Developer/CoreSimulator"
echo "   4. Check Docker: docker system prune -a (if using Docker)"
echo "   5. Check Time Machine local snapshots: tmutil listlocalsnapshots /"
echo "   6. Check large files: find ~ -type f -size +1G 2>/dev/null"
echo ""
echo "📊 Check current disk usage: df -h"



