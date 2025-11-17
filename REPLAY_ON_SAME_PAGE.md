# Replay on Same Page Feature

## Overview
Users no longer get redirected to a separate `/replay` page when the webinar ends. Instead, the replay is shown on the same live room page with a "Replay" badge.

## Changes Made

### 1. Removed Redirect to Separate Replay Page

**File:** `/src/app/room/[slug]/page.tsx`

**Before:**
```typescript
if (now > webinarEndTime) {
  if (webinar.replayEnabled) {
    // Redirect to replay page with query params
    const replayUrl = `/w/${slug}/replay?r=${registrationId}`;
    redirect(replayUrl);
  }
}
```

**After:**
```typescript
if (now > webinarEndTime) {
  // Webinar has ended - but we'll show replay on the same page
  if (webinar.replayEnabled) {
    console.log('🎬 Webinar ended, showing replay on same page');
    // No redirect - just let the room page show replay mode
  }
}
```

### 2. Added Replay Mode Indicator

The live room page now shows a **"Replay"** badge instead of **"Broadcasting"** when the webinar has ended and replay is enabled.

**File:** `/src/app/w/[slug]/live/page-client.tsx`

**Added to interface:**
```typescript
interface WebinarLiveClientProps {
  // ... other props
  isReplayMode?: boolean;
}

interface WebinarData {
  // ... other props
  replayEnabled?: boolean;
}
```

**Status Badge Logic:**
```typescript
// Determine replay vs live status
const isReplay = isReplayMode || (totalDuration != null ? elapsedSeconds >= totalDuration : false);

const statusLabel = isReplay ? 'Replay' : 'Broadcasting';
const statusClass = isReplay ? styles.badgeReplay : styles.badgeLive;
```

**Component Prop:**
```typescript
<WebinarLiveClient
  webinar={{
    // ... other webinar props
    replayEnabled: webinar.replayEnabled,
  }}
  // ... other props
  isReplayMode={now > webinarEndTime && webinar.replayEnabled}
/>
```

## User Experience

### Before
1. User joins live webinar at `/room/[slug]`
2. Webinar ends
3. **User gets redirected to `/w/[slug]/replay`** (separate page)
4. User sees replay video on a different page

### After
1. User joins live webinar at `/room/[slug]`
2. Webinar ends
3. **User stays on the same page** (`/room/[slug]`)
4. Badge changes from "Broadcasting" to "Replay"
5. User continues watching on the same page seamlessly

## Benefits

✅ **Seamless transition** - No jarring redirect when webinar ends
✅ **Consistent URL** - Users stay on the same URL throughout
✅ **Better UX** - No page reload or navigation confusion
✅ **Simpler architecture** - One less page to maintain
✅ **Preserves context** - Chat, offers, reactions all stay in place

## Features Still Working

All webinar features continue to work in replay mode:
- ✅ Video playback (from beginning)
- ✅ Chat messages (time-synced, approved only)
- ✅ Reactions (time-synced)
- ✅ Offers (time-synced)
- ✅ FAQ section
- ✅ Analytics tracking
- ✅ Fullscreen mode
- ✅ Mute/unmute controls

## Replay Page Status

The separate replay page at `/src/app/w/[slug]/replay/` **has been removed** from the codebase.

✅ **Removed** - The replay folder and all related files have been deleted to simplify the architecture

## Testing

### Test Scenario 1: Just-in-Time Webinar
1. Create a webinar with just-in-time schedule (5 minutes)
2. Register and join the room
3. Wait for the video to reach the end
4. Verify:
   - Badge changes to "Replay"
   - User stays on same page
   - Video can be replayed from beginning

### Test Scenario 2: Scheduled Webinar with Replay Enabled
1. Create a webinar scheduled to end soon
2. Enable replay in webinar settings
3. Join the room before it ends
4. Wait for webinar end time to pass
5. Verify:
   - No redirect occurs
   - Badge shows "Replay"
   - Video continues playing

### Test Scenario 3: Webinar with Replay Disabled
1. Create a webinar with `replayEnabled = false`
2. Join the room
3. Wait for webinar to end
4. Verify:
   - User stays on same page
   - Appropriate end message is shown (if implemented)

## Configuration

The replay behavior is controlled by the `replayEnabled` field in the webinar settings:

```typescript
// Database schema (Prisma)
model Webinar {
  // ... other fields
  replayEnabled     Boolean   @default(false)
  replayDurationDays Int?    // How long replay is available
  replayExpiresAt   DateTime? // Absolute expiration date
}
```

## Related Files

- `/src/app/room/[slug]/page.tsx` - Main room page (server component) - shows replay on same page
- `/src/app/w/[slug]/live/page-client.tsx` - Live room client component - handles replay mode
- ~~`/src/app/w/[slug]/replay/page.tsx`~~ - **REMOVED** - Separate replay page (no longer needed)
- ~~`/src/app/w/[slug]/replay/page-client.tsx`~~ - **REMOVED** - Replay page client (no longer needed)

## Migration Notes

~~If you have existing users with bookmarked replay URLs (`/w/[slug]/replay`):~~

**UPDATE: Replay page has been removed.** If users have old bookmarked replay links, they will get a 404 error. You may want to add a catch-all redirect in your Next.js middleware or create a simple redirect page if needed.

## Rollback

To revert to the old behavior (separate replay page):

**Note:** The replay page files have been removed. To restore this functionality, you would need to:

1. **Recreate the replay page files** from git history or backup
2. **Restore redirect in `/src/app/room/[slug]/page.tsx`:**
```typescript
if (now > webinarEndTime && webinar.replayEnabled) {
  const replayParams = new URLSearchParams();
  if (registrationId) replayParams.set('r', registrationId);
  const replayUrl = `/w/${slug}/replay${replayParams.toString() ? `?${replayParams.toString()}` : ''}`;
  redirect(replayUrl);
}
```

3. **Remove `isReplayMode` prop from WebinarLiveClient**

4. **Remove `replayEnabled` from WebinarData interface**

## Future Enhancements

1. **Show replay duration** - Display how long replay will be available
2. **Replay-specific controls** - Add seek bar, playback speed controls
3. **Replay banner** - Show prominent banner: "You're watching a replay"
4. **Auto-start replay** - Automatically start video when entering replay mode
5. **Replay analytics** - Track replay views separately from live views

---

*Last Updated: November 17, 2025*
