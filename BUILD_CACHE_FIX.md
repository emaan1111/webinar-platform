# Build Cache Fix

## Issue
Build was failing with multiple `PageNotFoundError` errors:
```
PageNotFoundError: Cannot find module for page: /api/ads/charts-debug
PageNotFoundError: Cannot find module for page: /api/ab-test/results/[webinarId]
PageNotFoundError: Cannot find module for page: /api/analytics
... and many more
```

## Root Cause
The `.next` build cache directory contained stale references to API routes. This commonly happens when:
- Files are moved or renamed
- Git branches are switched
- Dependencies are updated
- Previous builds were interrupted

## Solution
Clean the `.next` cache directory and rebuild:

```bash
# Remove the build cache
rm -rf .next

# Rebuild the application
npm run build
```

## Prevention
If you encounter build errors after:
- Switching git branches
- Pulling new code
- Moving/renaming files
- Updating dependencies

Always try cleaning the cache first:
```bash
rm -rf .next
npm run build
```

## Additional Cache Locations
If the problem persists, you may also need to clean:

```bash
# Node modules cache
rm -rf node_modules/.cache

# Next.js cache
rm -rf .next

# TypeScript build cache  
rm -rf .tsbuildinfo

# Full reinstall (nuclear option)
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Build Results
After cleaning the cache, the build completed successfully:
- ✅ 88 static pages generated
- ✅ 100+ API routes built
- ✅ All TypeScript types valid
- ✅ No compilation errors

## Related Commands
```bash
# Quick clean and rebuild
rm -rf .next && npm run build

# Development server (uses cache)
npm run dev

# Production build (generates optimized bundle)
npm run build

# Start production server
npm start
```

## Note
The `.next` directory is automatically ignored by Git (in `.gitignore`), so cleaning it never affects your source code or version control.
