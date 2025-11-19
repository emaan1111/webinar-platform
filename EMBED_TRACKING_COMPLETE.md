# Embed Form View Tracking - Complete ✅

## Overview
Inline and popup embed forms now track unique views, allowing you to measure conversion rates separately from the main registration page. This helps you understand how well your embeds perform on external websites.

## Features Implemented

### 1. **Automatic View Tracking**
- **Inline Forms**: Tracked when the embed script loads and renders the form
- **Popup Forms**: Tracked when the user clicks to open the popup modal
- **Visitor ID**: Uses localStorage to identify unique visitors (same as registration pages)
- **Device Detection**: Tracks mobile, tablet, or desktop
- **Referrer Tracking**: Captures the parent page URL where the embed is placed

### 2. **PageVisit Records**
- Creates PageVisit records with `pageType: 'embed-inline'` or `pageType: 'embed-popup'`
- Includes all tracking data: visitorId, device, browser, referrer
- Stored in the same database table as registration page visits

### 3. **Analytics Dashboard Display**
New "Embed Form Performance" card shows:
- **Total Embed Views**: Combined inline + popup views
- **Unique Visitors**: Count of unique people who saw the embeds
- **Inline Forms**: Separate count of inline form views
- **Popup Forms**: Separate count of popup modal opens
- **Embed Conversion Rate**: Registrations / Unique Embed Visitors

### 4. **API Endpoints Enhanced**
Both analytics endpoints now return embed data:
- `/api/analytics/aggregate` - For multiple webinars
- `/api/webinars/[id]/analytics` - For single webinar

## How It Works

### Tracking Flow

#### Inline Embed
```javascript
1. User visits website with embedded form
2. Embed script loads and executes
3. initializeInlineEmbed() runs
4. trackEmbedView('embed-inline') is called
5. Creates/retrieves visitor ID from localStorage
6. Sends POST to /api/tracking/page with:
   - webinarId
   - pageType: 'embed-inline'
   - visitorId
   - device type
   - browser
   - referrer URL
```

#### Popup Embed
```javascript
1. User visits website with popup button
2. Embed script loads and attaches click handlers
3. User clicks popup button
4. createPopupModal() runs
5. trackEmbedView('embed-popup') is called
6. Modal opens and tracking is sent
```

### Visitor Identification
```javascript
// Get or create visitor ID
let visitorId = localStorage.getItem('visitorId');
if (!visitorId) {
  visitorId = crypto.randomUUID();
  localStorage.setItem('visitorId', visitorId);
}
```

Same visitor ID used across:
- Registration pages
- Inline embeds
- Popup embeds
- All tracking is unified per visitor

## Files Modified

### 1. **Embed Script** - `/src/app/api/embed/[id]/route.ts`
```typescript
// Added tracking function
function trackEmbedView(embedType) {
  // Get/create visitor ID
  // Detect device type
  // Send tracking request
}

// Track inline form views
function initializeInlineEmbed() {
  // ... setup code ...
  trackEmbedView('embed-inline');
}

// Track popup form opens
function createPopupModal() {
  trackEmbedView('embed-popup');
  // ... modal creation ...
}
```

### 2. **Analytics Aggregate** - `/src/app/api/analytics/aggregate/route.ts`
```typescript
// Filter embed visits
const embedInlineVisits = pageVisits.filter((p: any) => p.pageType === 'embed-inline');
const embedPopupVisits = pageVisits.filter((p: any) => p.pageType === 'embed-popup');

// Calculate unique visitors
const uniqueEmbedVisitors = new Set([...embedInlineVisits, ...embedPopupVisits]
  .map((v: any) => v.visitorId)).size;

// Add to response
funnel: {
  // ... existing metrics ...
  embedViews: {
    total: totalEmbedViews,
    inline: embedInlineVisits.length,
    popup: embedPopupVisits.length,
    uniqueVisitors: uniqueEmbedVisitors,
    uniqueInlineVisitors,
    uniquePopupVisitors,
  },
}
```

### 3. **Single Webinar Analytics** - `/src/app/api/webinars/[id]/analytics/route.ts`
- Same logic as aggregate route
- Added embed views tracking and calculations
- Included average time on embed pages

### 4. **Analytics Dashboard** - `/src/app/dashboard/analytics/page.tsx`
```tsx
// Added TypeScript interface
embedViews?: {
  total: number
  inline: number
  popup: number
  uniqueVisitors: number
  uniqueInlineVisitors: number
  uniquePopupVisitors: number
}

// Added aggregation logic
if (data.funnel.embedViews) {
  // Aggregate embed views across multiple webinars
}

// Added UI card
{analyticsData.funnel.embedViews && analyticsData.funnel.embedViews.total > 0 && (
  <Card>
    <CardHeader>Embed Form Performance</CardHeader>
    <CardBody>
      {/* Display embed metrics */}
    </CardBody>
  </Card>
)}
```

## Usage Example

### Setup Embed on External Site
```html
<!-- Inline embed -->
<div id="webinar-embed-abc123"></div>
<script src="https://yoursite.com/api/embed/abc123?theme=registration&type=inline"></script>

<!-- This will now automatically track views! -->
```

### View Analytics
1. Go to Dashboard → Analytics
2. Select your webinar
3. Scroll to "Embed Form Performance" card
4. See:
   - Total embed views
   - Inline vs popup breakdown
   - Unique visitors
   - Conversion rate from embeds

## Metrics Explained

### Total Embed Views
Count of all times someone saw an embed form (inline) or opened a popup

### Unique Visitors
Number of distinct people (by browser) who interacted with embeds

### Inline Forms
Number of times inline embed loaded on external sites

### Popup Forms
Number of times popup modal was opened by clicking buttons

### Embed Conversion Rate
Formula: `(Total Registrations / Unique Embed Visitors) × 100`

**Note**: This counts ALL registrations from the webinar, not just embed registrations. To track embed-specific registrations, you would need to add a `source` field to registrations.

## Benefits

1. **Measure Embed Effectiveness**: Know if your embeds are actually working
2. **Compare Channels**: See if embeds convert better/worse than direct registration page
3. **Optimize Placement**: Track which sites/pages drive most views
4. **Identify Issues**: If you have many embed views but few registrations, something may be wrong
5. **A/B Testing**: Test different embed themes and measure performance

## Database Schema

The PageVisit table already supports this:
```prisma
model PageVisit {
  id             String   @id @default(cuid())
  webinarId      String
  visitorId      String   // UUID from localStorage
  pageType       String   // "embed-inline" or "embed-popup"
  pageId         String?  // null for embeds
  variantGroup   String?  // null for embeds
  enteredAt      DateTime @default(now())
  device         String?  // "mobile", "tablet", "desktop"
  browser        String?  // User agent
  referrer       String?  // Parent page URL
  // ... other fields
}
```

## Privacy & GDPR

- Uses localStorage for visitor ID (no cookies)
- No personal data collected in tracking
- Visitor IDs are random UUIDs
- Can be cleared by user clearing localStorage
- Compliant with privacy-friendly analytics

## Testing

### Test Inline Tracking
1. Create test HTML file:
```html
<!DOCTYPE html>
<html>
<body>
  <h1>Test Page</h1>
  <div id="webinar-embed-YOUR_WEBINAR_ID"></div>
  <script src="http://localhost:3000/api/embed/YOUR_WEBINAR_ID?theme=registration&type=inline"></script>
</body>
</html>
```
2. Open in browser
3. Check browser console for tracking logs
4. Check database: `SELECT * FROM page_visits WHERE pageType = 'embed-inline' ORDER BY enteredAt DESC LIMIT 10;`

### Test Popup Tracking
1. Create test HTML:
```html
<!DOCTYPE html>
<html>
<body>
  <h1>Test Page</h1>
  <button data-webinar-popup="YOUR_WEBINAR_ID">Register Now</button>
  <script src="http://localhost:3000/api/embed/YOUR_WEBINAR_ID?theme=purple&type=popup"></script>
</body>
</html>
```
2. Open in browser
3. Click the button
4. Check database for `pageType = 'embed-popup'`

### Verify Analytics
1. Generate some test views (open embeds in different browsers/incognito)
2. Go to Analytics dashboard
3. Should see "Embed Form Performance" card with your test data

## Future Enhancements

Potential additions:
- Track embed-specific registrations (add `source` field)
- Track conversion funnel: Views → Form Starts → Completions
- Track which external domains drive most traffic
- Add embed performance to individual webinar dashboards
- Export embed analytics to CSV
- Real-time embed view counter
- Geographic distribution of embed viewers

## Troubleshooting

### Embed views not showing in analytics?
- Check browser console for tracking errors
- Verify `/api/tracking/page` endpoint is accessible
- Check CORS headers are applied
- Ensure visitor ID is being generated

### Conversion rate seems off?
- Remember: This tracks ALL registrations, not just from embeds
- For embed-specific conversion, need to track registration source

### Duplicate counting?
- Each page load = 1 view (intended behavior)
- Unique visitors deduplicated by visitorId
- Same visitor on different devices = multiple visitorIds (limitation)

## Summary

✅ Inline embed views tracked automatically  
✅ Popup embed views tracked on open  
✅ Unique visitors counted via localStorage  
✅ Analytics dashboard displays embed performance  
✅ Both aggregate and single-webinar analytics updated  
✅ No breaking changes to existing functionality  
✅ Privacy-friendly implementation  

Embed forms now have the same tracking capabilities as registration pages, giving you complete visibility into your entire registration funnel!
