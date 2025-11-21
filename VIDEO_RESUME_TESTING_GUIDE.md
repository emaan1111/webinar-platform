# Testing Video Resume Button - Step by Step Guide

## Quick Test (2 minutes)

### Mobile Test
1. **Open webinar** on your mobile device (phone browser)
2. **Start video** - Tap the "Start Broadcast" button
3. **Wait 5 seconds** - Let video play briefly
4. **Switch tabs** - Open another app or browser tab
5. **Wait 3 seconds** - Let tab change take effect
6. **Return to webinar** - Switch back to the webinar tab
7. **✅ VERIFY: You should see:**
   - Large play button icon (▶️)
   - Text: "Tap to Resume"
   - Subtitle explaining video was paused
8. **Tap the overlay** - Click anywhere on the overlay
9. **✅ VERIFY: Video should:**
   - Resume playing from where it paused
   - Overlay disappears
   - Video continues normally

### Desktop Test (Verify Unchanged)
1. **Open webinar** on desktop browser
2. **Start video** - Click "Start Broadcast"
3. **Switch tabs** - Open new tab or switch windows
4. **Return to webinar** - Go back to webinar tab
5. **✅ VERIFY: Video should:**
   - Auto-resume playing (no overlay)
   - Continue from where it paused
   - No manual intervention needed

## Detailed Test Scenarios

### Scenario 1: Check WhatsApp Message
**Story:** User is watching webinar, gets WhatsApp notification, checks message, returns

**Steps:**
1. Start video on mobile
2. Get notification → Switch to WhatsApp
3. Read message (10-20 seconds)
4. Return to webinar tab

**Expected Result:**
- Resume overlay appears immediately
- User taps overlay
- Video continues seamlessly
- ✅ Good user experience

### Scenario 2: Quick Tab Switch
**Story:** User accidentally switches tabs and quickly returns

**Steps:**
1. Start video on mobile
2. Accidentally tap browser tabs button
3. Immediately return (< 2 seconds)

**Expected Result:**
- Resume overlay still appears (consistent behavior)
- User taps to resume
- Video continues with minimal interruption
- ✅ Consistent UX

### Scenario 3: Long Absence
**Story:** User starts video, switches away for 5+ minutes, returns

**Steps:**
1. Start video on mobile
2. Switch to another app
3. Do something else (5+ minutes)
4. Return to webinar tab

**Expected Result:**
- Resume overlay appears
- User taps overlay
- Video resumes from paused position (or may need sync)
- ✅ Clear state recovery

### Scenario 4: Before Video Starts
**Story:** User hasn't started video yet, switches tabs

**Steps:**
1. Open webinar (don't start video)
2. Switch tabs
3. Return to webinar tab

**Expected Result:**
- Resume overlay should NOT appear
- Regular "Start Broadcast" button shown
- ✅ Correct conditional rendering

### Scenario 5: Video Ended
**Story:** Video finishes, user switches tabs, returns

**Steps:**
1. Watch video until it ends (or skip to end)
2. Wait for "Webinar Ended" screen
3. Switch tabs
4. Return to webinar tab

**Expected Result:**
- Resume overlay should NOT appear
- "Webinar Ended" overlay shown
- ✅ Correct priority logic

### Scenario 6: Replay Mode
**Story:** User is watching replay, switches tabs

**Steps:**
1. Open webinar replay
2. Start replay video
3. Switch tabs
4. Return to replay

**Expected Result:**
- Resume overlay appears
- User taps overlay
- Replay continues from paused position
- ✅ Works in replay mode too

## Edge Case Testing

### Test 1: Rapid Tab Switching
**Action:** Switch tabs 5 times rapidly (back and forth)
**Expected:** Overlay appears/disappears smoothly, no flickering or crashes

### Test 2: Network Issues
**Action:** Start video → Switch tabs → Disable network → Return to tab
**Expected:** Resume overlay appears, tapping may fail gracefully with error

### Test 3: Multiple Videos
**Action:** If page has multiple videos, test with each
**Expected:** Each video independently manages its paused state

### Test 4: Portrait/Landscape
**Action:** Switch between portrait and landscape while video paused
**Expected:** Overlay remains visible and functional in both orientations

### Test 5: Low Battery Mode
**Action:** Enable low battery mode → Test tab switching
**Expected:** Overlay appears and resume works (may be slower)

## Browser Compatibility Testing

Test on these browsers/devices:

### iOS
- [ ] Safari (latest)
- [ ] Safari (iOS 14+)
- [ ] Chrome iOS
- [ ] Firefox iOS

### Android
- [ ] Chrome Android (latest)
- [ ] Chrome Android (older version)
- [ ] Firefox Android
- [ ] Samsung Internet
- [ ] Edge Android

### Desktop (Verify Unchanged)
- [ ] Chrome Desktop
- [ ] Safari Desktop
- [ ] Firefox Desktop
- [ ] Edge Desktop

## What to Look For

### ✅ Good Signs
- Overlay appears immediately when returning to tab
- Play button is large and clearly visible
- Text is readable and makes sense
- Tapping anywhere on overlay resumes video
- Overlay disappears smoothly after tap
- Video continues from correct position
- No console errors

### ❌ Bad Signs (Report These)
- Overlay doesn't appear after tab switch
- Overlay appears when it shouldn't
- Tapping doesn't resume video
- Video restarts instead of resuming
- Overlay flickers or stutters
- Console errors appear
- Video loses position
- Multiple overlays stack on top of each other

## Performance Checks

### Memory
- Open DevTools → Memory tab
- Start video → Switch tabs 10 times → Return
- Check memory usage - should be stable (no leaks)

### CPU
- Open DevTools → Performance tab
- Record profile during tab switch
- Check for expensive operations - should be minimal

### Network
- Open DevTools → Network tab
- Switch tabs → Return
- Check for unnecessary requests - should be none

## Console Messages

Expected console logs:

```
When tab becomes hidden:
⏸️ Tab hidden - paused at X seconds

When tab becomes visible (mobile):
👁️ Tab visible
📱 Mobile: Video paused - user must manually resume

When user taps resume:
▶️ User clicked to resume video after tab switch
✅ Video resumed successfully
```

## Automated Testing (Future)

Cypress test skeleton:

```javascript
describe('Video Resume on Tab Switch', () => {
  it('shows resume overlay on mobile after tab switch', () => {
    cy.viewport('iphone-x');
    cy.visit('/w/test-webinar/live');
    cy.contains('Start Broadcast').click();
    cy.wait(3000);
    
    // Simulate tab hide/show
    cy.document().then(doc => {
      Object.defineProperty(doc, 'hidden', { value: true, writable: true });
      doc.dispatchEvent(new Event('visibilitychange'));
    });
    
    cy.wait(1000);
    
    cy.document().then(doc => {
      Object.defineProperty(doc, 'hidden', { value: false, writable: true });
      doc.dispatchEvent(new Event('visibilitychange'));
    });
    
    // Verify overlay appears
    cy.contains('Tap to Resume').should('be.visible');
    
    // Click to resume
    cy.contains('Tap to Resume').click();
    
    // Verify overlay disappears
    cy.contains('Tap to Resume').should('not.exist');
  });
});
```

## Rollback Plan

If issues are found:

### Quick Rollback
Remove the paused overlay feature:
1. Set `showPausedOverlay` to always be `false`
2. Or comment out the overlay rendering code
3. System reverts to previous behavior (frozen screen)

### Partial Rollback
Keep overlay but disable on certain conditions:
```typescript
// Example: Only show for certain users
if (showPausedOverlay && isMobile && !isBetaUser) {
  // Show overlay
}
```

## Success Metrics

After deployment, monitor:
- **Video completion rate** - Should improve
- **User session duration** - Should improve
- **Page refresh rate** - Should decrease
- **Support tickets** - Fewer "video frozen" complaints
- **User feedback** - More positive comments

## Reporting Issues

If you find a bug, please report:
1. **Device:** iPhone 12, Android S21, etc.
2. **Browser:** Safari, Chrome, etc.
3. **Steps to reproduce:** Exact sequence of actions
4. **Expected result:** What should happen
5. **Actual result:** What actually happened
6. **Screenshots:** If possible
7. **Console logs:** Any errors shown

## Questions?

- **Q: Does this work on iPad?**  
  A: Yes, if user agent is detected as mobile

- **Q: What if user has autoplay disabled?**  
  A: Overlay will show, resume attempt may fail, user can retry

- **Q: Does this work in incognito mode?**  
  A: Yes, no storage dependencies

- **Q: Will this affect desktop users?**  
  A: No, desktop behavior unchanged (auto-resume)

- **Q: What if JavaScript is disabled?**  
  A: Video won't work anyway (Vimeo requires JS)

## Ready to Test! 🚀

**Time needed:** 10-15 minutes for comprehensive testing  
**Minimum test:** 2 minutes for quick mobile verification

Happy testing! If you encounter any issues, refer to the documentation:
- `VIDEO_PAUSE_TAB_SWITCH_FIX.md` - Technical details
- `VIDEO_RESUME_VISUAL_GUIDE.md` - Visual diagrams
- `VIDEO_RESUME_SUMMARY.md` - Quick overview
