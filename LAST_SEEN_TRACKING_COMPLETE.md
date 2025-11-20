# Last-Seen Time Tracking - Complete Implementation

## Overview
Accurate tracking of when attendees were last active, finalized AFTER the broadcast ends. This allows users to rejoin during the broadcast without being marked as "left", while capturing their true last activity time.

## How It Works

### During the Broadcast
- Users can leave and rejoin multiple times
- Each session tracks its own `joinedAt` and `leftAt` accurately
- **Registration `leftAt` remains `null`** (not finalized yet)
- Users aren't marked as "left" until broadcast is completely over

### After Broadcast Ends
- Cron job runs every 5-10 minutes
- Finds registrations where `attended = true` and `leftAt = null`
- Checks if broadcast has ended (`scheduledStartTime + duration < now`)
- **Sets registration `leftAt` to their last session's `leftAt` time**
- This captures accurate "when did they last watch" data

## Key Benefits

✅ **Allows Rejoining**: Users can disconnect and reconnect during broadcast  
✅ **Accurate Last-Seen**: Captures actual time they stopped watching  
✅ **Not Broadcast End**: Uses their real last session end time, not broadcast end  
✅ **Session Details**: All session-level data remains accurate  
✅ **Better Analytics**: Can track drop-off patterns and engagement

## Example Scenarios

### Scenario 1: User Stays Until End
```
10:05 AM - User joins (Session 1 starts)
11:00 AM - Broadcast ends
11:05 AM - User disconnects (Session 1 ends, leftAt = 11:05 AM)
11:10 AM - Cron runs

Result:
- Registration.leftAt = 11:05 AM (stayed until end + 5 minutes)
- Session 1: joinedAt=10:05, leftAt=11:05
- Total watch time: 60 minutes
```

### Scenario 2: User Leaves Early
```
10:05 AM - User joins (Session 1 starts)
10:30 AM - User disconnects (Session 1 ends, leftAt = 10:30 AM)
11:00 AM - Broadcast ends
11:10 AM - Cron runs

Result:
- Registration.leftAt = 10:30 AM (left early)
- Session 1: joinedAt=10:05, leftAt=10:30
- Total watch time: 25 minutes
- Analytics can see they left halfway through
```

### Scenario 3: Multiple Sessions (Rejoin)
```
10:05 AM - User joins (Session 1 starts)
10:20 AM - User disconnects (Session 1 ends, leftAt = 10:20 AM)
10:30 AM - User rejoins (Session 2 starts)
10:50 AM - User disconnects (Session 2 ends, leftAt = 10:50 AM)
11:00 AM - Broadcast ends
11:10 AM - Cron runs

Result:
- Registration.leftAt = 10:50 AM (last session's end time)
- Session 1: joinedAt=10:05, leftAt=10:20 (15 minutes)
- Session 2: joinedAt=10:30, leftAt=10:50 (20 minutes)
- Total watch time: 35 minutes
- Can see they rejoined and when they finally left
```

## Files Changed

### 1. `/src/app/api/tracking/session/route.ts`
**What Changed:**
- Removed automatic `leftAt` update when session ends
- Registration `leftAt` stays `null` during broadcast
- Comment explains cron will finalize it after broadcast

```typescript
// Don't update registration leftAt here - users can rejoin during broadcast
// leftAt will be set by cron job after broadcast ends to capture final last-seen time
const registration = await prisma.registration.update({
  where: { id: registrationId },
  data: {},
  include: { webinar: true }
});
```

### 2. `/src/app/api/cron/update-broadcast-end/route.ts`
**What Changed:**
- Finds registrations where `attended=true` and `leftAt=null`
- Checks if broadcast has ended
- **Gets the last session's `leftAt` time** (not broadcast end time!)
- Sets registration `leftAt` to that actual last-seen time

```typescript
const registrations = await prisma.registration.findMany({
  where: {
    attended: true,
    leftAt: null,
    scheduledStartTime: { not: null }
  },
  include: {
    sessions: {
      where: { leftAt: { not: null } },
      orderBy: { leftAt: 'desc' },
      take: 1  // Get most recent session
    }
  }
});

for (const registration of registrations) {
  const broadcastEndTime = new Date(
    scheduledStartTime.getTime() + (duration * 60 * 1000)
  );
  
  if (now >= broadcastEndTime) {
    // Use their actual last session's leftAt time
    const lastSessionLeftAt = registration.sessions[0]?.leftAt;
    
    if (lastSessionLeftAt) {
      await prisma.registration.update({
        where: { id: registration.id },
        data: { leftAt: lastSessionLeftAt }
      });
    }
  }
}
```

### 3. Expandable Sessions (Already Implemented)
- `/src/app/dashboard/attendees/page.tsx` - Shows session details
- `/src/app/api/attendees/route.ts` - Returns sessions array
- See `BROADCAST_END_TRACKING_AND_SESSIONS.md` for details

## Setup - Cron Job

### Option A: Use Existing Cron (RECOMMENDED)
Add to existing `/api/cron/process-reminders` which already runs every 5-10 minutes.

### Option B: Separate Cron Job
1. Go to Railway Dashboard → Settings → Cron Jobs
2. Add new job:
   - **Schedule**: `*/10 * * * *` (every 10 minutes)
   - **Command**: 
     ```bash
     curl -X GET https://your-domain.com/api/cron/update-broadcast-end \
       -H "Authorization: Bearer $CRON_SECRET"
     ```

### Environment Variable
```env
CRON_SECRET=your-secure-random-string
```

## Testing

### Local Test
```bash
# Start dev server
npm run dev

# Test the cron endpoint
curl -X GET http://localhost:3000/api/cron/update-broadcast-end \
  -H "Authorization: Bearer your-cron-secret"
```

### Expected Response
```json
{
  "success": true,
  "message": "Finalized 3 registration timestamps with accurate last-seen time",
  "updated": 3,
  "timestamp": "2024-11-20T11:10:00.000Z"
}
```

## Why This Approach Is Better

### ❌ BAD: Set leftAt to Broadcast End Time
```
Everyone gets leftAt = 11:00 AM (broadcast end)
- Can't see who left early vs stayed full time
- All users look the same
- Loses drop-off analytics
- Inflates engagement metrics
```

### ✅ GOOD: Set leftAt to Actual Last-Seen Time
```
User A: leftAt = 10:30 AM (left early - 30 minutes watched)
User B: leftAt = 11:05 AM (stayed until end - 60 minutes watched)
- Can see individual behavior
- Track drop-off patterns
- Accurate engagement metrics
- Real behavioral insights
```

## Analytics Benefits

### Can Now Track:
- **Drop-off Rate**: How many left before end?
- **Engagement Time**: When do most people leave?
- **Peak Exit Times**: Is there a boring section?
- **Completion Rate**: Who watched to the end?
- **Rejoin Patterns**: How often do people come back?

### Example Analytics Query:
```typescript
// Find average time watched
const avgLastSeen = await prisma.registration.aggregate({
  where: { webinarId, attended: true },
  _avg: { 
    // leftAt - joinedAt = time watched
  }
});

// Find drop-off distribution
const dropOffs = await prisma.$queryRaw`
  SELECT 
    EXTRACT(MINUTE FROM (leftAt - joinedAt)) as minutes_watched,
    COUNT(*) as user_count
  FROM "Registration"
  WHERE "webinarId" = ${webinarId}
  GROUP BY minutes_watched
  ORDER BY minutes_watched;
`;
```

## Summary

### What We're Tracking
- **Session Level**: Exact join/leave times for each connection
- **Registration Level**: Final last-seen time after broadcast ends

### The Flow
1. **During Broadcast**: Don't set registration.leftAt (allow rejoins)
2. **After Broadcast**: Finalize registration.leftAt with last session's actual end time
3. **Result**: Accurate last-seen time + ability to rejoin = best of both worlds

### Key Insight
**Registration.leftAt = when they actually stopped watching** (not broadcast end time)

This gives us accurate behavioral data while still allowing users to rejoin during the broadcast without being marked as "left".
