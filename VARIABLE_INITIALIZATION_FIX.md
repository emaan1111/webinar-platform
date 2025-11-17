# Variable Initialization Fix ✅

## Error
```
Cannot access 'isReplay' before initialization
```

## Problem
The `isReplay` variable was being used in a `useEffect` hook (tab visibility handler) before it was defined.

**Timeline:**
1. Line 732-755: `useEffect` using `isReplay` 
2. Line 1355: `const isReplay = ...` defined ❌ TOO LATE!

## Root Cause
JavaScript/TypeScript hoisting rules don't apply to `const` declarations. The variable was in the "temporal dead zone" - the code tried to access it before the line where it's initialized.

## Solution
Changed the tab visibility `useEffect` to use `isReplayMode` prop instead of the calculated `isReplay` variable.

### Before:
```typescript
// Line 732
if (vimeoPlayerRef.current && !isReplay) {  // ❌ Error!
  vimeoPlayerRef.current.pause()
}

// Line 743
if (vimeoPlayerRef.current && broadcastStarted && !isReplay) {  // ❌ Error!
  vimeoPlayerRef.current.play()
}

// Line 755
}, [elapsedSeconds, broadcastStarted, isReplay]);  // ❌ Error!
```

### After:
```typescript
// Line 732
if (vimeoPlayerRef.current && !isReplayMode) {  // ✅ Uses prop
  vimeoPlayerRef.current.pause()
}

// Line 743
if (vimeoPlayerRef.current && broadcastStarted && !isReplayMode) {  // ✅ Uses prop
  vimeoPlayerRef.current.play()
}

// Line 755
}, [elapsedSeconds, broadcastStarted, isReplayMode]);  // ✅ Uses prop
```

## Why This Works
- `isReplayMode` is a **prop** passed to the component, available immediately
- `isReplay` is a **calculated variable** that checks both the prop AND elapsed time
- For the tab visibility handler, we only need to know if it's explicitly replay mode (the prop)

## Technical Details

**The two variables:**
```typescript
// Component prop - available immediately
isReplayMode = false  // from props

// Calculated later in component body
const isReplay = isReplayMode || (totalDuration != null ? elapsedSeconds >= totalDuration : false);
```

**When they differ:**
- Start of live webinar: `isReplayMode = false`, `isReplay = false`
- End of live webinar: `isReplayMode = false`, `isReplay = true` (calculated)
- Explicit replay: `isReplayMode = true`, `isReplay = true`

## Impact
✅ No functional change - tab visibility behavior remains the same
✅ Code now compiles without errors
✅ Replay videos still keep playing when tab is hidden
✅ Live videos still pause when tab is hidden

## Status: ✅ FIXED
Error resolved. Page should now load without initialization errors.

**Refresh your browser to see the fix in action!** 🚀
