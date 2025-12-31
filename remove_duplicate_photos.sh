#!/bin/bash

echo "🖼️  Duplicate Photo Remover"
echo "============================"
echo ""
echo "This script will find and remove duplicate photos based on:"
echo "  - Same filename"
echo "  - Same file size"
echo ""

# Base directory
BASE_DIR="$HOME/Pictures"

# Check if base directory exists
if [ ! -d "$BASE_DIR" ]; then
    echo "❌ Pictures directory not found: $BASE_DIR"
    exit 1
fi

# Years to check
YEARS=(2014 2015 2016 2017 2018)

echo "📊 Scanning for duplicates..."
echo ""

# Create temporary files
TEMP_FILE=$(mktemp)
DUPLICATES_FILE=$(mktemp)

# Collect all files from year folders
echo "Collecting files from year folders..."
for year in "${YEARS[@]}"; do
    YEAR_DIR="$BASE_DIR/$year"
    if [ -d "$YEAR_DIR" ]; then
        echo "  📁 Scanning $year..."
        find "$YEAR_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.heic" -o -iname "*.mov" -o -iname "*.mp4" \) | while read -r file; do
            filename=$(basename "$file")
            size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
            echo "$filename|$size|$file" >> "$TEMP_FILE"
        done
    fi
done

echo ""
echo "🔍 Finding duplicates..."
echo ""

# Sort by filename and size, then find duplicates
sort "$TEMP_FILE" > "${TEMP_FILE}.sorted"

# Find duplicates
PREV_KEY=""
PREV_FILE=""
DUPLICATE_COUNT=0
TOTAL_SIZE=0

while IFS='|' read -r filename size filepath; do
    key="${filename}|${size}"
    
    if [ "$key" = "$PREV_KEY" ]; then
        # This is a duplicate
        echo "$filepath" >> "$DUPLICATES_FILE"
        DUPLICATE_COUNT=$((DUPLICATE_COUNT + 1))
        TOTAL_SIZE=$((TOTAL_SIZE + size))
    else
        # New file, update previous
        PREV_KEY="$key"
        PREV_FILE="$filepath"
    fi
done < "${TEMP_FILE}.sorted"

# Convert bytes to human readable
if command -v numfmt >/dev/null 2>&1; then
    SIZE_HR=$(numfmt --to=iec-i --suffix=B $TOTAL_SIZE 2>/dev/null)
else
    if [ $TOTAL_SIZE -gt 1073741824 ]; then
        SIZE_HR=$(echo "scale=2; $TOTAL_SIZE/1073741824" | bc)"GB"
    elif [ $TOTAL_SIZE -gt 1048576 ]; then
        SIZE_HR=$(echo "scale=2; $TOTAL_SIZE/1048576" | bc)"MB"
    else
        SIZE_HR=$(echo "scale=2; $TOTAL_SIZE/1024" | bc)"KB"
    fi
fi

echo "📊 Summary:"
echo "   Found: $DUPLICATE_COUNT duplicate files"
echo "   Total size: $SIZE_HR"
echo ""

if [ $DUPLICATE_COUNT -eq 0 ]; then
    echo "✅ No duplicates found!"
    rm -f "$TEMP_FILE" "${TEMP_FILE}.sorted" "$DUPLICATES_FILE"
    exit 0
fi

# Show some examples
echo "📋 Sample duplicates (first 10):"
head -10 "$DUPLICATES_FILE" | while read -r filepath; do
    filename=$(basename "$filepath")
    size=$(stat -f%z "$filepath" 2>/dev/null || stat -c%s "$filepath" 2>/dev/null)
    if command -v numfmt >/dev/null 2>&1; then
        size_hr=$(numfmt --to=iec-i --suffix=B $size 2>/dev/null)
    else
        size_hr="${size} bytes"
    fi
    echo "  🗑️  $filename ($size_hr)"
    echo "     $filepath"
done

echo ""
echo ""
read -p "🗑️  Delete $DUPLICATE_COUNT duplicate files? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled. No files deleted."
    rm -f "$TEMP_FILE" "${TEMP_FILE}.sorted" "$DUPLICATES_FILE"
    exit 0
fi

echo ""
echo "🗑️  Deleting duplicates..."
DELETED=0
DELETED_SIZE=0

while read -r filepath; do
    if [ -f "$filepath" ]; then
        file_size=$(stat -f%z "$filepath" 2>/dev/null || stat -c%s "$filepath" 2>/dev/null)
        rm -f "$filepath"
        if [ ! -f "$filepath" ]; then
            DELETED=$((DELETED + 1))
            DELETED_SIZE=$((DELETED_SIZE + file_size))
            echo "   ✅ Deleted: $(basename "$filepath")"
        fi
    fi
done < "$DUPLICATES_FILE"

# Convert deleted size to human readable
if command -v numfmt >/dev/null 2>&1; then
    DELETED_SIZE_HR=$(numfmt --to=iec-i --suffix=B $DELETED_SIZE 2>/dev/null)
else
    if [ $DELETED_SIZE -gt 1073741824 ]; then
        DELETED_SIZE_HR=$(echo "scale=2; $DELETED_SIZE/1073741824" | bc)"GB"
    elif [ $DELETED_SIZE -gt 1048576 ]; then
        DELETED_SIZE_HR=$(echo "scale=2; $DELETED_SIZE/1048576" | bc)"MB"
    else
        DELETED_SIZE_HR=$(echo "scale=2; $DELETED_SIZE/1024" | bc)"KB"
    fi
fi

echo ""
echo "✨ Cleanup Complete!"
echo "   Deleted: $DELETED files"
echo "   Freed: $DELETED_SIZE_HR"
echo ""

# Cleanup temp files
rm -f "$TEMP_FILE" "${TEMP_FILE}.sorted" "$DUPLICATES_FILE"
