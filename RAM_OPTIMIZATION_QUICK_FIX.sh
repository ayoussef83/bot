#!/bin/bash
# Quick RAM optimization script for MV-OS development

echo "🧹 Cleaning development caches..."

# Clear Next.js cache
if [ -d "frontend/.next" ]; then
  echo "  - Clearing Next.js cache..."
  rm -rf frontend/.next
fi

# Clear TypeScript cache
if [ -d "$HOME/Library/Caches/typescript" ]; then
  echo "  - Clearing TypeScript cache..."
  rm -rf "$HOME/Library/Caches/typescript"
fi

# Clear npm cache (optional, uncomment if needed)
# echo "  - Clearing npm cache..."
# npm cache clean --force

echo "✅ Cache cleanup complete!"
echo ""
echo "💡 Next steps:"
echo "  1. Restart Cursor IDE"
echo "  2. Close unused browser tabs"
echo "  3. Stop dev servers when not coding"
echo "  4. Use 'npm run build && npm run start' instead of 'npm run dev'"
