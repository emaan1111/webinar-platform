# Analytics Page - Unique Views and Reset Stats Feature

## Overview
Enhanced analytics dashboard with prominent unique views tracking and the ability to reset analytics data for individual webinars.

## New Features

### 1. **Unique Views Tracking**
Unique views are now displayed as the first metric in the analytics dashboard, giving you immediate visibility into how many people visited your registration page.

#### Metrics Display:
```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│  Unique Views   │  Registrations  │   Attendees     │  Full Funnel    │
│     1,234       │       856       │      642        │     52.0%       │
│  Reg page       │  69.4% conv.    │  75.0% attend   │  Views→Attend   │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

**Key Metrics:**
- **Unique Views**: Total unique visitors to registration page
- **Registrations**: Total sign-ups with conversion rate
- **Attendees**: People who actually joined with attendance rate
- **Full Funnel**: Complete conversion from views to attendees

### 2. **Reset Stats Button**
New "Reset Stats" button allows you to clear all analytics data for a specific webinar.

#### Features:
- ✅ Red button with rotate icon for easy identification
- ✅ Only enabled when exactly one webinar is selected
- ✅ Requires confirmation before resetting
- ✅ Shows what data will be deleted
- ✅ Cannot reset stats for "All Webinars" (safety feature)

## Usage

### Viewing Unique Views

1. Navigate to **Dashboard → Analytics**
2. Select a webinar from the dropdown
3. The first card shows **Unique Views**
4. View the **Full Funnel** percentage (Views → Attendees)

### Understanding the Metrics

| Metric | Formula | What It Means |
|--------|---------|---------------|
| **Unique Views** | Count of unique visitors to registration page | How many people saw your registration page |
| **Conversion Rate** | (Registrations / Unique Views) × 100 | % of visitors who registered |
| **Attendance Rate** | (Attendees / Registrations) × 100 | % of registrants who attended |
| **Full Funnel** | (Attendees / Unique Views) × 100 | Complete conversion from view to attendance |

### Example Calculation:
```
1,000 Unique Views
↓ 70% conversion
700 Registrations
↓ 60% attendance
420 Attendees
= 42% Full Funnel Conversion
```

### Resetting Analytics

#### When to Reset:
- Testing your webinar setup
- After a test run
- Want to start fresh for a new campaign
- Need to clear old data

#### How to Reset:

1. **Select a Single Webinar**
   - Click the webinar dropdown
   - Select ONE specific webinar (not "All Webinars")

2. **Click Reset Stats**
   - Red button with rotate icon appears
   - Only enabled when one webinar is selected

3. **Confirm Deletion**
   ```
   Are you sure you want to reset all analytics data for "Your Webinar Title"?
   
   This will delete:
   • All analytics events
   • Registration attendance data
   • Page view history
   
   This action cannot be undone!
   ```

4. **Data Cleared**
   - All analytics events deleted
   - Registration attendance reset
   - Page views cleared
   - Success message displayed
   - Page automatically reloads

#### What Gets Reset:

| Data Type | Reset? | Details |
|-----------|--------|---------|
| **Analytics Events** | ✅ Yes | All tracked events (views, clicks, engagement) |
| **Attendance Data** | ✅ Yes | hasAttended, joinedAt, leftAt, watchTime |
| **Page Views** | ✅ Yes | All registration and webinar page views |
| **Registration Records** | ❌ No | Email addresses and registrant info preserved |
| **Chat Messages** | ❌ No | Chat history is kept (commented out in code) |
| **Reactions** | ❌ No | Reaction history is kept (commented out in code) |

#### Safety Features:

1. **Single Webinar Only**
   - Cannot reset "All Webinars" at once
   - Must select exactly one webinar
   - Button disabled for multiple selections

2. **Confirmation Required**
   - Shows webinar title in confirmation
   - Lists what will be deleted
   - Warns that action cannot be undone
   - Requires explicit confirmation

3. **Admin Only**
   - Requires authenticated session
   - Only admin users can reset stats

## API Endpoint

### POST /api/analytics/reset

**Purpose**: Reset all analytics data for a specific webinar

**Authentication**: Required (NextAuth session)

**Request Body**:
```json
{
  "webinarId": "clx..."
}
```

**Response** (Success):
```json
{
  "success": true,
  "message": "Analytics reset successfully",
  "webinarId": "clx..."
}
```

**Response** (Error):
```json
{
  "error": "Webinar not found"
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid request (missing webinarId)
- `401`: Unauthorized (not logged in)
- `404`: Webinar not found
- `500`: Server error

## Technical Implementation

### Frontend Changes
**File**: `src/app/dashboard/analytics/page.tsx`

1. **New State**:
```typescript
const [resetting, setResetting] = useState(false)
```

2. **New Icon Import**:
```typescript
import { RotateCcw } from 'lucide-react'
```

3. **New Function**:
```typescript
const handleResetStats = async () => {
  // Validation
  // Confirmation
  // API call
  // Reload
}
```

4. **Updated Metrics Display**:
- Changed from 3 cards to 4 cards
- Added "Unique Views" as first card
- Added "Full Funnel" as fourth card
- Reordered metrics for better flow

### Backend Changes
**File**: `src/app/api/analytics/reset/route.ts`

**Operations**:
1. Validate session and webinar ownership
2. Delete analytics events
3. Reset registration attendance fields
4. Delete page views
5. Return success confirmation

**Database Operations**:
```typescript
// Delete events
await prisma.analyticsEvent.deleteMany({ where: { webinarId } })

// Reset registrations
await prisma.registration.updateMany({
  where: { webinarId },
  data: {
    hasAttended: false,
    joinedAt: null,
    leftAt: null,
    watchTimeSeconds: 0,
    lastHeartbeat: null,
    sawOffer: false,
    clickedOffer: false,
    hasPurchased: false,
  }
})

// Delete page views
await prisma.pageView.deleteMany({ where: { webinarId } })
```

## Troubleshooting

### Button is Disabled

**Cause**: Multiple webinars or "All Webinars" selected

**Solution**: Select exactly one webinar from dropdown

### Reset Failed

**Possible Causes**:
1. Not logged in → Log in and try again
2. Webinar doesn't exist → Verify webinar ID
3. Database error → Check server logs

**Solution**: Check console for error messages

### Data Not Resetting

**Check**:
1. Page reloaded after reset?
2. Correct webinar selected?
3. Server responded with success?

### Unique Views Showing Zero

**Possible Causes**:
1. No registration page views yet
2. Analytics tracking not configured
3. Tracking cookies blocked

**Solution**: 
- Check page view tracking is working
- Test registration page visit
- Verify analytics aggregate API

## Best Practices

### Testing

1. **Create Test Webinar**
   - Use separate webinar for testing
   - Don't reset production data

2. **Test Before Launch**
   - Reset stats after testing
   - Start with clean data for launch

3. **Document Resets**
   - Keep log of when you reset stats
   - Note reason for reset

### Production Use

1. **Be Cautious**
   - Reset is permanent
   - Cannot undo deletion
   - Double-check webinar selection

2. **Export First**
   - Click "Export" before resetting
   - Save copy of analytics
   - Keep for records

3. **Communicate**
   - Inform team before resetting
   - Note reset in project docs
   - Update stakeholders

## Version History

- **v1.0** (Current): Initial release
  - Unique views as primary metric
  - Reset stats functionality
  - Safety confirmations
  - Single webinar restriction

## Future Enhancements

### Possible Additions:
- [ ] Partial reset (e.g., only page views)
- [ ] Scheduled resets
- [ ] Reset history log
- [ ] Bulk export before reset
- [ ] Undo feature (restore from backup)
- [ ] Reset date range (not all data)

---

**Need Help?** Contact support or check server logs for detailed error messages.
