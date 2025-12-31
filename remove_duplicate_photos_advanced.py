#!/usr/bin/env python3
"""
Advanced Duplicate Photo Remover
Finds and removes duplicate photos:
1. Exact duplicates (same filename + size) - keep first, delete rest
2. Same-name files with different sizes - keep largest, delete smaller
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

def find_all_duplicates(base_dir, years):
    """Find both exact duplicates and same-name files"""
    exact_duplicates = defaultdict(list)  # (filename, size) -> paths
    name_duplicates = defaultdict(list)      # filename -> [(path, size), ...]
    
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
                    
                    # Track exact duplicates
                    exact_key = (filename, size)
                    exact_duplicates[exact_key].append(str(filepath))
                    
                    # Track name duplicates
                    name_duplicates[filename].append((str(filepath), size))
                    count += 1
        
        print(f"     Found {count} files")
    
    # Filter to only actual duplicates
    exact = {k: v for k, v in exact_duplicates.items() if len(v) > 1}
    name_only = {k: v for k, v in name_duplicates.items() if len(v) > 1}
    
    # Separate name duplicates by whether they have different sizes
    name_diff_sizes = {}
    for filename, paths in name_only.items():
        sizes = [size for _, size in paths]
        if len(set(sizes)) > 1:  # Different sizes
            name_diff_sizes[filename] = paths
    
    return exact, name_diff_sizes

def main():
    base_dir = Path.home() / "Pictures"
    years = ["2014", "2015", "2016", "2017", "2018"]
    
    print("🖼️  Advanced Duplicate Photo Remover")
    print("=" * 60)
    print("\nThis script will find and remove:")
    print("  1. Exact duplicates (same filename + size)")
    print("  2. Same-name files with different sizes (keep largest)")
    print()
    
    # Find duplicates
    exact_duplicates, name_diff_sizes = find_all_duplicates(base_dir, years)
    
    if not exact_duplicates and not name_diff_sizes:
        print("\n✅ No duplicates found!")
        return 0
    
    # Calculate statistics for exact duplicates
    exact_count = 0
    exact_size = 0
    if exact_duplicates:
        exact_count = sum(len(v) - 1 for v in exact_duplicates.values())
        exact_size = sum((len(v) - 1) * Path(v[0]).stat().st_size 
                        for v in exact_duplicates.values())
    
    # Calculate statistics for name duplicates with different sizes
    name_count = 0
    name_size = 0
    files_to_delete = []
    
    if name_diff_sizes:
        for filename, paths in name_diff_sizes.items():
            # Sort by size (largest first)
            paths_sorted = sorted(paths, key=lambda x: x[1], reverse=True)
            # Keep largest, delete rest
            for path, size in paths_sorted[1:]:
                files_to_delete.append((path, size, filename))
                name_count += 1
                name_size += size
    
    total_count = exact_count + name_count
    total_size = exact_size + name_size
    
    print(f"\n📊 Summary:")
    if exact_duplicates:
        print(f"   Exact duplicates: {len(exact_duplicates)} files, {exact_count} duplicates to delete ({format_size(exact_size)})")
    if name_diff_sizes:
        print(f"   Same-name, different sizes: {len(name_diff_sizes)} files, {name_count} smaller copies to delete ({format_size(name_size)})")
    print(f"   Total to delete: {total_count} files")
    print(f"   Total size to free: {format_size(total_size)}")
    
    # Show samples
    print(f"\n📋 Sample duplicates:")
    if exact_duplicates:
        print(f"\n  Exact duplicates (first 3):")
        for i, (key, paths) in enumerate(list(exact_duplicates.items())[:3]):
            filename, size = key
            print(f"    📸 {filename} ({len(paths)} copies, {format_size(size)} each)")
            for j, path in enumerate(paths):
                marker = "✅ KEEP" if j == 0 else "🗑️  DELETE"
                print(f"       {marker}: {path}")
    
    if name_diff_sizes:
        print(f"\n  Same-name, different sizes (first 3):")
        for i, (filename, paths) in enumerate(list(name_diff_sizes.items())[:3]):
            paths_sorted = sorted(paths, key=lambda x: x[1], reverse=True)
            print(f"    📸 {filename} ({len(paths)} copies)")
            for j, (path, size) in enumerate(paths_sorted):
                marker = "✅ KEEP (largest)" if j == 0 else "🗑️  DELETE (smaller)"
                print(f"       {marker}: {path} ({format_size(size)})")
    
    # Ask for confirmation
    print(f"\n" + "=" * 60)
    response = input(f"\n🗑️  Delete {total_count} duplicate files? (y/N): ").strip().lower()
    
    if response != 'y':
        print("\n❌ Cancelled. No files deleted.")
        return 0
    
    # Delete files
    print(f"\n🗑️  Deleting duplicates...\n")
    deleted = 0
    deleted_size = 0
    
    # Delete exact duplicates (keep first)
    for key, paths in exact_duplicates.items():
        filename, _ = key
        for path in paths[1:]:  # Skip first (keep it)
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
    
    # Delete smaller same-name files
    for path, size, filename in files_to_delete:
        filepath = Path(path)
        if filepath.exists():
            try:
                filepath.unlink()
                deleted += 1
                deleted_size += size
                print(f"   ✅ Deleted: {filename} ({format_size(size)})")
            except Exception as e:
                print(f"   ❌ Error deleting {path}: {e}")
    
    print(f"\n✨ Cleanup Complete!")
    print(f"   Deleted: {deleted} files")
    print(f"   Freed: {format_size(deleted_size)}")
    print()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())






