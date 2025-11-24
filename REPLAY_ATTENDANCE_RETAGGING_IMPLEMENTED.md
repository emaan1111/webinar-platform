# Replay Attendance Re-Tagging Implementation ✅

## Overview
Successfully implemented the replay attendance re-tagging system that ensures users who miss the live webinar but watch the replay are properly tagged and can receive post-webinar SMS reminders if they meet the watch threshold.

## Problem Solved
Previously, users who missed the live webinar were tagged as "MISSED" and remained that way even if they watched the full replay. This meant:
- ❌ They didn't receive appropriate attendance tags (ATTENDED, MOSTLY_ATTENDED, etc.)
- ❌ They didn't receive post-webinar SMS even if they watched past the threshold
- ❌ Inaccurate analytics and unfair treatment of engaged replay viewers

## Solution Implemented

### 1. New Function: `reapplyAttendanceTagsAfterReplay()`
**Location:** `src/lib/clickfunnelsAttendanceTags.ts`

This function:
1. ✅ Checks if user watched the replay (`watchedReplay: true`)
2. ✅ Retrieves replay watch time from `registration.replayWatchTime`
3. ✅ Applies **ATTENDED** tag (always for replay viewers)
4. ✅ Applies **REPLAY_ATTENDED** tag (special marker for replay viewers)
5. ✅ Applies **MOSTLY_ATTENDED** or **PARTLY_ATTENDED** based on threshold
6. ✅ Updates database: `attended = true`, `attendanceTagsApplied = true`
7. ✅ Returns list of tags applied for logging

**Key Features:**
- Gracefully handles missing tags (skips if not configured)
- Logs all tag applications for monitoring
- Uses same thresholds as live attendance tagging
- Updates database state to prevent duplicate processing

### 2. Session Tracking Integration
**Location:** `src/app/api/tracking/session/route.ts`

Added automatic re-tagging when replay session ends:

```typescript
// Update registration with replay data
if (isReplaySession) {
  await prisma.registration.update({
    where: { id: registrationId },
    data: {
      watchedReplay: true,
      replayWatchTime: updatedSession.totalWatchTime,
      replayClickedCTA: !!offerClicked,
      replayDevice: updatedSession.device || undefined,
    },
  });

  // Re-apply attendance tags if user was previously marked as MISSED
  if (!registration.attended) {
    console.log(`🎬 User ${registration.email} watched replay after missing live - re-tagging...`);
    reapplyAttendanceTagsAfterReplay(registrationId).catch(err => {
      console.error('Failed to re-tag after replay:', err);
    });
  }
}
```

**Behavior:**
- ✅ Only re-tags users who previously missed (`!registration.attended`)
- ✅ Runs asynchronously (doesn't block session end response)
- ✅ Logs errors but doesn't fail the session end
- ✅ Triggers automatically when replay session ends

### 3. Post-Webinar SMS Filtering Enhancement
**Location:** `src/app/api/tracking/schedule-post-reminders/route.ts`

Updated to use the maximum of live and replay watch time:

```typescript
// Use the maximum of live watch time and replay watch time
const liveWatchTime = watchedSeconds || 0
const replayWatchTime = registration.replayWatchTime || 0
const maxWatchedSeconds = Math.max(liveWatchTime, replayWatchTime)

const watchedMinutes = maxWatchedSeconds / 60
const watchedPercentage = videoDuration > 0 
  ? (maxWatchedSeconds / videoDuration) * 100 
  : 0
```

**Result:**
- ✅ Replay viewers who meet threshold now qualify for SMS
- ✅ Partial live + full replay viewers get proper treatment
- ✅ Uses whichever watch time is higher (live or replay)
- ✅ Logs both watch times for debugging

## User Scenarios

### Scenario 1: Missed Live → Full Replay ✅
**Before:**
- User doesn't attend live webinar
- Tagged: MISSED
- Watches full replay
- Tags: Still MISSED ❌
- SMS: Not sent ❌

**After:**
- User doesn't attend live webinar
- Tagged: MISSED
- Watches full replay (past threshold)
- Tags: ATTENDED, REPLAY_ATTENDED, MOSTLY_ATTENDED ✅
- SMS: Sent if threshold met ✅

### Scenario 2: Missed Live → Partial Replay ✅
**Before:**
- User doesn't attend live
- Tagged: MISSED
- Watches 30 mins of replay
- Tags: Still MISSED ❌
- SMS: Not sent ❌

**After:**
- User doesn't attend live
- Tagged: MISSED
- Watches 30 mins of replay (below threshold)
- Tags: ATTENDED, REPLAY_ATTENDED ✅
- SMS: Not sent (correct) ✅

### Scenario 3: Partial Live → Complete Replay ✅
**Before:**
- User watches 20 mins of live
- Tagged: PARTLY_ATTENDED
- Watches full replay
- Tags: Still PARTLY_ATTENDED ❌
- SMS: Not sent ❌

**After:**
- User watches 20 mins of live
- Tagged: PARTLY_ATTENDED
- Watches full replay (past threshold)
- Tags: ATTENDED, REPLAY_ATTENDED, MOSTLY_ATTENDED ✅
- SMS: Sent ✅

## Tags Applied

### Always Applied for Replay Viewers:
1. **ATTENDED** - Marks user as having attended (replay counts!)
2. **REPLAY_ATTENDED** - Special marker for replay viewers

### Conditionally Applied:
3. **MOSTLY_ATTENDED** - If `replayWatchTime >= mostlyAttendedThreshold`
4. **PARTLY_ATTENDED** - If `replayWatchTime >= 2400` (40 mins) but below threshold

### Note on MISSED Tag:
- ClickFunnels doesn't have a "remove tag" API
- We simply don't re-apply MISSED and add positive tags instead
- The presence of ATTENDED, MOSTLY_ATTENDED overrides MISSED in practice

## Environment Variables Required

Add to `.env` file:

```bash
# Existing attendance tags (already configured)
CLICKFUNNELS_TAG_ATTENDED="xxxxx"
CLICKFUNNELS_TAG_MOSTLY_ATTENDED="xxxxx"
CLICKFUNNELS_TAG_PARTLY_ATTENDED="xxxxx"

# New tag for replay viewers (needs to be created in ClickFunnels)
CLICKFUNNELS_TAG_REPLAY_ATTENDED="xxxxx"
```

## Testing Checklist

### Setup:
- [ ] Create REPLAY_ATTENDED tag in ClickFunnels
- [ ] Add tag ID to `.env` as `CLICKFUNNELS_TAG_REPLAY_ATTENDED`
- [ ] Configure a webinar with `mostlyAttendedThreshold` (e.g., 3600 seconds)
- [ ] Set up post-webinar SMS with `minWatchedMinutes` filter

### Test Case 1: Missed Live → Full Replay
- [ ] Register for webinar
- [ ] Don't join live session (will be tagged MISSED automatically)
- [ ] Wait for tagging to complete
- [ ] Watch replay for full duration (past threshold)
- [ ] Verify tags in ClickFunnels: ATTENDED, REPLAY_ATTENDED, MOSTLY_ATTENDED
- [ ] Verify `registration.attended = true` in database
- [ ] Verify post-webinar SMS is scheduled/sent

### Test Case 2: Missed Live → Partial Replay
- [ ] Register for webinar
- [ ] Don't join live session
- [ ] Watch 20 mins of replay (below threshold)
- [ ] Verify tags: ATTENDED, REPLAY_ATTENDED (no MOSTLY_ATTENDED)
- [ ] Verify post-webinar SMS is NOT sent

### Test Case 3: Partial Live → Complete Replay
- [ ] Register and join live webinar
- [ ] Watch 15 mins then leave (below threshold)
- [ ] Verify initially tagged PARTLY_ATTENDED
- [ ] Watch full replay (past threshold)
- [ ] Verify upgraded to MOSTLY_ATTENDED
- [ ] Verify post-webinar SMS is sent

### Test Case 4: Full Live Attendee Watches Replay
- [ ] Register and attend full live session
- [ ] Verify tagged ATTENDED, MOSTLY_ATTENDED
- [ ] Watch replay again
- [ ] Verify tags remain the same (no duplicate REPLAY_ATTENDED)
- [ ] Verify no duplicate SMS sent

## Database Fields Used

### Registration Table:
- `watchedReplay` (boolean) - Set to true when replay is watched
- `replayWatchTime` (integer) - Total seconds watched during replay
- `replayClickedCTA` (boolean) - Did they click CTA during replay
- `replayDevice` (string) - Device used for replay viewing
- `attended` (boolean) - Updated to true after replay re-tagging
- `attendanceTagsApplied` (boolean) - Prevents duplicate tagging
- `attendanceTagsAppliedAt` (DateTime) - Timestamp of tag application

### Used for Calculations:
- `webinar.mostlyAttendedThreshold` - Threshold in seconds
- `webinar.videoDuration` - For percentage calculations
- `reminderTemplate.minWatchedMinutes` - SMS filter
- `reminderTemplate.minWatchedPercentage` - SMS filter

## Monitoring & Logs

When re-tagging occurs, you'll see:
```
🎬 User user@example.com watched replay after missing live - re-tagging...
🎬 Re-tagging user@example.com after watching replay
✅ Applied ATTENDED tag to user@example.com
✅ Applied REPLAY_ATTENDED tag to user@example.com
✅ Applied MOSTLY_ATTENDED tag to user@example.com (watched 4200s, threshold 3600s)
✅ Successfully re-tagged user@example.com with: ['ATTENDED', 'REPLAY_ATTENDED', 'MOSTLY_ATTENDED']
```

When SMS is scheduled:
```
📊 Watch stats: {
  liveWatchTime: 0,
  replayWatchTime: 70,
  watchedMinutes: 70,
  watchedPercentage: 85,
  videoDuration: 4800
}
```

## Benefits

### For Users:
- ✅ Fair treatment of replay viewers
- ✅ Receive valuable post-webinar SMS if engaged
- ✅ Proper segmentation for future marketing

### For Business:
- ✅ Accurate attendance analytics
- ✅ Better engagement tracking
- ✅ Increased replay value (viewers get benefits)
- ✅ More accurate segmentation lists

### For System:
- ✅ Automatic processing (no manual work)
- ✅ Idempotent (won't double-tag)
- ✅ Error-resistant (async with error handling)
- ✅ Well-logged for debugging

## Related Files Modified

1. **src/lib/clickfunnelsAttendanceTags.ts**
   - Added `reapplyAttendanceTagsAfterReplay()` function (100+ lines)
   - Exports function for use in session tracking

2. **src/app/api/tracking/session/route.ts**
   - Imported `reapplyAttendanceTagsAfterReplay`
   - Added automatic call when replay session ends
   - Only processes users who weren't previously attended

3. **src/app/api/tracking/schedule-post-reminders/route.ts**
   - Updated to use `Math.max(liveWatchTime, replayWatchTime)`
   - Enhanced logging to show both watch times
   - Ensures replay viewers qualify for SMS

## Next Steps

1. **Add Environment Variable:**
   ```bash
   # Create "REPLAY_ATTENDED" tag in ClickFunnels admin
   # Copy the tag ID
   # Add to .env file:
   CLICKFUNNELS_TAG_REPLAY_ATTENDED="your_tag_id_here"
   ```

2. **Deploy Changes:**
   - Commit and push the code changes
   - Deploy to production
   - Monitor logs for successful re-tagging

3. **Test Thoroughly:**
   - Follow testing checklist above
   - Verify tags appear in ClickFunnels
   - Confirm SMS are sent appropriately
   - Check analytics show correct attendance

4. **Monitor Performance:**
   - Watch for errors in logs
   - Verify re-tagging completes successfully
   - Check SMS delivery rates increase
   - Monitor user engagement with replay content

## Success Metrics

After implementation, you should see:
- ✅ Increase in "ATTENDED" tag count (includes replay viewers)
- ✅ New "REPLAY_ATTENDED" tags being applied
- ✅ Post-webinar SMS delivery increase
- ✅ More accurate attendance reports
- ✅ Better user engagement tracking

---

**Implementation Status:** ✅ Complete
**Testing Status:** ⏳ Pending
**Deployment Status:** ⏳ Pending

**Implementation Date:** December 2024
**Developer:** AI Assistant
**Approved By:** User
