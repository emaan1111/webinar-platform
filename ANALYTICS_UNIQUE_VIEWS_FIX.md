# Analytics Unique Views Fix

## Problem
Analytics dashboard was always showing **0 unique views** even when registration pages had visitors. This affected conversion rate calculations and analytics reporting.

## Root Cause
The `RegistrationPageTracker` component had multiple critical bugs:

### 1. Missing `action` Parameter
```typescript
// ❌ BEFORE - No action parameter
await fetch('/api/tracking/page', {
  method: 'POST',
  body: JSON.stringify({
    webinarId,
    pageType: 'registration',
    pageId: pageId || null,
    variantGroup: variant || null,
    timestamp: new Date().toISOString(), // ← Wrong field
  }),
})
```

The API expects `action: 'enter'` to create a PageVisit record, but the tracker wasn't sending it. Without this, the API wouldn't create any database records.

### 2. Missing `visitorId` Tracking
The component wasn't properly managing visitor IDs, which are essential for counting unique visitors. Each visitor needs a persistent ID stored in localStorage to track them across sessions.

### 3. Incorrect Leave Tracking
The leave tracking was sending wrong field names (`event: 'leave'` instead of `action: 'leave'`) and not including the visitor ID.

## Solution

### Fixed RegistrationPageTracker Component

**Location:** `/src/components/tracking/RegistrationPageTracker.tsx`

#### Changes Made:

1. **Added Visitor ID Management**
```typescript
// Get or create visitor ID
let visitorId = localStorage.getItem('visitorId')
if (!visitorId) {
  visitorId = crypto.randomUUID()
  localStorage.setItem('visitorId', visitorId)
}
visitorIdRef.current = visitorId
```

2. **Added Device Detection**
```typescript
const device = window.innerWidth <= 768 ? 'mobile' : (window.innerWidth <= 1024 ? 'tablet' : 'desktop')
```

3. **Fixed Enter Tracking**
```typescript
await fetch('/api/tracking/page', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    webinarId,
    pageType: 'registration',
    pageId: pageId || null,
    variantGroup: variant || null,
    action: 'enter', // ← CRITICAL FIX
    visitorId, // ← CRITICAL FIX
    device, // ← Added
    browser: navigator.userAgent, // ← Added
    referrer: document.referrer || null, // ← Added
  }),
})
```

4. **Fixed Leave Tracking**
```typescript
const trackTimeOnPage = () => {
  const timeSpent = Math.floor((Date.now() - startTime.current) / 1000)
  
  if (timeSpent > 1 && visitorIdRef.current) {
    const data = JSON.stringify({
      webinarId,
      pageType: 'registration',
      pageId: pageId || null,
      variantGroup: variant || null,
      action: 'leave', // ← FIXED from 'event'
      visitorId: visitorIdRef.current, // ← Added
    })
    
    // Use sendBeacon with proper blob for reliability
    const blob = new Blob([data], { type: 'application/json' })
    navigator.sendBeacon('/api/tracking/page', blob)
  }
}
```

## How It Works Now

### 1. Visitor Arrives on Registration Page
- `RegistrationPageTracker` component mounts
- Checks localStorage for existing `visitorId`
- If not found, generates new UUID and stores it
- Sends `POST /api/tracking/page` with `action: 'enter'`
- API creates `PageVisit` record with unique `visitorId`

### 2. Analytics Calculation
```typescript
// In analytics API route
const uniqueVisitors = new Set(
  registrationVisits.map((v: any) => v.visitorId)
).size
```

The analytics now correctly counts unique `visitorId` values from PageVisit records.

### 3. Dashboard Display
```typescript
// Analytics dashboard
const uniqueViews = analyticsData?.funnel.registrationPageVisits || 0
const conversionRate = uniqueViews > 0 ? (totalRegs / uniqueViews) * 100 : 0
```

## Database Schema

**PageVisit Table:**
```prisma
model PageVisit {
  id             String   @id @default(cuid())
  webinarId      String
  visitorId      String   // ← UUID from localStorage
  pageType       String   // "registration"
  pageId         String?  // Specific registration page ID
  variantGroup   String?  // A/B test variant
  enteredAt      DateTime @default(now())
  leftAt         DateTime?
  timeSpent      Int?
  device         String?  // mobile, tablet, desktop
  browser        String?
  referrer       String?
  
  @@index([visitorId])
  @@index([webinarId, pageType])
}
```

## Testing

### To Verify the Fix:
1. Visit a registration page in an incognito window
2. Check browser localStorage - should see `visitorId`
3. Check database:
   ```sql
   SELECT * FROM page_visits WHERE pageType = 'registration' ORDER BY enteredAt DESC LIMIT 10;
   ```
4. Check analytics dashboard - should now show unique views

### Expected Results:
- ✅ PageVisit records created with unique visitorId
- ✅ Analytics shows accurate unique view count
- ✅ Conversion rate calculated correctly
- ✅ Each visitor counted only once, even with multiple page views

## Files Modified
- ✅ `/src/components/tracking/RegistrationPageTracker.tsx` - Fixed tracking logic

## Related Files (No Changes Needed)
- `/src/app/api/tracking/page/route.ts` - API was already correct
- `/src/app/api/webinars/[id]/analytics/route.ts` - Analytics calculation was correct
- `/src/app/api/analytics/aggregate/route.ts` - Aggregate calculation was correct
- `/src/app/dashboard/analytics/page.tsx` - Dashboard display was correct

## Impact
- **Before:** All analytics showed 0 unique views
- **After:** Accurate tracking of unique visitors
- **Benefit:** Proper conversion rate calculations and marketing insights

## Notes
- Uses browser's `crypto.randomUUID()` for visitor ID generation
- Visitor ID persists in localStorage across sessions
- Same visitor viewing page multiple times = 1 unique view
- Different visitors = multiple unique views
- Works with A/B testing variants
- Tracks both enter and leave events for time-on-page metrics
