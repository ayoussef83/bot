#!/bin/bash
# Clean old WhatsApp backups from Wondershare Dr.Fone
# This will free up ~40GB of space

set -e

echo "🧹 Cleaning Old WhatsApp Backups"
echo "================================="
echo ""

total_freed=0

# Check and remove old backups
if [ -d "$HOME/.config/Wondershare_DrFone_SocialApp_Temp" ]; then
    size=$(du -sh "$HOME/.config/Wondershare_DrFone_SocialApp_Temp" 2>/dev/null | cut -f1)
    echo "📦 Found: Wondershare_DrFone_SocialApp_Temp ($size)"
    echo "   Location: ~/.config/Wondershare_DrFone_SocialApp_Temp"
    echo "   Date: 2020 (4+ years old!)"
    echo ""
    read -p "Delete this backup? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$HOME/.config/Wondershare_DrFone_SocialApp_Temp"
        echo "   ✅ Deleted!"
        total_freed=$((total_freed + 21))
    else
        echo "   ⏭️  Skipped"
    fi
    echo ""
fi

if [ -d "$HOME/.config/Wondershare_DrFone_WhatsApp_Backup" ]; then
    size=$(du -sh "$HOME/.config/Wondershare_DrFone_WhatsApp_Backup" 2>/dev/null | cut -f1)
    echo "📦 Found: Wondershare_DrFone_WhatsApp_Backup ($size)"
    echo "   Location: ~/.config/Wondershare_DrFone_WhatsApp_Backup"
    echo "   Date: 2020 (4+ years old!)"
    echo ""
    read -p "Delete this backup? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$HOME/.config/Wondershare_DrFone_WhatsApp_Backup"
        echo "   ✅ Deleted!"
        total_freed=$((total_freed + 19))
    else
        echo "   ⏭️  Skipped"
    fi
    echo ""
fi

if [ $total_freed -eq 0 ]; then
    echo "ℹ️  No old backups found or all were skipped."
else
    echo "✅ Cleanup complete!"
    echo "📊 Space freed: ~${total_freed}GB"
    echo ""
    echo "💡 Next steps:"
    echo "   1. Restart your Mac to update storage calculations"
    echo "   2. Check System Settings > General > Storage"
fi


