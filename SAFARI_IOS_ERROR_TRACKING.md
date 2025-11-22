# Safari iOS Video Loading - Enhanced Error Tracking 🍎

## Problem

Safari iOS users experiencing video loading failures, but **errors were not being reported** to the database, making it impossible to diagnose the issues.

## Root Cause

Safari iOS has unique behavior that wasn't being captured:

1. **Silent failures** - Safari may fail without throwing catchable errors
2. **Autoplay restrictions** - Stricter than other browsers, even with muted videos
3. **Low Power Mode** - Can block video playback entirely
4. **iframe sandboxing** - More aggressive than Chrome/Firefox
5. **Promise handling** - May resolve/reject differently than other browsers

## Solution

Added **Safari iOS-specific error tracking** throughout the entire video initialization pipeline with aggressive logging at every step.

## What's Now Being Tracked

### Safari iOS Detection
```typescript
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isSafariIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
```

### New Safari-Specific Error Types

| Error Type | When Logged | What It Means |
|---|---|---|
| `safari_ios_init_attempt` | Start of initialization | Video init process started |
| `safari_ios_player_ready` | Player.ready() resolves | Vimeo API initialized successfully |
| `safari_ios_mute_failed` | Mute operation fails | Can't set muted=true (critical) |
| `safari_ios_seek_failed` | setCurrentTime() fails | Can't seek to start position |
| `safari_ios_play_attempt` | Before play() call | About to attempt playback |
| `safari_ios_play_success` | Play() succeeds | Video actually playing |
| `safari_ios_play_failed` | Play() rejects | Autoplay blocked or other issue |
| `safari_ios_init_failed` | Player.ready() rejects | Complete initialization failure |

### Lifecycle Tracking

Every Safari iOS video initialization now logs these events:

```
1. safari_ios_init_attempt    ← "We're starting"
2. safari_ios_player_ready     ← "Player API is ready"
3. safari_ios_play_attempt     ← "About to play"
4. safari_ios_play_success     ← "Successfully playing"
   OR
4. safari_ios_play_failed      ← "Play was blocked/failed"
```

This gives **complete visibility** into where Safari iOS fails.

## Implementation Details

### 1. Extended Timeout for Safari iOS

```typescript
// Safari iOS gets 90 seconds (vs 60s mobile, 20s desktop)
const timeoutDuration = isSafariIOS ? 90000 : (isMobileDevice ? 60000 : 20000);
```

**Why:** Safari iOS is slower to initialize due to strict security policies.

### 2. Initialization Logging

```typescript
if (isSafariIOS) {
  console.log('🍎 Safari iOS detected - applying special error handling');
  logVideoError(webinar.id, viewer?.id, 'safari_ios_init_attempt', 
    'Safari iOS video initialization started', undefined, {
      name: viewer?.name,
      email: viewer?.email,
    }
  );
}
```

### 3. Player Ready Event

```typescript
player.ready().then(async () => {
  if (isSafariIOS) {
    console.log('🍎 Safari iOS: Player ready() resolved successfully');
    logVideoError(webinar.id, viewer?.id, 'safari_ios_player_ready', 
      'Safari iOS: Player ready() resolved successfully', undefined, {
        name: viewer?.name,
        email: viewer?.email,
      }
    );
  }
  // ... continue initialization
});
```

### 4. Mute Operation Tracking

```typescript
try {
  if (isSafariIOS) {
    console.log('🍎 Safari iOS: Attempting to mute video');
  }
  await player.setMuted(true);
  await player.setVolume(0);
  
  if (isSafariIOS) {
    console.log('🍎 Safari iOS: Video muted successfully');
  }
} catch (e) {
  if (isSafariIOS) {
    console.error('🍎 Safari iOS: Failed to mute video', e);
    logVideoError(webinar.id, viewer?.id, 'safari_ios_mute_failed',
      `Safari iOS failed to mute: ${e.message}`, e.stack, {
        name: viewer?.name,
        email: viewer?.email,
      }
    );
  }
  throw new Error('Failed to mute video - autoplay will fail');
}
```

### 5. Seek Operation Tracking

```typescript
try {
  if (isSafariIOS) {
    console.log(`🍎 Safari iOS: Setting time to ${startTime}s`);
  }
  await player.setCurrentTime(startTime);
  
  if (isSafariIOS) {
    console.log(`🍎 Safari iOS: Time set successfully`);
  }
} catch (e) {
  if (isSafariIOS) {
    logVideoError(webinar.id, viewer?.id, 'safari_ios_seek_failed',
      `Safari iOS failed to seek: ${e.message}`, e.stack, {
        name: viewer?.name,
        email: viewer?.email,
      }
    );
  }
}
```

### 6. Play Attempt and Success

```typescript
try {
  if (isSafariIOS) {
    console.log('🍎 Safari iOS: Calling player.play()...');
    logVideoError(webinar.id, viewer?.id, 'safari_ios_play_attempt',
      'Safari iOS: About to call player.play()', undefined, {
        name: viewer?.name,
        email: viewer?.email,
      }
    );
  }
  
  await player.play();
  
  if (isSafariIOS) {
    console.log('🍎 Safari iOS: Video playing successfully!');
    logVideoError(webinar.id, viewer?.id, 'safari_ios_play_success',
      'Safari iOS: Video play() succeeded', undefined, {
        name: viewer?.name,
        email: viewer?.email,
      }
    );
  }
} catch (playErr) {
  if (isSafariIOS) {
    console.error('🍎 Safari iOS: Play failed', playErr);
    logVideoError(webinar.id, viewer?.id, 'safari_ios_play_failed',
      errorMsg, playErr.stack, {
        name: viewer?.name,
        email: viewer?.email,
      }
    );
  }
}
```

### 7. Enhanced Device Context

```typescript
console.error('📱 Device info:', {
  userAgent: navigator.userAgent,
  isMobile: isMobileDevice,
  isSafari,
  isSafariIOS,  // ← NEW
  screen: `${window.screen.width}x${window.screen.height}`,
  window: `${window.innerWidth}x${window.innerHeight}`,
  documentHidden: document.hidden,  // ← NEW
  documentVisibility: document.visibilityState,  // ← NEW
});
```

### 8. Video Player Events

Added event listeners for Safari debugging:

```typescript
// Track video loading
player.on('loaded', () => {
  console.log('📦 Video metadata loaded');
  if (isSafariIOS) {
    console.log('🍎 Safari iOS: Video loaded event fired');
  }
});

// Track buffering (important for Safari on slow connections)
player.on('bufferstart', () => {
  console.log('⏳ Video buffering started');
  if (isSafariIOS) {
    console.log('🍎 Safari iOS: Buffering started');
  }
});

player.on('bufferend', () => {
  console.log('✅ Video buffering ended');
  if (isSafariIOS) {
    console.log('🍎 Safari iOS: Buffering ended');
  }
});
```

## Console Output Examples

### Successful Safari iOS Load
```
🍎 Safari iOS detected - applying special error handling
🎯 Starting player initialization process...
📱 Device detection: {
  isMobile: true,
  isSafari: true,
  isSafariIOS: true,
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0..."
}
🎬 Creating Vimeo Player instance...
✅ Vimeo Player instance created
✅ Player ready
🍎 Safari iOS: Player ready() resolved successfully
📦 Video metadata loaded
🍎 Safari iOS: Video loaded event fired
🔇 Setting muted=true for autoplay compliance...
🍎 Safari iOS: Attempting to mute video
✅ Video muted successfully
🍎 Safari iOS: Video muted successfully
🍎 Safari iOS: Setting time to 0s
✅ Time set to: 0s
🍎 Safari iOS: Time set successfully to 0s
🎮 Attempting to play video (muted)...
🍎 Safari iOS: Calling player.play()...
🎉 Video playing successfully!
🍎 Safari iOS: Video playing successfully!
```

### Failed Safari iOS Load (Play Blocked)
```
🍎 Safari iOS detected - applying special error handling
🎯 Starting player initialization process...
... [initialization successful] ...
🎮 Attempting to play video (muted)...
🍎 Safari iOS: Calling player.play()...
❌ Play failed: NotAllowedError: The request is not allowed
🍎 Safari iOS: Play failed with error: NotAllowedError
🍎 Safari iOS: Additional context: {
  lowPowerMode: "checking...",
  connection: "4g",
  documentHidden: false,
  documentVisibility: "visible"
}
🚨 Logging video error: {
  errorType: 'safari_ios_play_failed',
  device: 'Mobile',
  viewer: 'John Smith',
  message: "Play failed: NotAllowedError: The request is not allowed"
}
```

## Query Safari iOS Errors

### See all Safari iOS error sequences
```sql
SELECT 
  viewer_email,
  viewer_name,
  error_type,
  error_message,
  created_at
FROM video_error_logs
WHERE error_type LIKE 'safari_ios_%'
ORDER BY viewer_email, created_at;
```

### Find where Safari users are failing
```sql
WITH safari_errors AS (
  SELECT 
    viewer_email,
    error_type,
    ROW_NUMBER() OVER (PARTITION BY viewer_email ORDER BY created_at) as step
  FROM video_error_logs
  WHERE error_type LIKE 'safari_ios_%'
    AND created_at > NOW() - INTERVAL '1 day'
)
SELECT 
  error_type,
  COUNT(*) as users_failed_at_this_step,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(DISTINCT viewer_email) FROM safari_errors), 2) as pct_of_safari_users
FROM safari_errors
WHERE step = (SELECT MAX(step) FROM safari_errors se2 WHERE se2.viewer_email = safari_errors.viewer_email)
GROUP BY error_type
ORDER BY users_failed_at_this_step DESC;
```

### Safari users who got to play attempt but failed
```sql
SELECT 
  viewer_email,
  viewer_name,
  error_message,
  device_info,
  created_at
FROM video_error_logs
WHERE error_type = 'safari_ios_play_failed'
  AND viewer_email IN (
    SELECT viewer_email FROM video_error_logs 
    WHERE error_type = 'safari_ios_play_attempt'
  )
ORDER BY created_at DESC;
```

### Safari success rate
```sql
SELECT 
  COUNT(DISTINCT CASE WHEN error_type = 'safari_ios_play_success' THEN viewer_email END) as successful,
  COUNT(DISTINCT CASE WHEN error_type = 'safari_ios_play_failed' THEN viewer_email END) as failed,
  COUNT(DISTINCT viewer_email) as total,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN error_type = 'safari_ios_play_success' THEN viewer_email END) / 
    COUNT(DISTINCT viewer_email), 2) as success_rate
FROM video_error_logs
WHERE error_type LIKE 'safari_ios_%'
  AND created_at > NOW() - INTERVAL '7 days';
```

## Common Safari iOS Issues

### Issue 1: Low Power Mode
**Symptom:** `safari_ios_play_failed` with "NotAllowedError"  
**Cause:** iOS Low Power Mode blocks video autoplay  
**Solution:** User must disable Low Power Mode or tap to play manually

### Issue 2: Autoplay Policy
**Symptom:** `safari_ios_play_failed` immediately after `safari_ios_play_attempt`  
**Cause:** Safari requires user interaction for first play  
**Solution:** Ensure video starts from user tap, not page load

### Issue 3: iframe Blocked
**Symptom:** `safari_ios_init_failed` or timeout  
**Cause:** Content blocker or restrictive Safari settings  
**Solution:** User must allow cross-site tracking or disable content blockers

### Issue 4: Memory Pressure
**Symptom:** Random `safari_ios_play_failed` after buffering events  
**Cause:** Safari killed video due to low memory  
**Solution:** Close other tabs, refresh page

### Issue 5: Network Issues
**Symptom:** Multiple `bufferstart` events, then `safari_ios_play_failed`  
**Cause:** Slow or unreliable connection  
**Solution:** Better WiFi or wait for better signal

## Testing on Safari iOS

### Test 1: Normal Load
1. Open webinar on iPhone Safari
2. Tap "Start Broadcast"
3. Check console logs
4. **Expected:** See all 4 success events logged

### Test 2: Low Power Mode
1. Enable Low Power Mode (Settings → Battery)
2. Try to start video
3. **Expected:** `safari_ios_play_failed` logged

### Test 3: Content Blockers
1. Enable content blocker
2. Try to start video
3. **Expected:** `safari_ios_init_failed` or `iframe_load_error`

### Test 4: Background Tab
1. Start video
2. Switch tabs immediately
3. Return to webinar tab
4. **Expected:** Logging shows pause/resume cycle

## Files Modified

- `/src/app/w/[slug]/live/page-client.tsx`
  - Added Safari/Safari iOS detection
  - Added 8 new Safari-specific error types
  - Extended timeout to 90s for Safari iOS
  - Added comprehensive logging at each step
  - Enhanced device context logging

## Documentation

- `SAFARI_IOS_ERROR_TRACKING.md` (this file)

## Result

**Complete visibility** into Safari iOS video loading! 🎯

Now you can:
- 🔍 See exactly where Safari users are failing
- 📊 Track success/failure rates
- 💬 Contact users with specific solutions
- 🔧 Identify patterns (Low Power Mode, network issues, etc.)
- 🚀 Improve Safari iOS compatibility

Every step of the video initialization is logged with Safari-specific error types, making it easy to diagnose and fix iOS-specific issues! 🍎✨
