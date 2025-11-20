# Broadcast End Tracking & Session Management Enhancement

## Overview
Enhanced session tracking to use broadcast end time for `leftAt` timestamp and added expandable session rows in attendees table for detailed session verification.

## Changes Implemented

### 1. Broadcast End Time Tracking ✅

**Problem**: Previously, `leftAt` was set when a user left the webinar, which could be:
- Before the broadcast ended (user left early)
- After a different session started (user rejoined)
- Creating backwards timestamps (leftAt before joinedAt)

**Solution**: Set `leftAt` to the broadcast end time, not when user disconnects.

#### How It Works:
1. **Session Tracking** (`/api/tracking/session`):
   - When user leaves, session is marked inactive
   - Registration `leftAt` is **NOT** updated immediately
   - Will be set by cron job after broadcast ends

2. **Cron Job** (`/api/cron/update-broadcast-end`):
   - Runs every 5-10 minutes
   - Finds registrations where:
     - `attended = true`
     - `leftAt = null`
     - Broadcast has ended (scheduledStartTime + duration < now)
   - Sets `leftAt` to **broadcast end time** (not current time)
   
3. **Formula**:
   ```typescript
   leftAt = scheduledStartTime + (duration * 60 * 1000)
   ```

#### Benefits:
- ✅ Consistent `leftAt` across all attendees for same webinar
- ✅ No more backwards timestamps
- ✅ Accurate session duration calculations
- ✅ Better for attendance tagging (all attendees tagged at same time)

---

### 2. Expandable Sessions in Attendees Table ✅

**Problem**: Users with multiple sessions showed only aggregated data, making it hard to:
- Verify actual session timestamps
- Debug watch time discrepancies
- See which sessions were active/inactive

**Solution**: Added expandable rows showing all sessions for each attendee.

#### Features:

**Visual Indicator**:
- ChevronDown icon next to checkbox when `sessionCount > 1`
- Clickable to expand/collapse
- Shows session count in tooltip

**Expandable Content**:
Shows for each session:
- **Session Number**: Session 1, Session 2, etc.
- **Status Badge**: "Active" with pulsing green dot if `isActive = true`
- **Joined Time**: Formatted with timezone
- **Left Time**: Formatted or "—" if still active
- **Watch Time**: Formatted (e.g., "1h 23m 45s")
- **Device**: mobile/desktop/tablet
- **Browser**: Chrome, Safari, Firefox, etc.

**UI Design**:
- Light blue background (`bg-blue-50`) for expanded row
- White cards for each session
- Grid layout for compact display
- Responsive design

---

## Files Changed

### 1. `/src/app/api/tracking/session/route.ts`
**Purpose**: Track user sessions during webinar

**Changes**:
```typescript
// REMOVED: Immediate leftAt update
const registration = await prisma.registration.update({
  where: { id: registrationId },
  data: { leftAt: new Date() }, // ❌ OLD
})

// ADDED: Just fetch registration, leftAt will be set by cron
const registration = await prisma.registration.findUnique({
  where: { id: registrationId },
  include: { webinar: true }
})
```

**Why**: Let cron job handle leftAt after broadcast ends, ensuring consistency.

---

### 2. `/src/app/api/cron/update-broadcast-end/route.ts` (NEW)
**Purpose**: Update leftAt timestamps after broadcast ends

**Endpoint**: `GET /api/cron/update-broadcast-end`

**Authentication**: Bearer token (CRON_SECRET env variable)

**Logic**:
```typescript
// 1. Find attended registrations without leftAt
const registrations = await prisma.registration.findMany({
  where: {
    attended: true,
    leftAt: null,
    scheduledStartTime: { not: null }
  },
  include: { webinar: true }
})

// 2. Calculate broadcast end time
const broadcastEndTime = new Date(
  scheduledStartTime.getTime() + (duration * 60 * 1000)
)

// 3. Update if broadcast has ended
if (now >= broadcastEndTime) {
  await prisma.registration.update({
    where: { id },
    data: { leftAt: broadcastEndTime }
  })
}
```

**Response**:
```json
{
  "success": true,
  "message": "Updated 15 registration timestamps",
  "updated": 15,
  "broadcastEnded": 15,
  "legacy": 0,
  "timestamp": "2025-11-21T10:30:00.000Z"
}
```

**Cron Schedule**: 
- Run every 5-10 minutes
- Railway/Vercel cron: `*/5 * * * *`

---

### 3. `/src/app/dashboard/attendees/page.tsx`
**Purpose**: Main attendees dashboard

**Interface Changes**:
```typescript
// NEW interface for session data
interface AttendeeSession {
  id: string
  joinedAt: string
  leftAt: string | null
  videoPosition: number
  device: string
  browser: string | null
  isActive: boolean
  lastSeenAt: string | null
}

// UPDATED Attendee interface
interface Attendee {
  // ... existing fields
  sessions?: AttendeeSession[]  // NEW
}
```

**State Changes**:
```typescript
// NEW state for tracking expanded rows
const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

// NEW toggle function
const toggleRowExpand = (id: string) => {
  setExpandedRows(prev => {
    const newSet = new Set(prev)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    return newSet
  })
}

// NEW helper for formatting session time
const formatSessionTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`
  }
  return `${secs}s`
}
```

**UI Changes**:
```tsx
// UPDATED checkbox cell - now includes expand button
<td className="px-6 py-4 whitespace-nowrap">
  <div className="flex items-center gap-2">
    <input type="checkbox" ... />
    {attendee.sessions && attendee.sessions.length > 1 && (
      <button onClick={() => toggleRowExpand(attendee.id)}>
        {expandedRows.has(attendee.id) ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
    )}
  </div>
</td>

// NEW expandable row content
{expandedRows.has(attendee.id) && attendee.sessions && (
  <tr className="bg-blue-50">
    <td colSpan={enabledColumns.length + 2}>
      {attendee.sessions.map((session, idx) => (
        <div key={session.id} className="bg-white rounded-lg border p-3">
          <div className="grid grid-cols-6 gap-4">
            <div>Session {idx + 1}</div>
            <div>Joined: {formatDateTime(session.joinedAt)}</div>
            <div>Left: {session.leftAt ? formatDateTime(session.leftAt) : '—'}</div>
            <div>Watch Time: {formatSessionTime(session.videoPosition)}</div>
            <div>Device: {session.device}</div>
            <div>Browser: {session.browser}</div>
          </div>
        </div>
      ))}
    </td>
  </tr>
)}
```

---

### 4. `/src/app/api/attendees/route.ts`
**Purpose**: Fetch attendees with session data

**Changes**:
```typescript
// UPDATED return object
return {
  // ... existing fields
  sessionCount: reg.sessions.length,
  
  // NEW: Sessions array for expandable rows
  sessions: reg.sessions.map((session: any) => ({
    id: session.id,
    joinedAt: session.joinedAt,
    leftAt: session.leftAt,
    videoPosition: session.videoPosition || 0,
    device: session.device || 'unknown',
    browser: session.browser || null,
    isActive: session.isActive,
    lastSeenAt: session.lastSeenAt
  }))
}
```

---

## Setup Instructions

### 1. Deploy Cron Job

**Railway**:
```bash
# Add to railway.toml or use Railway dashboard
[[deploy]]
cronSchedule = "*/5 * * * *"
cronCommand = "curl -H 'Authorization: Bearer $CRON_SECRET' https://your-app.railway.app/api/cron/update-broadcast-end"
```

**Manual Cron (Linux/Mac)**:
```bash
# Add to crontab -e
*/5 * * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-app.com/api/cron/update-broadcast-end
```

**Environment Variable**:
```env
CRON_SECRET=your-random-secret-key-here
```

### 2. Test the Cron Job

```bash
# Test endpoint directly
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.com/api/cron/update-broadcast-end

# Expected response:
# {
#   "success": true,
#   "message": "Updated 5 registration timestamps",
#   "updated": 5,
#   "broadcastEnded": 5,
#   "legacy": 0
# }
```

### 3. Verify in Database

```sql
-- Check registrations awaiting update
SELECT id, email, attended, joinedAt, leftAt, scheduledStartTime
FROM "Registration"
WHERE attended = true AND leftAt IS NULL
LIMIT 10;

-- Check recently updated
SELECT id, email, leftAt, scheduledStartTime
FROM "Registration"
WHERE leftAt IS NOT NULL
ORDER BY leftAt DESC
LIMIT 10;
```

---

## Testing

### Test Scenario 1: Single Session
1. Register for webinar
2. Attend broadcast
3. Stay for entire broadcast
4. Wait for cron job to run
5. **Expected**: `leftAt` = broadcast end time

### Test Scenario 2: Multiple Sessions
1. Register for webinar
2. Join broadcast (Session 1)
3. Leave early
4. Rejoin (Session 2)
5. Stay until end
6. In attendees table, click expand icon
7. **Expected**: See both sessions with accurate timestamps

### Test Scenario 3: Active Session
1. Register and join ongoing webinar
2. In attendees table, expand sessions
3. **Expected**: See "Active" badge with pulsing dot

### Test Scenario 4: Cron Job Execution
1. Create test webinar ending 5 minutes ago
2. Create registration with `attended=true, leftAt=null`
3. Run cron job manually
4. **Expected**: `leftAt` updated to broadcast end time

---

## Benefits

### For Users:
- ✅ **Accurate Watch Time**: No more discrepancies between sessions and total
- ✅ **Session Verification**: See exact timestamps for each session
- ✅ **Active Status**: Know which sessions are still running
- ✅ **Debugging**: Easily identify issues with specific sessions

### For Admins:
- ✅ **Consistent Data**: All attendees have same `leftAt` for same webinar
- ✅ **Better Analytics**: Accurate attendance duration calculations
- ✅ **Reliable Tagging**: ClickFunnels tags applied at correct time
- ✅ **Clean Timestamps**: No more negative durations or backwards times

### For System:
- ✅ **Scalability**: Batch processing via cron instead of real-time
- ✅ **Performance**: Reduces database writes during live broadcast
- ✅ **Reliability**: Retry logic built into cron job
- ✅ **Maintainability**: Clear separation of concerns

---

## Future Enhancements

1. **Session Merging**: Automatically merge sessions < 1 minute apart
2. **Session Analytics**: Show drop-off patterns across sessions
3. **Export Sessions**: CSV export with detailed session breakdown
4. **Session Alerts**: Notify when user has unusual session patterns
5. **Session Comparison**: Compare watch time across different sessions

---

## Migration Notes

**Existing Data**:
- Registrations with old `leftAt` (set on user leave) will be preserved
- Cron job handles legacy data:
  - If no `scheduledStartTime` or `duration`: uses current time
  - Shows count in response: `legacy: 5`

**Backward Compatibility**:
- ✅ All API responses unchanged (sessions is additional field)
- ✅ Frontend gracefully handles missing sessions data
- ✅ Existing analytics continue to work
- ✅ No database migrations required

---

**Commit**: TBD
**Date**: November 21, 2025
**Impact**: Critical improvement for session tracking accuracy
