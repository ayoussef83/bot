#!/usr/bin/env python3
"""
Duplicate Photo Remover
Finds and removes duplicate photos based on same filename and size
"""

import os
from collections import defaultdict
from pathlib import Path
import sys

def format_size(size_bytes):
    """Convert bytes to human readable format"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f}{unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f}TB"

def find_duplicates(base_dir, years):
    """Find duplicate files with same name and size"""
    file_map = defaultdict(list)
    
    print("📊 Scanning for duplicates...\n")
    
    for year in years:
        year_dir = base_dir / year
        if not year_dir.exists():
            continue
        
        print(f"  📁 Scanning {year}...")
        extensions = ["*.jpg", "*.jpeg", "*.png", "*.heic", "*.mov", "*.mp4", 
                     "*.JPG", "*.JPEG", "*.PNG", "*.HEIC", "*.MOV", "*.MP4"]
        
        count = 0
        for ext in extensions:
            for filepath in year_dir.rglob(ext):
                if filepath.is_file():
                    filename = filepath.name.lower()  # Case-insensitive
                    size = filepath.stat().st_size
                    key = (filename, size)  # Same name AND size
                    file_map[key].append(str(filepath))
                    count += 1
        
        print(f"     Found {count} files")
    
    # Find exact duplicates (same name + size, multiple copies)
    duplicates = {k: v for k, v in file_map.items() if len(v) > 1}
    
    return duplicates

def main():
    base_dir = Path.home() / "Pictures"
    years = ["2014", "2015", "2016", "2017", "2018"]
    
    print("🖼️  Duplicate Photo Remover")
    print("=" * 50)
    print("\nThis script will find and remove duplicate photos based on:")
    print("  - Same filename (case-insensitive)")
    print("  - Same file size")
    print()
    
    # Find duplicates
    duplicates = find_duplicates(base_dir, years)
    
    if not duplicates:
        print("\n✅ No exact duplicates found (same filename + size)!")
        return 0
    
    # Calculate statistics
    total_duplicate_files = sum(len(v) - 1 for v in duplicates.values())
    total_size = sum((len(v) - 1) * Path(v[0]).stat().st_size for v in duplicates.values())
    
    print(f"\n📊 Summary:")
    print(f"   Found: {len(duplicates)} files with duplicates")
    print(f"   Total duplicate files to delete: {total_duplicate_files}")
    print(f"   Total size to free: {format_size(total_size)}")
    
    # Show samples
    print(f"\n📋 Sample duplicates (first 10):")
    for i, (key, paths) in enumerate(list(duplicates.items())[:10]):
        filename, size = key
        print(f"\n  📸 {filename} ({len(paths)} copies, {format_size(size)} each)")
        for j, path in enumerate(paths):
            marker = "✅ KEEP" if j == 0 else "🗑️  DELETE"
            print(f"     {marker}: {path}")
    
    # Ask for confirmation
    print(f"\n" + "=" * 50)
    response = input(f"\n🗑️  Delete {total_duplicate_files} duplicate files? (y/N): ").strip().lower()
    
    if response != 'y':
        print("\n❌ Cancelled. No files deleted.")
        return 0
    
    # Delete duplicates (keep first, delete rest)
    print(f"\n🗑️  Deleting duplicates...\n")
    deleted = 0
    deleted_size = 0
    
    for key, paths in duplicates.items():
        filename, size = key
        # Keep first file, delete the rest
        for path in paths[1:]:
            filepath = Path(path)
            if filepath.exists():
                file_size = filepath.stat().st_size
                try:
                    filepath.unlink()
                    deleted += 1
                    deleted_size += file_size
                    print(f"   ✅ Deleted: {filename} ({format_size(file_size)})")
                except Exception as e:
                    print(f"   ❌ Error deleting {path}: {e}")
    
    print(f"\n✨ Cleanup Complete!")
    print(f"   Deleted: {deleted} files")
    print(f"   Freed: {format_size(deleted_size)}")
    print()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())







