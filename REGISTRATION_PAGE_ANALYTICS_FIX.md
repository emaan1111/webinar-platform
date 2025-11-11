# Registration Page Analytics - Implementation & Fix

## 🐛 Problem

The Registration Pages Performance table was not showing up on the analytics dashboard because:

1. **Missing Page Visit Tracking**: The registration pages (`/w/[slug]`) were NOT tracking page visits
2. **Data Not Aggregated**: The analytics dashboard wasn't properly aggregating registration page data from multiple webinars
3. **No Client-Side Tracking**: There was no client component to track when users view registration pages

## ✅ Solution Implemented

### 1. Created Registration Page Tracker Component

**File**: `/src/components/tracking/RegistrationPageTracker.tsx`

This is a client-side component that:
- Tracks when a user lands on a registration page
- Records the page visit to the database via `/api/tracking/page`
- Tracks time spent on page (for analytics)
- Automatically records variant (A/B test group) and template information
- Uses `useEffect` to track once per page load
- Uses `beforeunload` and `visibilitychange` events to track exit time

**Key Features:**
```typescript
- webinarId: Which webinar's registration page
- pageId: Template ID (for custom templates)
- variant: A/B test variant (A or B)
- templateName: Name of the template being used
- timeOnPage: Seconds spent on the page
```

### 2. Integrated Tracker into Registration Pages

**File**: `/src/app/w/[slug]/page-client.tsx`

Added the tracker in TWO places:

#### A. Custom Template Registration Pages
```tsx
<div className="custom-template-container">
  <RegistrationPageTracker
    webinarId={webinar.id}
    pageId={registrationTemplate.id}
    variant={webinar.testGroup || null}
    templateName={registrationTemplate.name}
  />
  ...
</div>
```

#### B. Default Template Registration Pages
```tsx
return (
  <>
    <RegistrationPageTracker
      webinarId={webinar.id}
      pageId={null}
      variant={webinar.testGroup || null}
      templateName="Default Template"
    />
    ...
  </>
)
```

### 3. Fixed Analytics Dashboard Data Aggregation

**File**: `/src/app/dashboard/analytics/page.tsx`

**Problem**: When fetching analytics from multiple webinars, the `registrationPages` array wasn't being aggregated.

**Fix**: Added proper aggregation logic:

```typescript
// Initialize registrationPages array in aggregated data
aggregated.funnel.registrationPages = []

// Create a Map to aggregate page data
const registrationPagesMap = new Map<string, {
  pageId: string | null
  pageName: string
  variantGroup: string | null
  views: number
  uniqueViews: number
  totalTimeOnPage: number
  count: number
}>()

// Aggregate data from each webinar
results.forEach(result => {
  if (data.funnel.registrationPages && data.funnel.registrationPages.length > 0) {
    data.funnel.registrationPages.forEach((page: any) => {
      const key = `${page.pageId || 'default'}-${page.variantGroup || 'none'}`
      const existing = registrationPagesMap.get(key)
      
      if (existing) {
        existing.views += page.views
        existing.uniqueViews += page.uniqueViews
        existing.totalTimeOnPage += page.avgTimeOnPage * page.views
        existing.count += page.views
      } else {
        registrationPagesMap.set(key, {
          pageId: page.pageId,
          pageName: page.pageName,
          variantGroup: page.variantGroup,
          views: page.views,
          uniqueViews: page.uniqueViews,
          totalTimeOnPage: page.avgTimeOnPage * page.views,
          count: page.views
        })
      }
    })
  }
})

// Convert to array with calculated averages
aggregated.funnel.registrationPages = Array.from(registrationPagesMap.values()).map(page => ({
  pageId: page.pageId,
  pageName: page.pageName,
  variantGroup: page.variantGroup,
  views: page.views,
  uniqueViews: page.uniqueViews,
  avgTimeOnPage: Math.round(page.count > 0 ? page.totalTimeOnPage / page.count : 0)
}))
```

**What This Does:**
- Groups registration pages by `pageId` and `variant`
- Sums up views and unique views across webinars
- Calculates weighted average for time on page
- Handles both custom templates and default templates
- Supports A/B testing variants properly

## 📊 How Data Flows

### Registration Page Visit Flow

```
User Visits /w/[slug]
    ↓
RegistrationPageTracker Component Mounts
    ↓
POST /api/tracking/page
    ↓
PageVisit Record Created in Database:
  - webinarId
  - pageType: 'registration'
  - pageId: template ID (or null for default)
  - variantGroup: 'A' or 'B' (or null)
  - timestamp
    ↓
User Leaves Page
    ↓
sendBeacon /api/tracking/page with timeOnPage
    ↓
Database Updated with Time on Page
```

### Analytics Display Flow

```
Dashboard Loads /dashboard/analytics
    ↓
Fetch /api/webinars/:id/analytics for each webinar
    ↓
API Queries PageVisit Records:
  - Filters by pageType = 'registration'
  - Groups by pageId and variantGroup
  - Calculates views, uniqueViews, avgTimeOnPage
  - Joins with Template names
    ↓
Frontend Aggregates Data from All Webinars
    ↓
Display Registration Pages Performance Table
```

## 🎯 What You'll Now See

### On Analytics Dashboard (`/dashboard/analytics`)

**Registration Pages Performance Table:**

| Registration Page     | Variant    | Total Views | Unique Views | Avg Time (sec) |
|-----------------------|------------|-------------|--------------|----------------|
| Urgency Template      | Variant A  | 124         | 98           | 45             |
| Default Template      | Variant B  | 89          | 71           | 38             |
| Islamic Template      |            | 56          | 44           | 52             |
| Professional Template | Variant A  | 145         | 112          | 61             |

**Key Metrics:**
- **Total Views**: Total number of page loads (includes repeat visits)
- **Unique Views**: Number of unique visitors (tracked by browser fingerprint/session)
- **Avg Time**: Average seconds users spent on the registration page
- **Variant**: Shows A or B if A/B testing is enabled for that webinar

## 🧪 Testing the Implementation

### 1. Test Registration Page Tracking

1. **Go to a webinar registration page:**
   ```
   http://localhost:3005/w/your-webinar-slug
   ```

2. **Open Browser DevTools → Network Tab**
   - Look for POST request to `/api/tracking/page`
   - Verify payload includes:
     ```json
     {
       "webinarId": "...",
       "pageType": "registration",
       "pageId": "..." or null,
       "variantGroup": "A" or "B" or null,
       "timestamp": "..."
     }
     ```

3. **Stay on page for a few seconds, then navigate away**
   - Should see a `sendBeacon` call with `timeOnPage` data

### 2. Verify Database Records

Open Prisma Studio or query the database:

```bash
npx prisma studio
```

Check the `PageVisit` table:
- Should see records with `pageType = 'registration'`
- `pageId` should match template IDs
- `variantGroup` should show A/B test assignments
- `timeOnPage` should be populated after user leaves

### 3. Check Analytics Dashboard

1. **Navigate to:**
   ```
   http://localhost:3005/dashboard/analytics
   ```

2. **Scroll down to "Registration Pages Performance"**
   - Table should now be visible (if you have visits)
   - Shows breakdown by template and variant
   - Displays metrics correctly

### 4. Test A/B Testing Tracking

1. **Create a webinar with A/B testing enabled**
2. **Visit registration page multiple times** (different browsers/incognito)
3. **Check analytics** - Should see separate rows for Variant A and Variant B

## 📝 Database Schema Reference

### PageVisit Model

```prisma
model PageVisit {
  id           String    @id @default(cuid())
  webinarId    String
  webinar      Webinar   @relation(fields: [webinarId], references: [id], onDelete: Cascade)
  
  pageType     String    // "registration" | "countdown" | "webinar" | "thank_you" | "replay"
  pageId       String?   // Template ID for custom templates, null for default
  variantGroup String?   // "A" | "B" for A/B testing, null otherwise
  
  visitorId    String?   // For tracking unique visitors
  timeOnPage   Int?      // Seconds spent on page
  timestamp    DateTime  @default(now())
  
  @@index([webinarId, pageType])
  @@index([pageId])
}
```

## 🎨 Customization Options

### Track Additional Metrics

You can extend the tracker to capture more data:

```typescript
// In RegistrationPageTracker.tsx
await fetch('/api/tracking/page', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    webinarId,
    pageType: 'registration',
    pageId,
    variantGroup: variant,
    timestamp: new Date().toISOString(),
    
    // Additional tracking fields:
    referrer: document.referrer,
    userAgent: navigator.userAgent,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language,
  }),
})
```

### Custom Template Names

You can pass more descriptive names:

```typescript
<RegistrationPageTracker
  webinarId={webinar.id}
  pageId={registrationTemplate.id}
  variant={webinar.testGroup || null}
  templateName={`${registrationTemplate.name} - ${webinar.title}`}
/>
```

## 🚨 Troubleshooting

### Table Still Not Showing?

**1. Check if you have any page visits:**
```sql
SELECT * FROM PageVisit WHERE pageType = 'registration';
```

**2. Verify API is returning data:**
```bash
curl http://localhost:3005/api/webinars/YOUR_WEBINAR_ID/analytics
```

Look for `funnel.registrationPages` array in response.

**3. Check browser console for errors:**
- Open DevTools → Console
- Look for network errors or tracking failures

**4. Ensure webinar has templates:**
```sql
SELECT * FROM Template;
```

If no templates exist, create one in `/dashboard/templates`.

### Time on Page Not Recording?

**Issue**: `beforeunload` doesn't always fire reliably.

**Solution**: The tracker uses both `beforeunload` AND `visibilitychange` events as a backup.

**Alternative**: Add interval-based tracking:
```typescript
// In RegistrationPageTracker.tsx
useEffect(() => {
  const interval = setInterval(() => {
    const timeSpent = Math.floor((Date.now() - startTime.current) / 1000)
    // Send periodic updates
    fetch('/api/tracking/page', { ... })
  }, 30000) // Every 30 seconds
  
  return () => clearInterval(interval)
}, [])
```

### Unique Views Not Accurate?

The system tracks unique views using browser sessions. For more accurate tracking:

1. **Use Fingerprinting** (requires additional library like FingerprintJS)
2. **Use Cookies** (requires cookie consent for GDPR)
3. **Use IP + User Agent** (less accurate, but privacy-friendly)

## 📚 Related Files

### Core Implementation
- `/src/components/tracking/RegistrationPageTracker.tsx` - Tracker component
- `/src/app/w/[slug]/page-client.tsx` - Registration page with tracker
- `/src/app/dashboard/analytics/page.tsx` - Analytics dashboard
- `/src/app/api/tracking/page/route.ts` - Tracking API endpoint
- `/src/app/api/webinars/[id]/analytics/route.ts` - Analytics API

### Documentation
- `/WHERE_TO_FIND_ANALYTICS.md` - Complete analytics guide
- `/REGISTRATION_PAGE_ANALYTICS_FIX.md` - This file

## 🎉 Summary

✅ Registration pages now track all visits automatically  
✅ Analytics dashboard properly aggregates data from multiple webinars  
✅ Supports A/B testing variant tracking  
✅ Tracks time on page for engagement metrics  
✅ Works with both custom templates and default template  
✅ Table displays in `/dashboard/analytics` when data exists  

**Next Steps:**
1. Visit some registration pages to generate test data
2. Check the analytics dashboard to see the table
3. Create A/B tests to see variant comparison
4. Export reports using the Export button

Happy tracking! 📊✨
