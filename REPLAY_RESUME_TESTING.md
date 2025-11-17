# Replay Resume Feature - Testing Guide

## What Was Fixed

### Issue: Position Always Starts from Beginning
**Root Cause**: The useEffect that saves position was checking for `vimeoPlayerRef.current` in its condition. Since refs don't trigger re-renders, the effect never ran even after the player was initialized.

### Solution Applied:
1. ✅ Removed `vimeoPlayerRef.current` check from useEffect condition
2. ✅ Added `playerReady` state that gets set when Vimeo player is ready
3. ✅ useEffect now depends on `playerReady` state instead of ref
4. ✅ Added comprehensive logging to track save attempts
5. ✅ Position checking moved inside the interval callback

## Testing Steps

### 1. Open Browser Console
Press F12 and go to Console tab. You should see:

```
🎯 [WebinarLiveClient] Component mounted
🎯 [WebinarLiveClient] Viewer: {id: "...", name: "...", email: "...", lastWatchedPosition: 0}
🎯 [WebinarLiveClient] Is replay mode: true
🎯 [WebinarLiveClient] Viewer lastWatchedPosition: 0
```

### 2. Click "Start Broadcast"
You should see:

```
🎬 Creating Vimeo Player instance...
✅ Vimeo Player instance created
🔄 REPLAY RESUME: Starting from 00:00 (0s) - where user left off
✅ Player ready
✅ Muted: false (or true on mobile)
✅ Volume: 1
✅ Time set to: 0s
🎉 Video playing!
```

### 3. Wait for Position Save to Activate
After the player starts, you should see:

```
💾 Starting periodic position save for replay mode
💾 Viewer ID: cmi3hb9kt000ajwayeosvh4mf
💾 Initial lastWatchedPosition: 0
```

**If you see**:
```
⏭️ Skipping position save setup: { isReplay: true, hasViewer: true, broadcastStarted: true, playerReady: false }
```
This means the player isn't ready yet. Wait a moment.

### 4. Watch Video for 10+ Seconds
Every 10 seconds, you should see:

```
💾 Attempting to save position: 12s (last saved: 0s)
✅ Successfully saved watch position: 12s
```

Then 10 seconds later:
```
💾 Attempting to save position: 22s (last saved: 12s)
✅ Successfully saved watch position: 22s
```

**If you see**:
```
⏭️ Skipping save - position hasn't changed enough
```
This means you're at the same position (video might be paused).

**If you see**:
```
⚠️ Cannot save position: player or viewer not available
```
This means the player ref was lost (shouldn't happen).

### 5. Check Network Tab
In DevTools > Network tab:
- Filter for `watch-position`
- You should see POST requests every 10 seconds
- Click on one and check:
  - **Request Payload**: `{"position": 12}`
  - **Response**: `{"success": true, "position": 12}`

### 6. Check Server Terminal
In your terminal running `npm run dev`, you should see:

```
📥 [API] Received save request for registration cmi3hb9kt000ajwayeosvh4mf, position: 12
✅ [API] Successfully updated position to 12 for registration cmi3hb9kt000ajwayeosvh4mf
```

### 7. Refresh the Page
After watching for 30+ seconds (and seeing successful saves), refresh the page.

The page should load and show:
```
📊 [Room] Registration lastWatchedPosition: 32
```
(Or whatever position was last saved)

Then when you click "Start Broadcast":
```
🔄 REPLAY RESUME: Starting from 00:32 (32s) - where user left off
```

The video should start playing from 32 seconds instead of from the beginning!

## Manual API Test

If automatic saving isn't working, test the API manually:

### In Browser Console, run:
```javascript
// Replace with your actual registration ID
const registrationId = 'cmi3hb9kt000ajwayeosvh4mf';

// Test saving position at 123 seconds
fetch(`/api/registrations/${registrationId}/watch-position`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ position: 123 })
}).then(r => r.json()).then(console.log);
```

You should see: `{success: true, position: 123}`

Then refresh the page and it should resume from 123 seconds.

## Troubleshooting

### Problem: "⏭️ Skipping position save setup" appears
**Check what's false:**
- `isReplay: false` → Not in replay mode (webinar hasn't ended yet)
- `hasViewer: false` → No viewer/registration ID
- `broadcastStarted: false` → Haven't clicked "Start Broadcast" yet
- `playerReady: false` → Player not initialized yet (wait a moment)

### Problem: No save attempts appear
**Possible causes:**
1. Video hasn't started playing (click "Start Broadcast")
2. Player isn't ready (check for `✅ Player ready` log)
3. `playerReady` state not being set (bug - check code)

### Problem: Saves attempt but fail with status 400/500
**Check server logs for:**
- Prisma errors
- Database connection issues
- Invalid position value

### Problem: Saves succeed but page refresh shows position: 0
**Possible causes:**
1. Database not actually updating (check with DB client)
2. Different registration being loaded
3. Cache issue (hard refresh with Cmd+Shift+R or Ctrl+Shift+F5)

### Problem: Position saves but video doesn't resume
**Check:**
1. Is `lastWatchedPosition > 0` in the component mount log?
2. Is the resume log showing the correct position?
3. Is the video actually seeking to that position? (check Vimeo player API calls)

## Expected Full Flow

1. **Page Load (after previous save)**:
   ```
   📊 [Room] Registration lastWatchedPosition: 32
   🎯 [WebinarLiveClient] Viewer lastWatchedPosition: 32
   ```

2. **Click Start**:
   ```
   🔄 REPLAY RESUME: Starting from 00:32 (32s)
   ✅ Time set to: 32s
   ```

3. **Video Plays**:
   ```
   🎉 Video playing!
   💾 Starting periodic position save
   ```

4. **Every 10 Seconds**:
   ```
   💾 Attempting to save position: 42s
   ✅ Successfully saved watch position: 42s
   ```

5. **Page Refresh**: Resume from 42s

## Files Modified

- `/src/app/w/[slug]/live/page-client.tsx` - Added `playerReady` state, fixed useEffect
- `/src/app/api/registrations/[id]/watch-position/route.ts` - API endpoint with logging
- `/src/app/room/[slug]/page.tsx` - Fetch and pass `lastWatchedPosition`
- `/prisma/schema.prisma` - Has `lastWatchedPosition Int @default(0)`

## Database Check

To manually verify in database:

```sql
SELECT id, name, email, "lastWatchedPosition", "watchedReplay" 
FROM registrations 
WHERE id = 'cmi3hb9kt000ajwayeosvh4mf';
```

After saving, this value should increase.
