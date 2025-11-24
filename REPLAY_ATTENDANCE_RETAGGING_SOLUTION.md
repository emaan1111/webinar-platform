# Replay Attendance Re-Tagging Feature

## Problem

Currently, when a user:
1. **Misses the live webinar** → Tagged as "MISSED"
2. **Watches the replay later** → Tags are NOT updated

This means:
- ❌ They keep "MISSED" tag even though they watched replay
- ❌ They don't get "ATTENDED", "MOSTLY_ATTENDED", "PARTLY_ATTENDED" based on replay watch time
- ❌ They don't receive post-webinar SMS even if they watched past the threshold

## Current Flow

```
User registers → Misses live webinar → Cron job runs
  ↓
attendanceTagsApplied = true
Tag = "MISSED"
  ↓
User watches replay later
  ↓
attended = true ✅
watchedReplay = true ✅
replayWatchTime = 3000s ✅
  ↓
BUT: attendanceTagsApplied is already true
  ↓
NO TAG UPDATE ❌
STILL "MISSED" ❌
```

## Solution Required

### Option 1: Re-tag on Replay (Recommended)

Update attendance tags when replay is watched:

```
User watches replay
  ↓
Check: Was previously tagged as MISSED?
  ↓
YES: Re-calculate attendance based on replay watch time
  ↓
Remove "MISSED" tag
Add appropriate tags:
  - "ATTENDED"
  - "REPLAY_ATTENDED"
  - "MOSTLY_ATTENDED" (if past threshold)
  - "PARTLY_ATTENDED" (if between 40min and threshold)
  ↓
Update attendanceTagsApplied timestamp
  ↓
Trigger post-webinar reminders if conditions met
```

### Option 2: Combined Tagging

Keep both live and replay tags:

```
User tagged "MISSED" after live
  ↓
User watches replay
  ↓
KEEP "MISSED" (for live session)
ADD "REPLAY_ATTENDED" (new tag)
ADD "MOSTLY_ATTENDED" if applicable
  ↓
Result: Contact has BOTH "MISSED" and "REPLAY_ATTENDED"
```

## Recommended Implementation

### Step 1: Add Replay Re-Tagging Function

Create new function in `src/lib/clickfunnelsAttendanceTags.ts`:

```typescript
/**
 * Re-apply attendance tags when user watches replay after being marked MISSED
 */
export async function reapplyAttendanceTagsAfterReplay(
  registrationId: string
): Promise<{ success: boolean; tags: string[]; error?: string }> {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        webinar: {
          select: {
            mostlyAttendedThreshold: true,
            videoDuration: true,
            title: true
          }
        },
        sessions: {
          where: { isReplay: true },
          select: {
            watchDuration: true,
            totalWatchTime: true,
            videoPosition: true
          }
        }
      }
    });

    if (!registration || !registration.email) {
      return { success: false, tags: [], error: 'Registration not found' };
    }

    // Only re-tag if they were previously marked as MISSED
    if (!registration.watchedReplay) {
      return { success: false, tags: [], error: 'No replay watched' };
    }

    // Calculate replay watch time
    const replayWatchTime = registration.replayWatchTime || 0;
    const threshold = registration.webinar.mostlyAttendedThreshold;

    // Remove MISSED tag
    const missedTagId = process.env.CLICKFUNNELS_TAG_MISSED;
    if (missedTagId) {
      await removeClickFunnelsTag(registration.email, missedTagId);
      console.log(`🗑️ Removed MISSED tag for ${registration.email}`);
    }

    // Determine new tags based on replay watch time
    const tagsToApply: string[] = [];

    // ATTENDED
    const attendedTagId = process.env.CLICKFUNNELS_TAG_ATTENDED;
    if (attendedTagId) {
      await tagClickFunnelsContact(registration.email, attendedTagId);
      tagsToApply.push('ATTENDED');
    }

    // REPLAY_ATTENDED (new tag)
    const replayTagId = process.env.CLICKFUNNELS_TAG_REPLAY_ATTENDED;
    if (replayTagId) {
      await tagClickFunnelsContact(registration.email, replayTagId);
      tagsToApply.push('REPLAY_ATTENDED');
    }

    // MOSTLY_ATTENDED or PARTLY_ATTENDED
    if (threshold && replayWatchTime >= threshold) {
      const mostlyTagId = process.env.CLICKFUNNELS_TAG_MOSTLY_ATTENDED;
      if (mostlyTagId) {
        await tagClickFunnelsContact(registration.email, mostlyTagId);
        tagsToApply.push('MOSTLY_ATTENDED');
      }
    } else if (replayWatchTime >= 2400) { // 40 minutes
      const partlyTagId = process.env.CLICKFUNNELS_TAG_PARTLY_ATTENDED;
      if (partlyTagId) {
        await tagClickFunnelsContact(registration.email, partlyTagId);
        tagsToApply.push('PARTLY_ATTENDED');
      }
    }

    // Update database
    await prisma.registration.update({
      where: { id: registrationId },
      data: {
        attendanceTagsApplied: true,
        attendanceTagsAppliedAt: new Date(),
        attended: true // Important: Mark as attended
      }
    });

    console.log(`✅ Re-tagged ${registration.email} after replay:`, tagsToApply);

    return { success: true, tags: tagsToApply };
  } catch (error) {
    console.error('Error re-tagging after replay:', error);
    return { 
      success: false, 
      tags: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
```

### Step 2: Call Re-Tagging in Session End

Update `src/app/api/tracking/session/route.ts`:

```typescript
// After replay session ends
if (isReplaySession && action === 'leave') {
  // Update registration with replay data
  await prisma.registration.update({
    where: { id: registrationId },
    data: {
      watchedReplay: true,
      replayWatchTime: updatedSession.totalWatchTime,
      replayClickedCTA: !!offerClicked,
      replayDevice: updatedSession.device || undefined,
      lastWatchedPosition: updatedSession.videoPosition, // Update position
    },
  });

  // Re-apply attendance tags if they were previously marked MISSED
  const existingReg = await prisma.registration.findUnique({
    where: { id: registrationId },
    select: { attended: true, attendanceTagsApplied: true }
  });

  // If previously not attended (MISSED), re-tag based on replay
  if (!existingReg?.attended || existingReg?.attended === false) {
    await reapplyAttendanceTagsAfterReplay(registrationId).catch(err => {
      console.error('Failed to re-tag after replay:', err);
    });
  }
}
```

### Step 3: Trigger Post-Webinar SMS

Update `src/lib/reminders.ts` to check replay watch time:

```typescript
// When checking if post-webinar reminder should be sent
const registration = await prisma.registration.findUnique({
  where: { id: reminder.registrationId },
  include: { webinar: true }
});

// Check BOTH live watch time AND replay watch time
const liveWatchTime = registration.lastWatchedPosition || 0;
const replayWatchTime = registration.replayWatchTime || 0;
const totalWatchTime = Math.max(liveWatchTime, replayWatchTime);

// Use total watch time for filtering
if (template.minWatchedMinutes) {
  const watchedMinutes = Math.floor(totalWatchTime / 60);
  if (watchedMinutes < template.minWatchedMinutes) {
    return { shouldSend: false, reason: 'Did not watch enough' };
  }
}

if (template.minWatchedPercentage) {
  const videoDuration = registration.webinar.videoDuration * 60;
  const watchedPercentage = (totalWatchTime / videoDuration) * 100;
  if (watchedPercentage < template.minWatchedPercentage) {
    return { shouldSend: false, reason: 'Did not watch enough percentage' };
  }
}
```

## Expected Behavior After Implementation

### Scenario 1: User Misses Live, Watches Full Replay

```
1. User registers
2. Misses live webinar
   → Tagged: "MISSED"
3. Watches replay (55 minutes)
   → Remove: "MISSED"
   → Add: "ATTENDED", "REPLAY_ATTENDED", "MOSTLY_ATTENDED"
   → Trigger post-webinar SMS (if configured)
```

### Scenario 2: User Misses Live, Watches Partial Replay

```
1. User registers
2. Misses live webinar
   → Tagged: "MISSED"
3. Watches replay (42 minutes, but before threshold)
   → Remove: "MISSED"
   → Add: "ATTENDED", "REPLAY_ATTENDED", "PARTLY_ATTENDED"
   → No post-webinar SMS (didn't reach threshold)
```

### Scenario 3: User Attends Live Partially, Completes in Replay

```
1. User registers
2. Attends live (20 minutes)
   → Tagged: "ATTENDED", "PARTLY_ATTENDED"
3. Watches replay (50 minutes, past threshold)
   → Keep: "ATTENDED"
   → Remove: "PARTLY_ATTENDED"
   → Add: "REPLAY_ATTENDED", "MOSTLY_ATTENDED"
   → Trigger post-webinar SMS
```

## Database Changes Needed

### Add REPLAY_ATTENDED Tag

```bash
# Add to .env
CLICKFUNNELS_TAG_REPLAY_ATTENDED="368599"  # Create in ClickFunnels
```

### Update Registration Model (Already has these fields)

```prisma
model Registration {
  // ... existing fields
  attended Boolean @default(false)
  watchedReplay Boolean @default(false)
  replayWatchTime Int @default(0)
  replayClickedCTA Boolean @default(false)
  lastWatchedPosition Int @default(0)
  attendanceTagsApplied Boolean @default(false)
  attendanceTagsAppliedAt DateTime?
}
```

## Testing Plan

### Test Case 1: Missed → Full Replay
1. Register for webinar
2. Don't attend (wait for cron to tag as MISSED)
3. Verify "MISSED" tag in ClickFunnels
4. Watch replay to end
5. Verify tags:
   - ❌ "MISSED" removed
   - ✅ "ATTENDED" added
   - ✅ "REPLAY_ATTENDED" added
   - ✅ "MOSTLY_ATTENDED" added
6. Verify post-webinar SMS received

### Test Case 2: Missed → Partial Replay
1. Register and miss live
2. Watch replay for 42 minutes (before threshold)
3. Verify tags:
   - ❌ "MISSED" removed
   - ✅ "ATTENDED" added
   - ✅ "REPLAY_ATTENDED" added
   - ✅ "PARTLY_ATTENDED" added
4. Verify NO post-webinar SMS

### Test Case 3: Partial Live → Complete Replay
1. Attend live for 20 minutes
2. Tagged as "PARTLY_ATTENDED"
3. Watch replay past threshold
4. Verify tags updated correctly
5. Verify post-webinar SMS sent

## Rollout Plan

1. **Add REPLAY_ATTENDED tag** in ClickFunnels
2. **Add environment variable** for the tag ID
3. **Implement re-tagging function** in clickfunnelsAttendanceTags.ts
4. **Update session tracking** to call re-tagging
5. **Update reminder filtering** to use total watch time
6. **Test thoroughly** with test webinars
7. **Deploy to production**
8. **Monitor** for proper tag application

## Benefits

✅ Accurate attendance tracking (live + replay)  
✅ Fair treatment of replay viewers  
✅ Post-webinar SMS sent to replay viewers who qualify  
✅ Better segmentation in ClickFunnels  
✅ More complete analytics  

---

## Want Me to Implement This?

I can add the re-tagging functionality right now. It will ensure:
- Users tagged "MISSED" get re-tagged when they watch replay
- Attendance tags reflect total engagement (live + replay)
- Post-webinar SMS sent to replay viewers who watched past threshold

**Should I implement this solution?**
