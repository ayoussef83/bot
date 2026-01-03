#!/bin/bash
# Remove the accidentally created .git repository in home directory
# This will free up 181GB of space!

set -e

echo "🚨 CRITICAL: Removing .git from Home Directory"
echo "=============================================="
echo ""
echo "⚠️  WARNING: This will delete the Git repository in your home directory"
echo "   Size: 181GB"
echo "   Location: ~/.git"
echo ""
echo "This repository appears to have been accidentally created and is"
echo "tracking your entire home directory, which is wrong and wasteful."
echo ""

# Check if .git exists
if [ ! -d "$HOME/.git" ]; then
    echo "✅ No .git directory found in home. Nothing to clean."
    exit 0
fi

# Show current size
current_size=$(du -sh "$HOME/.git" 2>/dev/null | cut -f1)
echo "📊 Current size: $current_size"
echo ""

# Check if it's actually a git repo
if [ -f "$HOME/.git/config" ]; then
    echo "📋 Git repository detected. Checking contents..."
    echo ""
    
    # Show remote if exists
    if git -C "$HOME" remote -v 2>/dev/null | grep -q .; then
        echo "🔗 Remote repositories found:"
        git -C "$HOME" remote -v 2>/dev/null
        echo ""
        echo "⚠️  This repository has remotes! Make sure you don't need this!"
        echo ""
    fi
    
    # Show last commit
    if git -C "$HOME" log -1 --oneline 2>/dev/null | grep -q .; then
        echo "📝 Last commit:"
        git -C "$HOME" log -1 --oneline 2>/dev/null
        echo ""
    fi
fi

echo "⚠️  FINAL WARNING:"
echo "   This will PERMANENTLY delete the .git directory and all Git history"
echo "   in your home directory. This action cannot be undone!"
echo ""
read -p "Are you SURE you want to delete ~/.git? (type 'DELETE' to confirm): " -r
echo

if [[ ! $REPLY == "DELETE" ]]; then
    echo "❌ Cancelled. No changes made."
    exit 0
fi

echo ""
echo "🗑️  Removing ~/.git..."
rm -rf "$HOME/.git"
echo "✅ Deleted!"
echo ""

# Verify deletion
if [ ! -d "$HOME/.git" ]; then
    echo "✅ Verification: .git directory successfully removed"
    echo ""
    echo "📊 Space freed: ~181GB"
    echo ""
    echo "💡 Next steps:"
    echo "   1. Restart your Mac to update storage calculations"
    echo "   2. Check System Settings > General > Storage"
    echo "   3. Documents should now show ~60GB instead of 297GB"
else
    echo "❌ Error: .git directory still exists!"
    exit 1
fi


