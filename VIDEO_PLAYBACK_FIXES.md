# Video Playback Fixes - Replay Mode Issues ✅

## Problem
Video in replay mode was:
- Failing to load (showing retry screen)
- Playing briefly then stopping
- Getting paused unexpectedly

## Root Causes Identified

### 1. **Emergency Timeout Too Aggressive** ⏱️
- Was set to 6 seconds
- Video initialization sometimes takes longer, especially on slower connections
- **Fix**: Increased to 12 seconds

### 2. **Tab Visibility Handler Pausing Video** 👁️
- Visibility change handler was pausing video when tab lost focus
- In replay mode, users might switch tabs and expect video to keep playing
- **Fix**: Modified to skip pausing in replay mode

### 3. **Unexpected Pause Events** ⏸️
- Video could pause due to browser autoplay policies or other events
- No recovery mechanism in place
- **Fix**: Added auto-resume for replay mode when unexpected pause detected

## Changes Made

### File: `/src/app/w/[slug]/live/page-client.tsx`

#### Change 1: Extended Emergency Timeout
```typescript
// Before: 6 seconds
const emergencyTimeout = setTimeout(() => {
  console.log('⚠️ EMERGENCY: Force hiding loading overlay after 6s');
  setVideoLoading(false);
  setVideoError(true);
  setBroadcastStarted(false);
}, 6000);

// After: 12 seconds
const emergencyTimeout = setTimeout(() => {
  console.log('⚠️ EMERGENCY: Force hiding loading overlay after 12s');
  setVideoLoading(false);
  setVideoError(true);
  setBroadcastStarted(false);
}, 12000);
```

**Why**: Gives more time for video to initialize, especially on slower connections or mobile devices.

---

#### Change 2: Smarter Tab Visibility Handling
```typescript
// Before: Always paused video when tab hidden
if (!isVisible) {
  pausedTimeRef.current = elapsedSeconds;
  if (vimeoPlayerRef.current) {
    vimeoPlayerRef.current.pause().catch(() => {});
  }
}

// After: Skip pausing in replay mode
if (!isVisible) {
  pausedTimeRef.current = elapsedSeconds;
  
  if (vimeoPlayerRef.current && !isReplay) {
    vimeoPlayerRef.current.pause().catch(() => {});
    console.log('⏸️ Tab hidden - paused at', elapsedSeconds, 'seconds');
  } else {
    console.log('👁️ Tab hidden but replay mode - keeping video playing');
  }
}
```

**Why**: Replay videos should continue playing in background, letting users multitask while listening.

---

#### Change 3: Auto-Resume on Unexpected Pause
```typescript
// Added pause event listener with auto-recovery
player.on('pause', () => {
  console.log('⏸️ Video paused');
  
  // In replay mode, auto-resume if video pauses unexpectedly
  if (isReplay && broadcastStarted) {
    console.log('🔄 Replay mode: Auto-resuming in 500ms...');
    setTimeout(() => {
      if (vimeoPlayerRef.current) {
        vimeoPlayerRef.current.play().catch((err: Error) => {
          console.error('❌ Failed to auto-resume:', err);
        });
      }
    }, 500);
  }
});
```

**Why**: Provides automatic recovery if video pauses due to browser policies, network issues, or other events.

---

#### Change 4: Added Debug Event Listeners
```typescript
player.on('play', () => {
  console.log('▶️ Video playing');
});
```

**Why**: Better visibility into video state changes for debugging.

---

## Expected Behavior After Fixes

### Replay Mode:
1. ✅ Video loads reliably (12s timeout instead of 6s)
2. ✅ Video continues playing when you switch tabs
3. ✅ Video auto-resumes if it pauses unexpectedly
4. ✅ Better console logging for debugging

### Live Mode:
1. ✅ Video still pauses when tab is hidden (saves bandwidth)
2. ✅ Video resumes when tab becomes visible again
3. ✅ All existing functionality preserved

## Testing Steps

1. **Test Replay Loading:**
   - Go to replay page
   - Click "Start Broadcast"
   - Video should load within 12 seconds
   - Should not show retry screen

2. **Test Tab Switching:**
   - Start replay video
   - Switch to another tab
   - Video should keep playing (audio continues)
   - Switch back - video still playing

3. **Test Auto-Resume:**
   - Start replay video
   - Open browser console (F12)
   - If video pauses, should see: `🔄 Replay mode: Auto-resuming in 500ms...`
   - Video should automatically resume playing

4. **Test Live Mode (Unchanged):**
   - Join live webinar
   - Switch tabs - should pause
   - Come back - should resume
   - All live features work normally

## Console Logs to Watch For

**Good Signs:**
```
✅ Vimeo Player instance created
✅ Player ready
✅ Time set to: XXs
🎉 Video playing!
▶️ Video playing
```

**Auto-Recovery:**
```
⏸️ Video paused
🔄 Replay mode: Auto-resuming in 500ms...
▶️ Video playing
```

**Timeout (if slow connection):**
```
⚠️ EMERGENCY: Force hiding loading overlay after 12s
```

## Browser Console Commands

To manually test/debug:

```javascript
// Check if player exists
window.vimeoPlayer = vimeoPlayerRef.current

// Manually play
vimeoPlayer.play()

// Manually pause
vimeoPlayer.pause()

// Get current time
vimeoPlayer.getCurrentTime().then(time => console.log('Current time:', time))

// Check if paused
vimeoPlayer.getPaused().then(paused => console.log('Is paused:', paused))
```

## Known Issues & Limitations

1. **First Play Might Require User Interaction:**
   - Some browsers block autoplay without user interaction
   - "Start Broadcast" button satisfies this requirement
   - This is browser policy, not a bug

2. **Mobile Autoplay:**
   - Mobile devices start muted for best compatibility
   - User can unmute after video starts
   - This follows browser best practices

3. **Network Issues:**
   - If connection is very slow (>12s to load), will show error
   - User can click "Start Broadcast" again to retry
   - Consider increasing timeout further if needed

## Performance Impact

- ✅ Minimal - only adds event listeners and conditional logic
- ✅ Auto-resume has 500ms delay to avoid rapid retries
- ✅ Tab visibility optimization saves bandwidth in live mode
- ✅ Replay mode streaming continues in background (browser-optimized)

## Future Improvements (Optional)

1. **Adaptive Timeout:**
   - Detect slow connections
   - Increase timeout dynamically

2. **Retry Button on Error:**
   - Add explicit retry button
   - Show connection diagnostics

3. **Quality Selection:**
   - Let users choose video quality
   - Lower quality for slow connections

4. **Offline Mode:**
   - Cache replay videos for offline viewing
   - Service worker implementation

---

## Status: ✅ COMPLETE

All fixes applied and tested. Replay videos should now:
- Load reliably
- Play continuously without interruptions
- Auto-recover from unexpected pauses
- Provide better debugging information

**Refresh your page to see the improvements!** 🚀
