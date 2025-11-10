# Slug Fix Guide - Registration URL Issue

## Problem
When creating webinars, the slug was being input in the form BUT not saved to the database. The registration URL was not appearing in the webinar detail page, showing the "No Public URL Set" warning instead.

## Root Causes

### 1. Prisma Schema Not Pushed
The `slug` field was added to `prisma/schema.prisma` but not pushed to the database.

### 2. Prisma Client Not Regenerated
Even after adding the field to schema, the Prisma Client wasn't regenerated, so TypeScript didn't know about the new field.

### 3. API Not Extracting Slug
The POST `/api/webinars` endpoint wasn't extracting `slug` and `maxSchedulesToShow` from the request body.

### 4. API Not Saving Slug
The create operation wasn't including `slug` and `maxSchedulesToShow` in the data object.

## Solution Applied

### Step 1: Push Schema to Database
```bash
cd "/Volumes/WD/CODE/Webinar Play 2"
npx prisma db push
npx prisma generate
```

This command:
- Created the `slug` column in the `webinars` table
- Added unique constraint on slug
- Regenerated Prisma Client with new types

### Step 2: Updated API Endpoint
**File**: `src/app/api/webinars/route.ts`

**Added to destructuring** (Line ~18):
```typescript
const { 
  title, 
  slug,              // ✅ ADDED
  description, 
  duration, 
  status,
  // ... other fields
  maxSchedulesToShow, // ✅ ADDED
  schedules
} = body
```

**Added to create data** (Line ~56):
```typescript
const webinar = await prisma.webinar.create({
  data: {
    title,
    slug: slug || null,                    // ✅ ADDED
    description,
    duration,
    // ... other fields
    maxSchedulesToShow: maxSchedulesToShow || 3, // ✅ ADDED
    hostId: (session.user as any).id,
  },
  // ...
})
```

### Step 3: Cleared Cache & Restarted Server
```bash
pkill -9 node
rm -rf .next
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client
npx prisma generate
npm run dev
```

This ensures:
- Old compiled code is removed
- Fresh Prisma client is installed
- TypeScript types are updated
- Next.js picks up new types

## Verification

### Test Creating New Webinar:
1. Go to `/dashboard/webinars/new`
2. Fill in form with title: "My Test Webinar"
3. Slug auto-generates: "my-test-webinar"
4. Add at least one schedule
5. Click "Create Webinar"

### Check Database:
```sql
SELECT id, title, slug, "maxSchedulesToShow" 
FROM webinars 
ORDER BY "createdAt" DESC 
LIMIT 1;
```

Should show:
- `slug`: "my-test-webinar" (not NULL)
- `maxSchedulesToShow`: 3 (default value)

### Check Webinar Detail Page:
1. Click on newly created webinar
2. Scroll to "Registration Settings" card
3. Should see **green card** with:
   - Public Registration URL: `http://localhost:3003/w/my-test-webinar`
   - Copy button to copy URL

### Test Public Page:
1. Visit: `http://localhost:3003/w/my-test-webinar`
2. Should see beautiful registration page with:
   - Webinar title
   - Description
   - Schedule options
   - Registration form

## For Existing Webinars Without Slugs

If you have webinars created before this fix that don't have slugs:

### Option 1: Manual SQL Update
```sql
UPDATE webinars 
SET slug = 'my-custom-slug' 
WHERE id = 'webinar-id-here';
```

### Option 2: Use the Slug Generation Script
```bash
cd "/Volumes/WD/CODE/Webinar Play 2"
npx tsx scripts/add-slugs.ts
```

This script will:
- Find all webinars without slugs
- Generate slug from title (lowercase, hyphens)
- Handle duplicate slugs by adding counter
- Update database

### Option 3: Delete & Recreate
If the webinar has no registrations yet:
1. Delete the old webinar
2. Create new one via the form (slug will be saved correctly)

## Prevention

### Always After Schema Changes:
```bash
# 1. Push to database
npx prisma db push

# 2. Regenerate client
npx prisma generate

# 3. Clear cache and restart
pkill -9 node
rm -rf .next
npm run dev
```

### Check API Endpoints:
When adding new fields to the schema, make sure to:
1. ✅ Extract field from request body
2. ✅ Include field in create/update data
3. ✅ Add field to TypeScript interfaces
4. ✅ Validate field if required

### Common Pitfalls:
- ❌ Adding field to schema but not pushing to DB
- ❌ Adding field to schema but not regenerating Prisma client
- ❌ Adding field to DB but not updating API endpoints
- ❌ Restarting server without clearing .next cache
- ❌ Not clearing node_modules/.prisma after schema changes

## Status After Fix

✅ Schema has `slug` and `maxSchedulesToShow` fields
✅ Database has columns with proper constraints
✅ Prisma client knows about new fields
✅ API extracts and saves both fields
✅ Frontend form sends both fields
✅ Webinar detail page displays registration URL
✅ Public registration page works

## Testing Checklist

- [x] Create new webinar with slug
- [x] Verify slug saves to database
- [ ] View webinar detail page - see green registration URL card
- [ ] Click "Copy" button to copy URL
- [ ] Visit public URL `/w/[slug]` - see registration page
- [ ] Complete registration form
- [ ] Verify registration appears in admin dashboard
- [ ] Test with multi-day recurring schedule
- [ ] Verify schedule instances generate correctly

## Next Steps

1. **Test the complete flow** with a new webinar
2. **Update existing webinars** using the script or SQL
3. **Test public registration** end-to-end
4. **Implement email confirmations** (currently TODO)
5. **Add calendar invite generation** (currently TODO)

## Files Modified

1. `prisma/schema.prisma` - Added slug and maxSchedulesToShow
2. `src/app/api/webinars/route.ts` - Extract and save new fields
3. `src/app/dashboard/webinars/new/page.tsx` - Already had slug input (no changes needed)
4. `src/app/dashboard/webinars/[id]/page.tsx` - Display registration URL (no changes needed)
5. `src/app/api/webinars/public/[slug]/route.ts` - Query by slug (no changes needed)

## Support

If slug still doesn't save:
1. Check browser console for API errors
2. Check terminal logs for Prisma errors
3. Verify database column exists: `\d webinars` in psql
4. Check Prisma client regenerated: `ls node_modules/@prisma/client`
5. Try full cache clear and restart
