# Countdown Template Fixes

## Issues Found:
1. Unmute button not clickable (z-index issue)
2. Video overlay covering the unmute prompt
3. Countdown not updating (script placement)

## CSS Fixes Needed:

### 1. Fix Unmute Prompt Z-Index
```css
.unmute-prompt {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);  /* Changed from 0.7 to 0.9 */
    color: var(--white);
    padding: 15px 25px;  /* Increased padding */
    border-radius: 30px;
    font-size: 1rem;  /* Increased from 0.9rem */
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 100;  /* Changed from 10 to 100 */
    opacity: 1;
    pointer-events: auto;
}
```

### 2. Fix Video Overlay Z-Index
```css
.video-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--white);
    background: rgba(0, 0, 0, 0.3);
    transition: opacity 0.3s ease;
    z-index: 1;  /* Add this */
    pointer-events: none;  /* Add this so it doesn't block clicks */
}
```

### 3. Fix Video Controls Z-Index
```css
.video-controls {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
    padding: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 50;  /* Add this - lower than unmute prompt */
}
```

### 4. Fix Video Wrapper Stacking
```css
.video-wrapper {
    position: relative;
    width: 100%;
    height: 0;
    padding-bottom: 56.25%;
    overflow: hidden;
    isolation: isolate;  /* Add this to create new stacking context */
}
```

## JavaScript Fixes:

### Better Unmute Handler
```javascript
// Unmute prompt click - Improved version
if (unmutePrompt) {
    unmutePrompt.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Unmute button clicked!');
        video.muted = false;
        updateMuteBtn();
    }, { capture: true });  // Use capture phase
}
```

## Testing:
1. Open browser console
2. Check if "Unmute button clicked!" appears when you click
3. If not, the element is still being blocked
4. Use browser dev tools to inspect the unmute prompt element
5. Check its computed z-index and whether pointer-events is auto
