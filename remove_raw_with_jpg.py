#!/usr/bin/env python3
"""
Remove RAW files that have JPG copies
This script finds RAW files (CR2, NEF, ARW, DNG, etc.) that have corresponding JPG files
and can safely delete the RAW files to free up space.
"""

import os
from pathlib import Path
from collections import defaultdict
import sys

def format_size(size_bytes):
    """Convert bytes to human readable format"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f}{unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f}TB"

def find_raw_with_jpg(base_dir, years):
    """Find RAW files that have JPG copies"""
    # Common RAW file extensions
    raw_extensions = [".cr2", ".nef", ".arw", ".dng", ".orf", ".raf", ".rw2", ".srw", ".x3f", ".cr3"]
    jpg_extensions = [".jpg", ".jpeg", ".JPG", ".JPEG"]
    
    # Dictionary: base_name -> {raw: path, jpg: path}
    files_map = defaultdict(lambda: {"raw": None, "jpg": None})
    
    print("📊 Scanning for RAW files and JPG copies...\n")
    
    for year in years:
        year_dir = base_dir / year
        if not year_dir.exists():
            continue
        
        print(f"  📁 Scanning {year}...")
        
        # Find all files
        for filepath in year_dir.rglob("*"):
            if not filepath.is_file():
                continue
            
            ext = filepath.suffix.lower()
            base_name = filepath.stem.lower()  # Name without extension
            
            if ext in raw_extensions:
                # If multiple RAW files with same base name, keep the first one found
                if files_map[base_name]["raw"] is None:
                    files_map[base_name]["raw"] = filepath
            elif ext in jpg_extensions:
                # If multiple JPG files with same base name, keep the first one found
                if files_map[base_name]["jpg"] is None:
                    files_map[base_name]["jpg"] = filepath
    
    # Find RAW files with JPG copies
    raw_with_jpg = []
    for base_name, files in files_map.items():
        if files["raw"] is not None and files["jpg"] is not None:
            raw_path = files["raw"]
            jpg_path = files["jpg"]
            raw_size = raw_path.stat().st_size
            jpg_size = jpg_path.stat().st_size
            raw_with_jpg.append((raw_path, jpg_path, raw_size, jpg_size, base_name))
    
    return raw_with_jpg

def main():
    base_dir = Path.home() / "Pictures"
    years = ["2014", "2015", "2016", "2017", "2018"]
    
    print("📷 RAW File Remover (with JPG copies)")
    print("=" * 60)
    print("\nThis script will find RAW files that have JPG copies")
    print("and can safely delete the RAW files to free up space.")
    print()
    
    # Find RAW files with JPG copies
    raw_with_jpg = find_raw_with_jpg(base_dir, years)
    
    if not raw_with_jpg:
        print("\n✅ No RAW files with JPG copies found!")
        return 0
    
    # Calculate statistics
    total_raw_size = sum(size for _, _, size, _, _ in raw_with_jpg)
    total_jpg_size = sum(size for _, _, _, size, _ in raw_with_jpg)
    space_saved = total_raw_size - total_jpg_size
    
    print(f"\n📊 Summary:")
    print(f"   RAW files with JPG copies: {len(raw_with_jpg)}")
    print(f"   Total RAW size: {format_size(total_raw_size)}")
    print(f"   Total JPG size: {format_size(total_jpg_size)}")
    print(f"   Space to free: {format_size(space_saved)}")
    
    # Show samples
    print(f"\n📋 Sample RAW files with JPG copies (first 10):")
    for i, (raw_path, jpg_path, raw_size, jpg_size, base_name) in enumerate(raw_with_jpg[:10]):
        print(f"\n  {i+1}. {base_name}")
        print(f"     📷 RAW: {raw_path.name} ({format_size(raw_size)})")
        print(f"     📸 JPG: {jpg_path.name} ({format_size(jpg_size)})")
        print(f"     💾 Would save: {format_size(raw_size - jpg_size)}")
        print(f"     📍 RAW path: {raw_path}")
        print(f"     📍 JPG path: {jpg_path}")
    
    # Ask for confirmation
    print(f"\n" + "=" * 60)
    print(f"\n⚠️  WARNING: This will permanently delete {len(raw_with_jpg)} RAW files!")
    print(f"   You will keep the JPG copies, but lose the ability to edit RAW files.")
    print()
    response = input(f"🗑️  Delete {len(raw_with_jpg)} RAW files? (y/N): ").strip().lower()
    
    if response != 'y':
        print("\n❌ Cancelled. No files deleted.")
        return 0
    
    # Delete RAW files
    print(f"\n🗑️  Deleting RAW files...\n")
    deleted = 0
    deleted_size = 0
    errors = []
    
    for raw_path, jpg_path, raw_size, jpg_size, base_name in raw_with_jpg:
        if raw_path.exists():
            # Double-check that JPG still exists
            if not jpg_path.exists():
                errors.append(f"JPG missing for {base_name}, skipping RAW deletion")
                continue
            
            try:
                raw_path.unlink()
                deleted += 1
                deleted_size += raw_size
                print(f"   ✅ Deleted: {raw_path.name} ({format_size(raw_size)})")
            except Exception as e:
                errors.append(f"Error deleting {raw_path}: {e}")
                print(f"   ❌ Error deleting {raw_path.name}: {e}")
    
    print(f"\n✨ Cleanup Complete!")
    print(f"   Deleted: {deleted} RAW files")
    print(f"   Freed: {format_size(deleted_size)}")
    
    if errors:
        print(f"\n⚠️  Errors encountered: {len(errors)}")
        for error in errors[:5]:
            print(f"   - {error}")
    
    print()
    return 0

if __name__ == "__main__":
    sys.exit(main())






