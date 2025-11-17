# Replay Resume Feature - Debugging Guide

## Current Status

The replay resume feature is implemented but not working. Here's what we know:

### What's Working
✅ Database has `lastWatchedPosition` column (confirmed with `npx prisma db push`)
✅ API endpoint exists at `/api/registrations/[id]/watch-position`
✅ Client-side code has position saving logic
✅ `isReplayMode` flag is correctly passed to client

### What's Not Working
❌ Position is always 0 in database (logs show: `📊 [Room] Registration lastWatchedPosition: 0`)
❌ Video doesn't resume from last position

## Debug Steps

### 1. Check if API is being called

Open browser console and look for these logs:
- `💾 Attempting to save position: XXs`
- `✅ Successfully saved watch position: XXs`
- `📥 [API] Received save request for registration...`

### 2. Check network tab

In browser DevTools > Network tab, filter for:
- `/api/registrations/*/watch-position`
- Should see POST requests every 10 seconds
- Check request payload and response

### 3. Manual test of API endpoint

Run this in browser console (replace ID with actual registration ID):

```javascript
fetch('/api/registrations/cmi3hb9kt000ajwayeosvh4mf/watch-position', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ position: 123 })
}).then(r => r.json()).then(console.log)
```

### 4. Check if broadcastStarted is true

The position saving only works if:
- `isReplay` is true
- `viewer?.id` exists
- `broadcastStarted` is true
- `vimeoPlayerRef.current` exists

Look for this log:
- `💾 Starting periodic position save for replay mode`

## Possible Issues

### Issue 1: broadcastStarted never becomes true in replay mode
The `broadcastStarted` state might not be set correctly for replays.

**Check:** Look for log `🎬 Creating Vimeo Player instance...`

### Issue 2: isReplay is false
Check logs for:
- `🎯 [WebinarLiveClient] Is replay mode: true/false`

### Issue 3: API is being called but database isn't updating
Check server logs for:
- `📥 [API] Received save request...`
- `✅ [API] Successfully updated position...`

### Issue 4: Type casting issue
The field might not be updating due to the `as any` type assertion.

## Quick Test

1. Open the replay page
2. Let video play for 30+ seconds
3. Check browser console for save logs
4. Refresh the page
5. Check if video resumes from saved position

## Expected Console Logs

When working correctly, you should see:

```
🎯 [WebinarLiveClient] Component mounted with viewer: {id: "...", name: "...", email: "...", lastWatchedPosition: 0}
🎯 [WebinarLiveClient] Is replay mode: true
🎯 [WebinarLiveClient] Viewer lastWatchedPosition: 0
🎬 Creating Vimeo Player instance...
✅ Vimeo Player instance created
🔄 REPLAY RESUME: Starting from 00:00 (0s) - where user left off  <-- OR resume from saved position
💾 Starting periodic position save for replay mode
... (10 seconds later) ...
💾 Attempting to save position: 10s (last saved: 0s)
✅ Successfully saved watch position: 10s
... (10 seconds later) ...
💾 Attempting to save position: 20s (last saved: 10s)
✅ Successfully saved watch position: 20s
```

## Server Logs to Check

```
📊 [Room] Registration lastWatchedPosition: 0   <-- Should increase after saving
📥 [API] Received save request for registration XXX, position: 10
✅ [API] Successfully updated position to 10 for registration XXX
```
