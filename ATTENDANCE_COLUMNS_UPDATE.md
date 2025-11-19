# Attendance Columns Update - Complete

## Overview
Updated the reports system to track and display three separate attendance metrics:
1. **Total Attendees** - Live + Replay attendees combined
2. **Live Attendees** - Users who attended during the live webinar
3. **Replay Attendees** - Users who watched the replay

## Changes Made

### 1. API Route (`/src/app/api/reports/route.ts`)

**Attendance Calculation Logic:**
```typescript
// Track live and replay separately
let liveAttendees = 0;
let replayAttendees = 0;

for (const reg of registrations) {
  // Check if attended live
  if (reg.attended) {
    liveAttendees++;
  }
  
  // Check if watched replay (has sessions but didn't attend live)
  if (!reg.attended && reg.sessions.length > 0) {
    replayAttendees++;
  }
}

// Calculate total
const totalAttendees = liveAttendees + replayAttendees;
```

**Response Structure:**
- Changed from flat structure to nested `fbResults` object
- Added `totalAttendees` and `replayAttendees` fields
- Maintained backward compatibility with existing metrics

### 2. Frontend (`/src/app/dashboard/reports/page.tsx`)

**Type Definition Updated:**
```typescript
type ReportData = {
  // ... other fields
  totalAttendees: number     // NEW
  liveAttendees: number      // EXISTING
  replayAttendees: number    // NEW
}
```

**Table Columns Added:**
- "Total Attendees" (blue color)
- "Live Attendees" (green color)  
- "Replay Attendees" (purple color)

**CSV Export Updated:**
- Added columns: "Total Attendees", "Replay Attendees"
- Maintains all historical metrics

**Summary Totals Updated:**
- Now calculates totals for all three attendance types
- Uses total attendees for attendance rate calculation

## Key Metrics

### Attendance Tracking
- **Live Attendees**: Counted when `registration.attended === true`
- **Replay Attendees**: Counted when `registration.attended === false` AND has session records
- **Total Attendees**: Sum of live + replay

### Engagement Tracking
- Engagement now counts users who watched X minutes during **live OR replay**
- Changed from live-only to include replay viewers
- Maintains same engagement threshold (default 30 minutes)

## Database Schema
No database changes required. Uses existing fields:
- `Registration.attended` - Boolean flag for live attendance
- `Session.totalWatchTime` - Used for engagement calculation
- `Session` records indicate replay viewing

## Testing
1. Navigate to `/dashboard/reports`
2. Select date range (Today, Last 7 Days, Last 30 Days)
3. Verify three separate attendance columns display
4. Check CSV export includes new columns
5. Confirm summary cards show updated totals

## Visual Indicators
- **Total Attendees**: Blue color (comprehensive metric)
- **Live Attendees**: Green color (real-time participation)
- **Replay Attendees**: Purple color (post-event engagement)

## Benefits
1. **Better Insights**: See breakdown of live vs replay viewing
2. **Content Strategy**: Identify replay appeal
3. **ROI Tracking**: Calculate cost per attendee by type
4. **User Behavior**: Understand viewing patterns

## Performance
- No additional database queries needed
- All data retrieved in existing registration query
- Efficient calculation using existing session data

## Backward Compatibility
- All existing metrics preserved
- Summary calculations updated to use total attendees
- Export format extended (not breaking)
- API response structure enhanced (additive)

## Status: ✅ Complete
- API updated with attendance calculations
- Frontend displays three columns
- CSV export includes new metrics
- Summary totals properly calculated
- No TypeScript errors
- Development server running on http://localhost:3003
