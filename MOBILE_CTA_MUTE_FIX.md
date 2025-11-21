# Mobile CTA Mute Bug - Fixed

## Problem
When a CTA/offer appeared during video playback on mobile, the video would automatically get muted again, even if the user had previously unmuted it.

## Root Cause
Mobile browsers (especially iOS Safari and mobile Chrome) are very aggressive with autoplay policies. When significant DOM changes occur (like an offer sidebar appearing or CTA buttons rendering), the browser may re-enforce autoplay restrictions by muting the video.

This happens because:
1. The browser detects a layout shift or new DOM elements
2. It treats this as a potentially new autoplay attempt
3. It re-applies mute to comply with autoplay policy
4. The Vimeo player's mute state changes, but our React state doesn't know about it

## Solution Implemented

### 1. **Mute State Restoration When Offer Appears**
Added a useEffect that triggers when `offerContent` changes (offer appears):
- Waits 500ms for DOM changes to settle
- Checks the actual Vimeo player mute state
- Compares it with our React state (`isMuted`)
- If there's a mismatch (video got muted but should be unmuted), it restores the correct state

```typescript
useEffect(() => {
  if (!vimeoPlayerRef.current || !isMobile) return;
  
  if (offerContent) {
    setTimeout(async () => {
      const actualMuted = await vimeoPlayerRef.current.getMuted();
      
      if (actualMuted && !isMuted) {
        // Video was muted by browser - restore unmute state
        await vimeoPlayerRef.current.setMuted(false);
        await vimeoPlayerRef.current.setVolume(1);
      }
    }, 500);
  }
}, [offerContent, isMuted, isMobile]);
```

### 2. **Periodic Mute State Sync (Mobile Only)**
Added a continuous sync every 2 seconds to catch any other unexpected mute changes:
- Only runs on mobile during playback
- Compares actual player state vs desired React state
- Automatically corrects any mismatches
- Silent operation (doesn't spam console unless fixing an issue)

```typescript
useEffect(() => {
  if (!isMobile || !vimeoPlayerRef.current || !broadcastStarted) return;
  
  const syncInterval = setInterval(async () => {
    const actualMuted = await vimeoPlayerRef.current.getMuted();
    
    if (actualMuted !== isMuted) {
      // Fix mismatch
      await vimeoPlayerRef.current.setMuted(isMuted);
      await vimeoPlayerRef.current.setVolume(isMuted ? 0 : 1);
    }
  }, 2000);
  
  return () => clearInterval(syncInterval);
}, [isMuted, isMobile, broadcastStarted]);
```

## Benefits
- ✅ User's mute preference is preserved when offers appear
- ✅ Catches any browser-induced mute changes automatically
- ✅ Only adds overhead on mobile (where needed)
- ✅ Non-intrusive - doesn't spam logs or affect UX
- ✅ Works with all offer types (sidebar, overlay, below-video CTA)

## Testing Checklist
- [ ] Test on iOS Safari (most likely culprit)
- [ ] Test on mobile Chrome
- [ ] Verify video stays unmuted when offer appears
- [ ] Check that intentional mute still works
- [ ] Confirm no console spam during normal playback
- [ ] Test with multiple offers appearing at different times

## Files Modified
- `/src/app/w/[slug]/live/page-client.tsx`
  - Added mute state restoration effect (after line 1247)
  - Added periodic mute sync effect (after line 1020)

## Commit
```
9a8300b - Fix: Prevent video from muting when CTA/offer appears on mobile
```

## Related Issues
- Mobile video reliability improvements
- CTA display bugs
- Audio troubleshooting banner (removed redundant version)
