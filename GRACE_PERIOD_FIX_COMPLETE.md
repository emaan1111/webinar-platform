# Grace Period Fix - Complete ✅

## Problem
When a user joined a webinar late and received a grace period adjustment (e.g., starting from 0:00 if 5 minutes late), refreshing the page would recalculate the grace period based on the **current time** instead of their **first join time**. This caused users to lose their viewing progress.

### Example of the Bug:
1. User joins at 5:02 (2 mins late) → Grace period applied → Video starts at 0:00
2. User watches for 10 minutes → Now at 10:00 mark in the video
3. User refreshes the page at 5:12
4. System recalculates: "12 mins late" → Applies 5-15 min rule → **Resets to 2:00 mark** ❌
5. User loses 8 minutes of progress!

## Solution
Track the **first time** a user joins the webinar room and use that timestamp for grace period calculation instead of recalculating on every page load.

## Changes Made

### 1. Database Schema (`/prisma/schema.prisma`)
Added `firstJoinedAt` field to the `Registration` model:

```prisma
model Registration {
  // ... existing fields ...
  joinedAt           DateTime? // Last time they joined (updates on refresh)
  firstJoinedAt      DateTime? // First time they ever joined (never changes, for grace period)
  leftAt             DateTime?
  // ... other fields ...
}
```

**Key Difference:**
- `joinedAt` - Updates every time the user loads the room page
- `firstJoinedAt` - Set only once when user first joins, **never changes**

### 2. Session Tracking API (`/src/app/api/tracking/session/route.ts`)
Updated the session join handler to set `firstJoinedAt` only if it's null:

```typescript
// Get existing registration to check firstJoinedAt
const existingReg = await prisma.registration.findUnique({
  where: { id: registrationId },
  select: { firstJoinedAt: true },
});

// Update registration joined time
const now = new Date();
await prisma.registration.update({
  where: { id: registrationId },
  data: {
    attended: true,
    joinedAt: now,
    // Set firstJoinedAt only if it's not already set (for grace period tracking)
    ...(existingReg && !existingReg.firstJoinedAt && { firstJoinedAt: now }),
  },
});
```

### 3. Room Page (`/src/app/room/[slug]/page.tsx`)

#### Added `firstJoinedAt` to Registration Query:
```typescript
const registration = registrationId
  ? await prisma.registration.findUnique({
      where: { id: registrationId },
      select: {
        id: true,
        name: true,
        email: true,
        registeredAt: true,
        scheduleId: true,
        timezone: true,
        webinarId: true,
        scheduledStartTime: true,
        firstJoinedAt: true, // NEW: For grace period tracking
      },
    })
  : null;
```

#### Updated Grace Period Calculation:
```typescript
// Use firstJoinedAt for grace period calculation if available
// This prevents the grace period from recalculating on page refresh
const referenceTime = registrationMeta?.firstJoinedAt || now;
const elapsedSecondsRaw = Math.floor(
  (referenceTime.getTime() - originalStartTime.getTime()) / 1000
);

// Grace period logic for late joiners
if (elapsedSecondsRaw > 0) {
  const minutesLate = elapsedSecondsRaw / 60;
  
  if (minutesLate <= 5) {
    // 0-5 mins late: adjust start time so elapsed = 0
    adjustedStartTime = new Date(referenceTime.getTime());
    gracePeriodApplied = `⏰ Grace period: ${minutesLate.toFixed(1)} mins late, starting from beginning${registrationMeta?.firstJoinedAt ? ' (locked)' : ''}`;
  } else if (minutesLate <= 15) {
    // 5-15 mins late: adjust start time so elapsed = 120 seconds (2 mins)
    adjustedStartTime = new Date(referenceTime.getTime() - 120000);
    gracePeriodApplied = `⏰ Grace period: ${minutesLate.toFixed(1)} mins late, starting from 2:00${registrationMeta?.firstJoinedAt ? ' (locked)' : ''}`;
  } else {
    // 15+ mins late: use actual start time (no adjustment)
    gracePeriodApplied = `⏰ No grace period: ${minutesLate.toFixed(1)} mins late, showing actual time`;
  }
}
```

#### Added TypeScript Interface:
```typescript
interface RegistrationMeta {
  id: string;
  name: string;
  email: string;
  registeredAt: Date;
  scheduleId: string | null;
  timezone: string | null;
  firstJoinedAt: Date | null; // NEW
}
```

## Grace Period Rules (Unchanged)
- **0-5 minutes late**: Start from beginning (0:00)
- **5-15 minutes late**: Start from 2:00 mark
- **15+ minutes late**: Show actual elapsed time (no grace period)

## How It Works Now ✅

### First Join:
1. User joins at 5:02 (2 mins late)
2. `firstJoinedAt` is set to 5:02
3. Grace period calculated: 2 mins late → Start from 0:00
4. Console log: `⏰ Grace period: 2.0 mins late, starting from beginning`

### After Refresh:
1. User watches for 10 minutes, now at 10:00 mark
2. User refreshes page at 5:12
3. System uses `firstJoinedAt` (5:02) instead of current time (5:12)
4. Grace period still calculated as: 2 mins late → Still starts from 0:00 ✅
5. Console log: `⏰ Grace period: 2.0 mins late, starting from beginning (locked)`
6. **User continues from 10:00 mark** - No progress lost! 🎉

### Console Log Indicators:
- Without "(locked)": Grace period being set for the first time
- With "(locked)": Grace period locked, using first join time

## Testing

### Test Scenario 1: First Join
1. Schedule a webinar to start at a specific time
2. Join 3 minutes late (between 0-5 min window)
3. Verify video starts from 0:00
4. Check console: Should show `starting from beginning` without "(locked)"

### Test Scenario 2: Refresh During Grace Period
1. Continue from Test 1
2. Watch for 5 minutes
3. Refresh the page
4. Verify video continues from ~5:00 mark (not reset to 0:00)
5. Check console: Should show `starting from beginning (locked)`

### Test Scenario 3: Join in 5-15 Minute Window
1. Join 10 minutes late
2. Verify video starts from 2:00 mark
3. Watch for 5 minutes (now at ~7:00)
4. Refresh the page
5. Verify video continues from ~7:00 mark (not reset to 2:00)
6. Check console: Should show `starting from 2:00 (locked)`

### Test Scenario 4: Join After 15+ Minutes
1. Join 20 minutes late
2. Verify video shows actual elapsed time (~20:00)
3. Watch for 5 minutes
4. Refresh
5. Verify video continues from same position
6. Check console: Should show `No grace period` message

## Database Migration
The `firstJoinedAt` column was added to the `Registration` table:

```bash
# Applied via prisma db push
npx prisma db push
```

**Note**: Existing registrations will have `firstJoinedAt` as `null`. The field will be populated when users join the webinar room for the first time after this update.

## Benefits
✅ Users never lose progress on page refresh
✅ Grace period is fair and consistent
✅ Better user experience and engagement
✅ Prevents confusion and frustration
✅ Encourages users to stay for the full webinar

## Related Files
- `/prisma/schema.prisma` - Database schema
- `/src/app/api/tracking/session/route.ts` - Session tracking API
- `/src/app/room/[slug]/page.tsx` - Webinar room page with grace period logic

## Status
🟢 **Complete and Tested** - Ready for production use
