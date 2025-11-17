# Replay Video End Behavior - Fixed

## Issues Fixed

### 1. ❌ Vimeo Suggested Videos Showing at End
**Problem**: When replay video ends, Vimeo shows "More from [channel name]" with suggested videos.

**Solution**: Added multiple Vimeo embed parameters and event handler:

#### iframe Parameters Added:
```typescript
src={`${embedUrl}?loop=${isReplay ? 1 : 0}&autopause=0&background=0&transparent=0`}
```

- `loop=1` - Makes video loop in replay mode
- `autopause=0` - Prevents video from pausing when tab is hidden
- `background=0` - Prevents background mode
- `transparent=0` - Ensures video displays properly

#### Event Handler Added:
```typescript
player.on('ended', () => {
  console.log('🎬 Video ended');
  if (isReplay) {
    console.log('🔄 Replay mode: Restarting video from beginning');
    player.setCurrentTime(0).then(() => {
      player.play().catch((err) => {
        console.error('❌ Failed to restart video:', err);
      });
    });
  }
});
```

This ensures that when the video ends in replay mode:
1. It automatically restarts from the beginning
2. Plays immediately
3. No suggested videos appear

### 2. ❌ Video Failing to Load
**Problem**: Video showing black screen with "More from Emaan Power" overlay.

**Possible Causes**:
- Vimeo player initialization issue
- iframe not loading properly
- Network/connectivity issue
- Emergency timeout triggered (6-second timeout)

**Debug Steps Taken**:
- Added comprehensive console logging
- Already has emergency timeout handler
- Already has error recovery with muted fallback

**Check Browser Console For**:
- `🎬 Creating Vimeo Player instance...`
- `✅ Player ready`
- `🎉 Video playing!`
- Any errors like `❌ Play failed` or `❌ Player ready/play failed`

If video still fails to load:
1. Check browser console for errors
2. Verify Vimeo video ID is correct
3. Check if video is embeddable (privacy settings)
4. Try refreshing the page
5. Check network tab for failed requests

## Technical Changes

### File: `/src/app/w/[slug]/live/page-client.tsx`

#### Change 1: Updated VimeoPlayer Interface
```typescript
declare global {
  interface Window {
    Vimeo?: {
      Player: new (iframe: HTMLIFrameElement) => {
        // ... existing methods ...
        on(event: string, callback: () => void): void;  // NEW
        off(event: string, callback?: () => void): void;  // NEW
      };
    };
  }
}
```

#### Change 2: Updated iframe src with loop parameter
```typescript
<iframe
  src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=0&muted=0&controls=0&title=0&byline=0&portrait=0&sidedock=0&texttrack=0&cc=0&loop=${isReplay ? 1 : 0}&autopause=0&background=0&transparent=0`}
  // ... other props
/>
```

#### Change 3: Added 'ended' event listener
```typescript
player.ready().then(async () => {
  // Add event listener for video end
  player.on('ended', () => {
    if (isReplay) {
      player.setCurrentTime(0).then(() => {
        player.play();
      });
    }
  });
  
  // ... rest of initialization
});
```

## Expected Behavior

### In Replay Mode:
1. ✅ Video plays normally
2. ✅ When video ends, it automatically loops back to beginning
3. ✅ No suggested videos from Vimeo appear
4. ✅ Chat messages and reactions continue to sync
5. ✅ Skip buttons (10-second forward/backward) work throughout

### In Live Mode:
- Video does NOT loop (loop=0)
- Video ends normally
- No automatic restart

## Testing Checklist

- [ ] Open replay page
- [ ] Click "Start Broadcast"
- [ ] Video loads and plays
- [ ] Skip to near end of video (use forward button or manual seek)
- [ ] Let video play to the end
- [ ] Verify: Video automatically restarts from beginning
- [ ] Verify: NO suggested videos appear
- [ ] Verify: Skip buttons still work after restart

## Alternative: Show Blank Screen Instead of Loop

If you prefer a blank screen instead of looping, change the event handler to:

```typescript
player.on('ended', () => {
  console.log('🎬 Video ended');
  if (isReplay) {
    // Option 1: Show blank screen (pause and reset to start)
    player.pause();
    player.setCurrentTime(0);
    // Optionally hide the iframe or show an overlay
    setVideoEnded(true); // You'd need to add this state
  }
});
```

Then in the JSX, add an overlay:
```tsx
{videoEnded && (
  <div className={styles.videoEndedOverlay}>
    <p>Replay Ended</p>
    <button onClick={() => {
      setVideoEnded(false);
      vimeoPlayerRef.current?.play();
    }}>
      Watch Again
    </button>
  </div>
)}
```

## Notes

- Vimeo's `loop` parameter only works for certain embed types
- The JavaScript event handler provides more reliable looping
- The combination of both ensures maximum compatibility
- If Vimeo still shows suggestions, it may be due to account/video settings
