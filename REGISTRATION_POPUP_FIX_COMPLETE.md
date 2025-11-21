# Registration Popup Fix - Complete ✅

## Problem
Registration buttons with `onclick="openModal()"` were not working because:
1. The system was removing ALL `<script>` tags from custom HTML
2. The auto-convert feature was removing `onclick` handlers
3. The `openModal()` function defined in the HTML was being stripped out

## Solution Implemented

### 1. **Preserve Scripts in Page Rendering** ✅
**File:** `src/app/w/[slug]/page-client.tsx`

**Changed:**
- Removed the line that strips ALL script tags
- Now keeps inline scripts including countdown timers, modal functions, etc.

```typescript
// BEFORE (line 1086):
templateHtml = templateHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

// AFTER:
// DON'T remove script tags - they contain modal functions like openModal()
// Only remove external tracking scripts if needed
// templateHtml = templateHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
```

### 2. **Provide Global `openModal()` Function** ✅
**File:** `src/app/w/[slug]/page-client.tsx`

**Added:**
- Global `window.openModal` function that opens the React modal
- Global `window.closeModal` function
- These are created in a `useEffect` hook on page load

```typescript
// Define global openModal function for inline onclick handlers
(window as any).openModal = () => {
  console.log('[Registration] openModal() called')
  setShowScheduleModal(true)
};

(window as any).closeModal = () => {
  console.log('[Registration] closeModal() called')
  setShowScheduleModal(false)
};
```

### 3. **Update Auto-Convert to Preserve `openModal()`** ✅
**File:** `src/lib/externalHtmlProcessor.ts`

**Updated functions:**

#### `convertOnClickHandlers()`
- **BEFORE:** Removed ALL onclick handlers and replaced with `data-webinar-trigger`
- **AFTER:** Preserves `onclick="openModal()"` and converts others TO `openModal()`

```typescript
// PRESERVE onclick="openModal()" - our system will provide this function
if (onClickAttr.includes('openModal')) {
  console.log(`Preserving onclick="openModal()": ${el.tagName}#${el.id}`);
  return; // Don't modify this button
}

// Convert OTHER onclick patterns to openModal()
if (matchesPattern) {
  el.setAttribute('onclick', 'openModal()');
}
```

#### `processHtmlString()` (Server-side fallback)
- **BEFORE:** Removed onclick handlers and popup functions
- **AFTER:** Converts old handlers to `openModal()` and preserves them

```typescript
// Convert OLD onclick handlers to openModal()
processed = processed.replace(
  /onclick\s*=\s*["'](?:showPopup|showRegistration|openRegistration|showModal)\s*\(\s*\)[^"']*["']/gi,
  'onclick="openModal()"'
);

// DON'T remove openModal/closeModal functions
processed = processed.replace(
  /function\s+(?:showPopup|hidePopup|showRegistration|hideRegistration)\s*\([^)]*\)\s*\{[^}]*\}/gi,
  ''
);
```

#### `cleanupScripts()`
- **BEFORE:** Removed all popup-related scripts
- **AFTER:** Preserves `openModal/closeModal` but removes conflicting OLD functions

```typescript
// DON'T remove scripts that define openModal or closeModal
if (scriptContent.includes('function openModal') || scriptContent.includes('function closeModal')) {
  console.log('Preserving openModal/closeModal script - React will provide these');
  // Replace function definitions with comments
  cleanedContent = cleanedContent.replace(
    /function\s+openModal\s*\([^)]*\)\s*\{[^}]*\}/gi,
    '// openModal provided by React'
  );
}
```

#### `autoDetectTriggers()`
- **BEFORE:** Added `data-webinar-trigger` to ALL buttons matching patterns
- **AFTER:** Skips buttons that already have `onclick="openModal()"`

```typescript
// Skip if already has onclick="openModal()"
const onclick = el.getAttribute('onclick');
if (onclick && onclick.includes('openModal')) {
  return; // Don't add data-webinar-trigger
}
```

### 4. **Dual-Mode Button Detection** ✅
**File:** `src/app/w/[slug]/page-client.tsx`

The system now supports BOTH methods:
1. **Inline onclick:** `<button onclick="openModal()">` ← Works directly
2. **Data attribute:** `<button data-webinar-trigger="true">` ← Fallback with event listeners

Event listeners are still added as fallback for buttons without onclick.

## How It Works Now

### For HTML with `onclick="openModal()"`
```html
<button class="cta-button" onclick="openModal()">
  Register Now
</button>

<script>
  // This script is NOW PRESERVED (not removed)
  function updateCountdown() {
    // Timer logic...
  }
  
  // openModal is provided by React, so this definition is replaced with comment
  // function openModal() { ... }  ← Replaced with: // openModal provided by React
</script>
```

**What happens:**
1. ✅ Script tag is preserved
2. ✅ `onclick="openModal()"` is preserved
3. ✅ React provides `window.openModal` function
4. ✅ Click opens React modal

### For HTML without onclick
```html
<button class="cta-button">Register Now</button>
```

**What happens:**
1. ✅ Button detected by class name
2. ✅ Event listener added automatically
3. ✅ Click opens React modal

### Auto-Convert Feature
When you click "⚡ Auto-convert HTML":
1. ✅ Preserves `onclick="openModal()"`
2. ✅ Converts `onclick="showPopup()"` → `onclick="openModal()"`
3. ✅ Adds `data-webinar-trigger` to buttons without onclick
4. ✅ Removes OLD popup divs (like `#registrationPopup`)
5. ✅ Removes OLD functions (like `showPopup()`) but keeps `openModal()`
6. ✅ Preserves countdown timers, animations, and other scripts

## Testing

### Console Output (when page loads):
```
[Registration] Setting up global modal functions...
[Registration] Setting up button listeners...
[Registration] Found buttons: { byAction: 0, byTrigger: 0, byClass: 4, byHref: 0, byText: 4 }
[Registration] Total unique buttons: 4
```

### Console Output (when button clicked):
```
[Registration] openModal() called
[Registration] 🎯 BUTTON CLICKED: { tag: 'BUTTON', classes: 'cta-button', text: 'Reserve My Free Seat' }
[Registration] Opening modal...
```

## Files Modified

1. ✅ `src/app/w/[slug]/page-client.tsx`
   - Stopped removing script tags
   - Added global `openModal/closeModal` functions
   - Enhanced console logging

2. ✅ `src/lib/externalHtmlProcessor.ts`
   - Updated `convertOnClickHandlers()` to preserve `openModal()`
   - Updated `processHtmlString()` to preserve modal functions
   - Updated `cleanupScripts()` to keep `openModal/closeModal`
   - Updated `autoDetectTriggers()` to skip buttons with onclick

## Usage Guide

### For New Registration Pages

**Option 1: Use Auto-Convert** (Recommended)
1. Paste your complete HTML (with existing popups)
2. Click "⚡ Auto-convert HTML"
3. System will:
   - Keep your scripts
   - Convert old `showPopup()` to `openModal()`
   - Remove old popup modals
4. Save and test

**Option 2: Manual Setup**
1. Paste your HTML
2. Add `onclick="openModal()"` to your CTA buttons
3. OR add class `cta-button` / `register-button` for auto-detection
4. Save and test

### Supported Button Patterns

All these will work automatically:
```html
<!-- Inline onclick (preferred) -->
<button onclick="openModal()">Register</button>

<!-- CSS classes (auto-detected) -->
<button class="cta-button">Register</button>
<button class="register-button">Sign Up</button>
<button class="btn-register">Join Now</button>

<!-- Data attribute (fallback) -->
<button data-webinar-trigger="true">Register</button>
<button data-action="register">Register</button>

<!-- Text-based (auto-detected) -->
<button>Register Now</button>
<button>Save My Spot</button>
<button>Claim Your Seat</button>
```

## Backwards Compatibility

✅ **All existing registration pages still work:**
- Pages using `data-action="register"` → Still work (event listeners)
- Pages using `data-webinar-trigger` → Still work (event listeners)
- Pages using `.cta-button` class → Still work (event listeners)
- NEW: Pages using `onclick="openModal()"` → Now work (direct call)

## Benefits

1. 🎯 **Simpler for users:** Just use `onclick="openModal()"`
2. ⚡ **Faster execution:** Direct function call, no event delegation
3. 🔧 **More compatible:** Works with any HTML structure
4. 🎨 **Preserves design:** Keeps your countdown timers, animations, etc.
5. 🛠️ **Auto-convert smart:** Intelligently converts old patterns

## Next Steps

If issues persist:
1. Check browser console for `[Registration]` logs
2. Verify `onclick="openModal()"` is in the HTML (View Source)
3. Check that scripts are NOT being removed
4. Test with the working HTML template provided by user

## Example Working HTML

The user's working HTML demonstrates best practices:
- ✅ Complete `<!DOCTYPE html>` structure
- ✅ Inline CSS in `<style>` tags
- ✅ Countdown timer in `<script>` tag
- ✅ Sticky CTA logic in `<script>` tag
- ✅ Modal open/close functions in `<script>` tag
- ✅ Multiple CTA buttons with `onclick="openModal()"`
- ✅ Modal structure with `id="webinarModal"`

All of these are now preserved and work correctly!
