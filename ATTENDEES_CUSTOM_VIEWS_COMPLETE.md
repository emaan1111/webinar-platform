# Attendees Custom Views - Complete Implementation

## Overview
The attendees table now supports custom views that allow you to create, save, and switch between different analytical perspectives. Each view can show different combinations of 25+ available columns across 6 categories.

## Features

### ✨ Key Capabilities
- **Create unlimited custom views** with unique column combinations
- **Save views** to browser localStorage for persistence
- **Switch between views** instantly with dropdown selector
- **Edit existing views** including column selection and view name
- **Delete custom views** (except default view)
- **Export to CSV** respects current view's visible columns
- **25+ column types** across 6 categories

## Available Columns

### 📋 Basic Information (6 columns)
- **Name** - Attendee's full name with avatar
- **Email** - Contact email address
- **Phone** - Phone number (optional)
- **Webinar** - Which webinar they registered for
- **Registered** - Registration date and time
- **Attended** - Yes/No badge with icon

### 🌍 Location (2 columns)
- **Country** - Attendee's country
- **Timezone** - Attendee's timezone

### 📊 Engagement & Watch Time (6 columns)
- **Engagement Score** - Calculated engagement percentage (0-100%)
- **Total Watch Time** - Cumulative watch time across all sessions
- **Total Engagements** - Count of all engagement events (clicks, reactions, etc.)
- **Session Count** - Number of times they've joined
- **Joined At** - When they first joined the webinar
- **Left At** - When they left the webinar

### 💻 Device Information (4 columns)
- **Registration Device** - Device used to register (mobile/desktop)
- **Last Session Device** - Device used in most recent session
- **Browser** - Browser type (Chrome, Safari, Firefox, etc.)
- **Operating System** - OS (Windows, macOS, iOS, Android, etc.)

### 🎬 Replay Analytics (4 columns)
- **Watched Replay** - Yes/No if they watched the replay
- **Replay Watch Time** - How long they watched the replay
- **Replay Device** - Device used for replay viewing
- **Clicked CTA in Replay** - Yes/No if they clicked the CTA during replay

### ✅ Consents (3 columns)
- **GDPR Consent** - Checkmark if given
- **Privacy Consent** - Checkmark if given
- **Marketing Consent** - Checkmark if given

## How to Use

### Creating a New View

1. **Navigate to Attendees Page** (`/dashboard/attendees`)
2. **Click "Create New View"** button in the view dropdown
3. **Name your view** (e.g., "Replay Analytics", "Device Breakdown", "High Engagement")
4. **Select columns** by checking/unchecking boxes in each category
5. **Click "Save View"**

### Editing an Existing View

1. **Open view dropdown** next to "Default View" button
2. **Hover over a view** to reveal edit/delete buttons
3. **Click edit icon** (pencil)
4. **Modify** view name or column selection
5. **Click "Save View"**

### Switching Between Views

1. **Click the view dropdown** (shows current view name)
2. **Select** any saved view from the list
3. **Table updates instantly** to show selected columns

### Deleting a View

1. **Open view dropdown**
2. **Hover over a view** (except Default View)
3. **Click delete icon** (trash)
4. **View is removed** and you'll switch to Default View

## Example Use Cases

### 1. "Replay Performance View"
**Purpose**: Analyze replay engagement
**Columns**:
- Name
- Email
- Webinar
- Watched Replay
- Replay Watch Time
- Replay Device
- Clicked CTA in Replay

### 2. "High Engagers View"
**Purpose**: Identify most engaged attendees
**Columns**:
- Name
- Email
- Engagement Score
- Total Watch Time
- Total Engagements
- Session Count
- Attended

### 3. "Device Analytics View"
**Purpose**: Understand device usage patterns
**Columns**:
- Name
- Registration Device
- Last Session Device
- Browser
- Operating System
- Total Watch Time

### 4. "Marketing Qualified View"
**Purpose**: Export leads who gave marketing consent
**Columns**:
- Name
- Email
- Phone
- Country
- Marketing Consent
- GDPR Consent
- Engagement Score

### 5. "Complete Analytics View"
**Purpose**: See all available data at once
**Columns**: All 25 columns enabled

## Technical Implementation

### Architecture

```
/dashboard/attendees
│
├── ViewManager Component
│   ├── View dropdown (switch views)
│   ├── Edit Columns modal (customize views)
│   └── Column selector by category
│
├── Attendees Table
│   ├── Dynamic columns (based on active view)
│   ├── Smart cell rendering
│   └── Responsive formatting
│
└── localStorage Persistence
    └── "attendee_views" key
```

### Data Flow

```
1. Page Load
   ↓
2. Load views from localStorage
   ↓
3. Set first view as active (or default)
   ↓
4. Fetch attendees from API (/api/attendees)
   ↓
5. Render table with active view's columns
   ↓
6. User modifies view
   ↓
7. Save to localStorage
   ↓
8. Re-render table with new column config
```

### API Enhancements

**Endpoint**: `GET /api/attendees`

**New Response Fields**:
```typescript
{
  attendees: [
    {
      // Basic fields (existing)
      id: string
      name: string
      email: string
      phone: string | null
      
      // NEW: Analytics fields
      registrationDevice: 'mobile' | 'desktop' | 'unknown'
      watchedReplay: boolean
      replayWatchTime: number
      replayWatchTimeFormatted: string
      replayClickedCTA: boolean
      replayDevice: string | null
      totalWatchTime: number
      totalWatchTimeFormatted: string
      lastSessionDevice: string | null
      lastSessionBrowser: string | null
      lastSessionOS: string | null
      totalEngagements: number
      sessionCount: number
    }
  ]
}
```

### Data Calculation

**Total Watch Time**: Sum of `watchDuration` from all `sessions`
```typescript
const totalWatchTime = reg.sessions.reduce((sum, session) => {
  return sum + (session.watchDuration || 0)
}, 0)
```

**Total Engagements**: Sum of engagement events from all sessions
```typescript
const totalEngagements = reg.sessions.reduce((sum, session) => {
  return sum + (session.engagements?.length || 0)
}, 0)
```

**Engagement Score**: Calculated based on live attendance duration
```typescript
if (durationMinutes >= 45) engagementScore = 90-100%
else if (durationMinutes >= 30) engagementScore = 70-90%
else if (durationMinutes >= 15) engagementScore = 50-70%
else engagementScore = 0-50%
```

## Files Modified

### New Files
1. **`/src/components/attendees/ViewManager.tsx`** - View management component (380 lines)
2. **`/src/app/dashboard/attendees/page.tsx`** - Updated attendees page with view support (600+ lines)

### Modified Files
1. **`/src/app/api/attendees/route.ts`** - Enhanced API with analytics data

## Storage Schema

### localStorage Key: `attendee_views`

```json
[
  {
    "id": "default",
    "name": "Default View",
    "isDefault": true,
    "columns": [
      {
        "key": "name",
        "label": "Name",
        "enabled": true,
        "category": "basic"
      },
      {
        "key": "email",
        "label": "Email",
        "enabled": true,
        "category": "basic"
      }
      // ... more columns
    ]
  },
  {
    "id": "view_1699876543210",
    "name": "Replay Analytics",
    "columns": [
      // Custom column configuration
    ]
  }
]
```

## Column Rendering Logic

### Icon Types
- **Engagement Score**: Color-coded (green/yellow/red) percentage
- **Device Fields**: Icon + text (📱 Mobile or 💻 Desktop)
- **Watch Time**: ⏱️ Clock icon + formatted time (HH:MM:SS)
- **Boolean Fields**: ✅ Green checkmark or ❌ Gray X
- **Attendance**: Badge with icon and Yes/No text

### Formatting Rules
- **Dates**: Formatted as locale date + time
- **Times**: Display "N/A" if null
- **Devices**: Show "Unknown" if no data
- **Numbers**: Show "0" if null
- **Booleans**: Visual indicators (checkmarks/X)

## Performance Considerations

- **localStorage Limit**: ~5-10MB per domain (sufficient for 100+ views)
- **API Response**: Includes session data with proper indexing
- **Client-Side Filtering**: Fast even with 1000+ attendees
- **Column Rendering**: Optimized with memoized components
- **View Switching**: Instant (no API calls needed)

## CSV Export

**Export behavior**:
- Only exports columns visible in current view
- Respects column order from view configuration
- Formats data appropriately for CSV:
  - Dates → locale string
  - Booleans → "Yes"/"No"
  - Nulls → "N/A"
- Filename includes view name and date

**Example filename**: 
`attendees-replay-analytics-2025-11-16.csv`

## Future Enhancements

### Potential Additions
1. **Server-side view storage** (database instead of localStorage)
2. **Share views** with team members
3. **View templates** with pre-configured popular views
4. **Advanced filtering** within views (e.g., only show engagement > 70%)
5. **Sort order** persistence in views
6. **Column width** customization
7. **Conditional formatting** rules (highlight high engagers)
8. **Scheduled exports** for specific views

## Testing Checklist

- [x] Create new view
- [x] Edit existing view
- [x] Delete custom view
- [x] Switch between views
- [x] Column selection works
- [x] localStorage persistence
- [x] CSV export respects view
- [x] All column types render correctly
- [x] Icons display properly
- [x] Responsive on mobile
- [x] Handles empty data gracefully

## Commit
**Hash**: `61bfeed`
**Date**: Nov 16, 2025
**Files**: 20 changed, 1087 insertions(+), 210 deletions(-)

## Related Documentation
- `ATTENDEES_SYSTEM_COMPLETE.md` - Original attendees system
- `REPLAY_ANALYTICS_COMPLETE.md` - Replay tracking implementation
- `ATTENDEE_ANALYTICS_COMPLETE.md` - Analytics data structure

---

**Status**: ✅ Complete and Ready for Production

Navigate to `/dashboard/attendees` to start creating custom views!
