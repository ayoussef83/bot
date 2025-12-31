#!/bin/bash

echo "=== Storage Cleanup Script ==="
echo ""
echo "This script will help clean up:"
echo "1. iOS Simulator data (~4.8GB in user Library)"
echo "2. Android system images (if duplicate/unused)"
echo "3. iOS Simulator system caches (~3.9GB - requires sudo)"
echo ""

# Check current disk usage
echo "Current disk usage:"
df -h / | tail -1
echo ""

# 1. Clean up iOS Simulator devices (user Library)
echo "=== Cleaning iOS Simulator Devices ==="
SIMULATOR_SIZE=$(du -sh "/Users/ahmedyoussef/Library/Developer/CoreSimulator/Devices" 2>/dev/null | cut -f1)
echo "Current size: $SIMULATOR_SIZE"
echo "Note: This will erase all simulator data. You can recreate simulators as needed."
read -p "Erase all iOS Simulator devices? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    xcrun simctl shutdown all
    xcrun simctl erase all
    echo "✓ Simulators erased"
else
    echo "Skipped"
fi
echo ""

# 2. Clean up Android system images
echo "=== Android System Images ==="
echo "Available images:"
du -sh "/Users/ahmedyoussef/Library/Android/sdk/system-images"/* 2>/dev/null
echo ""
echo "You have two Android system images:"
echo "  - android-36 (4.3GB) - Google APIs"
echo "  - android-36.1 (2.3GB) - Google APIs with Play Store"
echo ""
echo "If you only need one, you can remove the older android-36 version."
read -p "Remove android-36 (keep android-36.1)? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "/Users/ahmedyoussef/Library/Android/sdk/system-images/android-36"
    echo "✓ Removed android-36 (freed ~4.3GB)"
else
    echo "Skipped"
fi
echo ""

# 3. System-level iOS Simulator cache (requires sudo)
echo "=== iOS Simulator System Cache ==="
echo "System cache size: ~3.9GB (requires sudo)"
echo "Location: /Library/Developer/CoreSimulator/Caches/dyld"
echo ""
echo "To clean this, run manually with sudo:"
echo "  sudo rm -rf /Library/Developer/CoreSimulator/Caches/dyld/*"
echo ""

# Final disk usage
echo "=== Final Disk Usage ==="
df -h / | tail -1
echo ""
echo "Cleanup complete!"




