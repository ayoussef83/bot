#!/bin/bash
# Advanced Storage Cleanup Script
# Handles larger space hogs with user confirmation

set -e

echo "🔍 Advanced Storage Cleanup"
echo "=========================="
echo ""

# Function to safely clean directory with confirmation
cleanup_with_confirm() {
    local dir=$1
    local name=$2
    local safe=$3  # "safe" or "review"
    
    if [ -d "$dir" ] || [ -f "$dir" ]; then
        local size=$(du -sh "$dir" 2>/dev/null | cut -f1)
        echo "📁 Found: $name"
        echo "   Location: $dir"
        echo "   Size: $size"
        
        if [ "$safe" = "safe" ]; then
            echo "   ⚠️  This is safe to remove (caches/build artifacts)"
            read -p "   Remove? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                rm -rf "$dir"
                echo "   ✅ Removed $size"
                return 0
            fi
        else
            echo "   ⚠️  Please review contents before removing"
            read -p "   List contents? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                ls -lh "$dir" | head -20
                echo ""
                read -p "   Remove? (y/N): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    rm -rf "$dir"
                    echo "   ✅ Removed $size"
                    return 0
                fi
            fi
        fi
        echo "   ⏭️  Skipped"
    fi
    return 1
}

# 1. Downloads folder (LARGE - 12GB)
echo "1️⃣  Downloads Folder (12GB)"
cleanup_with_confirm "$HOME/Downloads" "Downloads folder" "review"
echo ""

# 2. Android SDK System Images
echo "2️⃣  Android SDK System Images"
if [ -d "$HOME/Library/Android/sdk/system-images" ]; then
    for img_dir in "$HOME/Library/Android/sdk/system-images"/*; do
        if [ -d "$img_dir" ]; then
            cleanup_with_confirm "$img_dir" "Android system image: $(basename "$img_dir")" "review"
        fi
    done
fi
echo ""

# 3. Android AVD Snapshots
echo "3️⃣  Android AVD Snapshots"
if [ -d "$HOME/.android/avd" ]; then
    for avd_dir in "$HOME/.android/avd"/*/snapshots; do
        if [ -d "$avd_dir" ]; then
            cleanup_with_confirm "$avd_dir" "AVD snapshots: $(basename $(dirname "$avd_dir"))" "safe"
        fi
    done
fi
echo ""

# 4. WhatsApp Backups (if not needed)
echo "4️⃣  WhatsApp Backups"
whatsapp_backup="$HOME/Library/Mobile Documents/57T9237FN3~net~whatsapp~WhatsApp/Accounts"
if [ -d "$whatsapp_backup" ]; then
    for backup_dir in "$whatsapp_backup"/*/backup/*.tar; do
        if [ -f "$backup_dir" ]; then
            cleanup_with_confirm "$backup_dir" "WhatsApp backup: $(basename "$backup_dir")" "review"
        fi
    done
fi
echo ""

# 5. ESP-IDF Git Objects (if not actively developing)
echo "5️⃣  ESP-IDF Git Objects (Large pack files)"
find "$HOME" -path "*/esp-idf/.git/modules/*/objects/pack/pack-*.pack" -size +500M 2>/dev/null | while read pack_file; do
    cleanup_with_confirm "$pack_file" "ESP-IDF git pack: $(basename "$pack_file")" "review"
done
echo ""

# 6. iOS Simulator Data
echo "6️⃣  iOS Simulator Data"
if [ -d "$HOME/Library/Developer/CoreSimulator" ]; then
    sim_size=$(du -sh "$HOME/Library/Developer/CoreSimulator" 2>/dev/null | cut -f1)
    echo "   Current size: $sim_size"
    echo "   💡 To clean: xcrun simctl delete unavailable"
    echo "   Or manually remove: ~/Library/Developer/CoreSimulator/Devices"
fi
echo ""

# 7. Cloud Documents (iCloud Drive)
echo "7️⃣  iCloud Drive Large Files"
cloud_docs="$HOME/Library/Mobile Documents/com~apple~CloudDocs"
if [ -d "$cloud_docs" ]; then
    find "$cloud_docs" -type f -size +500M 2>/dev/null | while read large_file; do
        file_size=$(du -sh "$large_file" 2>/dev/null | cut -f1)
        echo "   📄 Found: $(basename "$large_file") ($file_size)"
        echo "      Location: $large_file"
        read -p "      Remove from iCloud? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -f "$large_file"
            echo "      ✅ Removed"
        fi
    done
fi
echo ""

# Summary
echo "✅ Advanced Cleanup Complete!"
echo ""
echo "📊 Check freed space: df -h"
echo ""
echo "💡 Additional Manual Steps:"
echo "   1. Empty Trash: rm -rf ~/.Trash/*"
echo "   2. Review and clean Downloads folder manually"
echo "   3. Clean iOS Simulators: xcrun simctl delete unavailable"
echo "   4. Check for duplicate files"
echo "   5. Consider moving large files to external storage"


