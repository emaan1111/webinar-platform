# Video Playback Troubleshooting Guide

## Issue: Video Not Playing on Broadcast Page

### Common Causes and Solutions

---

## 1. Check Browser Console Logs

Open your browser's Developer Tools (F12) and check the Console tab for these logs:

### Expected Logs (When Working):
```
=== Broadcast start clicked ===
Using Vimeo Player API to start video
Setting time to Xs
Starting playback...
✅ Video playing successfully
```

### Error Logs to Look For:
- `Vimeo Player API not loaded yet`
- `Vimeo iframe not found`
- `❌ Error starting video with API`
- `Could not find Vimeo iframe`

---

## 2. Verify Vimeo Video ID

### Check if Video ID exists:
1. Go to Dashboard → Webinars
2. Click on your webinar
3. Scroll to "Video Configuration" section
4. Verify **Vimeo Video ID** is filled in

### Vimeo Video ID Format:
- Should be numbers only (e.g., `123456789`)
- Get it from Vimeo URL: `https://vimeo.com/123456789`

---

## 3. Check Broadcast Overlay

### If overlay is not showing:
1. Check browser console for hydration errors
2. Verify `mounted` state is true (should happen after page loads)
3. Check if `broadcastStarted` is false (should be false initially)

### If overlay shows but click doesn't work:
1. Check console for click event logs
2. Verify Font Awesome is loaded (the play icon should be visible)
3. Check if there are any CSS z-index issues

---

## 4. Vimeo Player API Issues

### If Vimeo Player API is not loading:

**Check Network Tab:**
- Look for request to: `https://player.vimeo.com/api/player.js`
- Verify it returns 200 status

**Manual Fix:**
Add this to your browser console:
```javascript
const script = document.createElement('script');
script.src = 'https://player.vimeo.com/api/player.js';
document.head.appendChild(script);
```

---

## 5. Browser Auto-play Restrictions

Modern browsers block auto-play with sound. Solutions:

### Option A: Muted Auto-play
Change in code:
```typescript
await vimeoPlayerRef.current.setVolume(0); // Mute first
await vimeoPlayerRef.current.play();
await vimeoPlayerRef.current.setVolume(1); // Unmute after playing
```

### Option B: User Interaction
Ensure the play happens from a user click (already implemented in overlay)

---

## 6. Iframe Loading Issues

### Check if iframe loaded:
```javascript
// Run in browser console
const iframe = document.querySelector('iframe[src*="vimeo.com"]');
console.log('Iframe found:', !!iframe);
console.log('Iframe src:', iframe?.src);
```

### Expected iframe src format:
```
https://player.vimeo.com/video/123456789?autoplay=0&muted=0&controls=0&title=0&byline=0&portrait=0&sidedock=0&background=1#t=0s
```

---

## 7. SessionStorage Issues

### Check if broadcast state is being saved:
```javascript
// Run in browser console
console.log('Broadcast started:', sessionStorage.getItem('broadcast-started-{webinar-id}'));
```

### Clear sessionStorage:
```javascript
sessionStorage.clear();
location.reload();
```

---

## 8. Quick Fixes

### Fix 1: Force Reload with Autoplay
```javascript
// Run in browser console
const iframe = document.querySelector('iframe[src*="vimeo.com"]');
if (iframe) {
  iframe.src = iframe.src.replace('autoplay=0', 'autoplay=1');
}
```

### Fix 2: Manual Player Initialization
```javascript
// Run in browser console
if (window.Vimeo) {
  const iframe = document.querySelector('iframe[src*="vimeo.com"]');
  const player = new Vimeo.Player(iframe);
  player.play();
}
```

### Fix 3: Check Video Permissions
- Go to Vimeo video settings
- Verify "Privacy" is set to allow embedding
- Check if domain is whitelisted (if restricted)

---

## 9. Network/CORS Issues

### Symptoms:
- Iframe loads but video doesn't play
- CORS errors in console

### Solutions:
1. **Check Vimeo Privacy Settings:**
   - Video must allow embedding
   - Domain should be whitelisted if restrictions are set

2. **Check Browser Extensions:**
   - Disable ad blockers
   - Disable privacy extensions (Privacy Badger, etc.)
   - Try in incognito mode

---

## 10. Testing Checklist

Run through this checklist:

- [ ] Vimeo Video ID is set correctly in webinar settings
- [ ] Broadcast overlay appears on page load
- [ ] Clicking overlay shows "Broadcast start clicked" in console
- [ ] Vimeo Player API script loads successfully
- [ ] No CORS errors in console
- [ ] No hydration errors in console
- [ ] Browser allows autoplay (or user clicks overlay)
- [ ] Video iframe is present in DOM
- [ ] Video privacy settings allow embedding
- [ ] sessionStorage is working

---

## 11. Alternative: YouTube Videos

If Vimeo continues to have issues, try YouTube:

1. Go to Dashboard → Webinar Settings
2. Under "Video Configuration"
3. Enter YouTube URL instead of Vimeo
4. Format: `https://www.youtube.com/watch?v=VIDEO_ID`

---

## 12. Debug Mode

### Enable verbose logging:

Add to browser console:
```javascript
localStorage.setItem('debug_video', 'true');
location.reload();
```

This will show additional console logs for:
- Player initialization
- API calls
- State changes
- Error details

---

## 13. Common Error Messages

### "Vimeo Player not initialized"
**Cause:** Player API didn't load or initialize failed
**Fix:** Check network tab for player.js, refresh page

### "Could not find Vimeo iframe"
**Cause:** Iframe didn't render or wrong selector
**Fix:** Check if embedUrl is correct, verify video ID exists

### "Could not auto-play"
**Cause:** Browser blocking autoplay
**Fix:** Expected behavior - user must click overlay

### "Error starting video with API"
**Cause:** API method failed (time out of range, etc.)
**Fix:** Check video duration, verify timestamp is valid

---

## 14. Reporting Issues

If problem persists, collect this info:

1. **Browser & Version:**
   - Chrome/Firefox/Safari version
   
2. **Console Logs:**
   - Copy all logs from when you click "Start Broadcast"
   
3. **Webinar Settings:**
   - Vimeo Video ID
   - Video duration (if known)
   
4. **Network Tab:**
   - Any failed requests
   - Vimeo API script status
   
5. **Screenshot:**
   - The broadcast page showing the issue

---

## 15. Recent Changes (Nov 4-10, 2025)

Changes that might affect video playback:

1. **Hydration Fix:** Added `mounted` state check
   - Overlay now only shows after client-side mount
   - May delay overlay appearance by ~100ms

2. **BroadcastStarted State:** 
   - Now initializes to `false` always
   - Updates from sessionStorage after mount

3. **Suppress Hydration Warnings:**
   - Added to iframe and overlay
   - Shouldn't affect functionality

If video worked before Nov 4 but not after, the issue is likely related to these changes.

---

## Quick Restart

If all else fails:

```bash
# Stop server
Ctrl+C (in terminal)

# Clear cache and restart
rm -rf .next
npm run dev
```

Then:
1. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
2. Clear browser cache
3. Try again

---

## Support

For additional help:
1. Check the [FIXES_NOVEMBER_4_2025.md](./FIXES_NOVEMBER_4_2025.md) for recent changes
2. Review [LIVE_WEBINAR_FIXES_COMPLETE.md](./LIVE_WEBINAR_FIXES_COMPLETE.md)
3. Check [SIMULATED_LIVE_FIXES_COMPLETE.md](./SIMULATED_LIVE_FIXES_COMPLETE.md)
