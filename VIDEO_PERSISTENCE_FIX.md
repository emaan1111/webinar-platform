# Video Persistence Fix - Registration & Schedule Tracking

## Problem
When user refreshed the page, video restarted from beginning instead of continuing from schedule-based timestamp.

## Root Cause
The countdown page was redirecting to `/room/asdasdasdas` without registration ID (`r`) or schedule ID (`s`) parameters. This meant:
1. Each page load was treated as a new anonymous session
2. Server couldn't track which registration or schedule to use
3. Video would calculate a new "initial" position each time

## Solution

### 1. Pass Registration & Schedule to Room
Updated countdown page to include parameters in joinLink:

**Before:**
```typescript
const joinLink = `${baseUrl}/room/${webinar.slug}`
```

**After:**
```typescript
const joinLinkParams = new URLSearchParams()
if (data.registrationId) {
  joinLinkParams.set('r', data.registrationId)
}
if (schedule?.id) {
  joinLinkParams.set('s', schedule.id)
}
const joinLink = `${baseUrl}/room/${webinar.slug}?${joinLinkParams.toString()}`
```

**Result:** URL now looks like:
```
http://localhost:3000/room/asdasdasdas?r=reg_123&s=schedule_456
```

### 2. Accept Registration in Countdown Page
Updated countdown page to accept and pass through registration ID:

```typescript
// Before
interface PageProps {
  params: { slug: string }
  searchParams: { s?: string; tz?: string }
}

// After
interface PageProps {
  params: { slug: string }
  searchParams: { r?: string; s?: string; tz?: string }
}
```

### 3. Store Registration in SessionStorage
Added sessionStorage to remember broadcast state:

```typescript
const [broadcastStarted, setBroadcastStarted] = useState(() => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem(`broadcast-started-${webinar.id}`) === 'true';
  }
  return false;
});

// When user clicks Start Broadcast
onClick={async () => {
  sessionStorage.setItem(`broadcast-started-${webinar.id}`, 'true');
  // ... start video
}}
```

### 4. Use Initial Timestamp (Not Dynamic)
Changed iframe and Vimeo Player initialization to use initial timestamp from server:

**Before (WRONG):**
```typescript
<iframe src={`...#t=${elapsedSeconds}s`} />

useEffect(() => {
  player.setCurrentTime(elapsedSeconds); // Re-runs every second!
}, [elapsedSeconds]);
```

**After (CORRECT):**
```typescript
<iframe src={`...#t=${timing.initialElapsedSeconds}s`} />

useEffect(() => {
  player.setCurrentTime(timing.initialElapsedSeconds); // Only once
  
  if (broadcastStarted) {
    player.play(); // Auto-play if already started
  }
}, [timing.initialElapsedSeconds, broadcastStarted]);
```

## How It Works Now

### Flow 1: First Time Visitor
```
1. User registers → Registration ID created (reg_123)
2. Redirected to thank-you page: /thank-you/slug?r=reg_123&s=schedule_456
3. Thank you page redirects to countdown: /countdown/slug?r=reg_123&s=schedule_456
4. Countdown timer reaches zero
5. Auto-redirect to room: /room/slug?r=reg_123&s=schedule_456
6. Server loads registration and schedule
7. Calculates elapsed time from schedule start
8. Video loads at correct timestamp
```

### Flow 2: Page Refresh During Webinar
```
1. User watching at 5:30 mark
2. Clicks browser refresh
3. URL preserved: /room/slug?r=reg_123&s=schedule_456
4. Server finds same registration & schedule
5. Calculates new elapsed time (now 5:32)
6. SessionStorage says broadcast already started
7. Video auto-plays at 5:32 (no overlay)
```

### Flow 3: Multiple Tabs (Same Session)
```
1. Tab A: Watching at 5:00 mark
2. Opens Tab B with same URL: /room/slug?r=reg_123&s=schedule_456
3. SessionStorage is shared across tabs
4. Tab B sees broadcastStarted = true
5. Tab B auto-plays at current timestamp (5:00+)
```

### Flow 4: Close & Reopen Browser
```
1. User closes browser completely
2. SessionStorage cleared (new session)
3. Opens URL again: /room/slug?r=reg_123&s=schedule_456
4. broadcastStarted = false (new session)
5. Overlay shown: "Click to Start Broadcast"
6. Video still loads at correct schedule-based timestamp
```

## URL Parameters

| Parameter | Source | Purpose |
|-----------|--------|---------|
| `r` | Registration ID | Identifies the viewer, links to specific schedule |
| `s` | Schedule ID | Identifies which schedule instance (recurring webinars) |
| `tz` | Timezone | User's timezone for display (optional) |

## Files Modified

1. **`/src/app/countdown/[slug]/page.tsx`**
   - Added `r` to PageProps searchParams
   - Updated `getCountdownData` to accept registrationId
   - Build joinLink with query parameters
   - Return registrationId in data object

2. **`/src/app/w/[slug]/live/page-client.tsx`**
   - Use `timing.initialElapsedSeconds` instead of dynamic `elapsedSeconds`
   - SessionStorage for `broadcastStarted` state
   - Auto-play when broadcastStarted = true
   - Remove elapsedSeconds dependency from Vimeo initialization

3. **`/src/app/room/[slug]/page.tsx`**
   - Already accepts `r` and `s` parameters
   - Uses them to load registration and calculate elapsed time

## Testing

### Test 1: Basic Flow
1. Register for webinar
2. Watch countdown
3. Join room when countdown ends
4. ✅ URL should be: `/room/slug?r=xxx&s=yyy`
5. ✅ Video starts at schedule-based timestamp

### Test 2: Page Refresh
1. Start watching video (3 minutes in)
2. Refresh page (F5)
3. ✅ URL preserved with parameters
4. ✅ Video continues from ~3 min mark (not 0:00)
5. ✅ No overlay shown (auto-plays)

### Test 3: SessionStorage Persistence
1. Start broadcast, watch for 1 minute
2. Refresh page
3. ✅ Video auto-plays (no overlay)
4. Close tab completely
5. Open same URL in new tab
6. ✅ Overlay shown again (new session)

### Test 4: No Parameters (Anonymous)
1. Go directly to: `/room/slug` (no parameters)
2. ✅ Works, but calculates from default schedule
3. Refresh page
4. ⚠️ May calculate different elapsed time (no registration anchor)

## Benefits

1. **Consistent Experience**: Same registration sees same position
2. **Refresh-Safe**: Can reload page without losing position
3. **Multi-Tab**: Open multiple tabs, all synchronized
4. **Analytics**: Track individual viewer progress via registration
5. **Personalization**: Can show different content per registration

## Limitations

1. **SessionStorage Scope**: Cleared when browser closes
2. **Anonymous Viewers**: Without `r` parameter, position may vary
3. **URL Sharing**: Users sharing URL share their position
4. **Cross-Device**: SessionStorage not shared across devices

## Future Enhancements

1. **LocalStorage Option**: Persist across browser sessions
2. **Server-Side Tracking**: Store last position in database
3. **Resume Feature**: "Continue where you left off"
4. **Progress API**: Track completion percentage
5. **Bookmark System**: Save specific timestamps

---

**Status:** ✅ Fixed
**Last Updated:** November 4, 2025
**Version:** 2.2.0
