# Visual Flow Diagram: Free Event Popup Tracking Fix

## Before Fix (❌ NOT WORKING)

```
┌─────────────────────────────────────────────────────────────────┐
│ Split Test Page (/t/test-slug)                                  │
│ - Selects variant                                               │
│ - Redirects to: /p/page-slug?st=testId&v=variantId             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Lead Page (/p/page-slug?st=testId&v=variantId)                 │
│ - Injects: window.__WEBINAR_TRACKING__ = {                     │
│     splitTestId: "testId",                                      │
│     variantId: "variantId",                                     │
│     leadPageId: "pageId"                                        │
│   }                                                             │
│ - Displays custom HTML with registration button                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              User clicks registration button
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Popup Modal Opens                                               │
│ ❌ Embed script only checks: window.location.search            │
│ ❌ Modal only checks: URL params                               │
│ ❌ window.__WEBINAR_TRACKING__ is IGNORED                      │
│                                                                 │
│ Result: trackingParams = { st: null, v: null, lp: null }      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Registration Submitted                                          │
│ ❌ splitTestId: null                                           │
│ ❌ variantId: null                                             │
│ ❌ leadPageId: null                                            │
│                                                                 │
│ ❌ NO TRACKING - Conversion not attributed to split test!     │
└─────────────────────────────────────────────────────────────────┘
```

## After Fix (✅ WORKING)

```
┌─────────────────────────────────────────────────────────────────┐
│ Split Test Page (/t/test-slug)                                  │
│ - Selects variant                                               │
│ - Redirects to: /p/page-slug?st=testId&v=variantId             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Lead Page (/p/page-slug?st=testId&v=variantId)                 │
│ - Injects: window.__WEBINAR_TRACKING__ = {                     │
│     splitTestId: "testId",                                      │
│     variantId: "variantId",                                     │
│     leadPageId: "pageId"                                        │
│   }                                                             │
│ - Displays custom HTML with registration button                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              User clicks registration button
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Popup Modal Opens                                               │
│ ✅ Embed script checks (in order):                             │
│    1. window.location.search ❌ (empty in popup)               │
│    2. window.__WEBINAR_TRACKING__ ✅ FOUND!                    │
│    3. window.parent.__WEBINAR_TRACKING__ (fallback)            │
│                                                                 │
│ ✅ Modal checks (in order):                                    │
│    1. Props/URL params ❌ (not provided)                       │
│    2. window.__WEBINAR_TRACKING__ ✅ FOUND!                    │
│    3. window.parent.__WEBINAR_TRACKING__ (fallback)            │
│                                                                 │
│ Result: trackingParams = {                                      │
│   st: "testId",                                                │
│   v: "variantId",                                              │
│   lp: "pageId"                                                 │
│ }                                                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Registration Submitted                                          │
│ ✅ splitTestId: "testId"                                       │
│ ✅ variantId: "variantId"                                      │
│ ✅ leadPageId: "pageId"                                        │
│                                                                 │
│ ✅ Client-side conversion tracking fires:                      │
│    - /api/split-tests/track-conversion                         │
│    - /api/lead-pages/track-conversion                          │
│                                                                 │
│ ✅ TRACKED! Conversion attributed correctly!                   │
└─────────────────────────────────────────────────────────────────┘
```

## Priority Order for Tracking Parameters

```
┌──────────────────────────────────────────────────────────────┐
│                   TRACKING PARAM SOURCES                      │
│                   (Checked in this order)                     │
└──────────────────────────────────────────────────────────────┘

   1. URL Search Parameters
      ?st=xxx&v=yyy&lp=zzz
      ↓ (if not found)
      
   2. window.__WEBINAR_TRACKING__
      { splitTestId, variantId, leadPageId }
      ↓ (if not found)
      
   3. window.parent.__WEBINAR_TRACKING__
      (for same-origin iframes)
      ↓ (if not found)
      
   4. window.parent.location.search
      (for same-origin iframes)
      ↓ (if not found)
      
   5. postMessage Event
      { type: 'WEBINAR_TRACKING_PARAMS', ... }
      ↓ (if not found)
      
   6. No Tracking
      Registration works but not attributed
```

## Code Changes Location

```
src/app/api/embed/[id]/route.ts
├─ Line 680-709: Enhanced tracking param detection
│  ├─ Check URL params
│  ├─ Check window.__WEBINAR_TRACKING__
│  ├─ Check window.parent.__WEBINAR_TRACKING__
│  └─ Log tracking source for debugging
│
└─ Line 1256-1258: Params sent in registration API call

src/components/registration-pages/RegistrationModal.tsx
├─ Line 30-36: Initial tracking params state
├─ Line 354-423: Enhanced useEffect for tracking detection
│  ├─ Check if params already exist (from props/URL)
│  ├─ Check window.__WEBINAR_TRACKING__
│  ├─ Check window.parent (iframe detection)
│  ├─ Check window.parent.__WEBINAR_TRACKING__
│  └─ Listen for postMessage events
│
└─ Line 254-256: Params sent in registration API call
```

## Test Scenarios

### ✅ Scenario 1: Split Test → Lead Page → Popup
```
START: /t/test-slug
  ↓
REDIRECT: /p/variant-a?st=abc&v=xyz
  ↓
INJECT: window.__WEBINAR_TRACKING__ = { st: "abc", v: "xyz", lp: "page1" }
  ↓
CLICK: Registration button in custom HTML
  ↓
DETECT: Tracking params from window.__WEBINAR_TRACKING__
  ↓
SUBMIT: Registration with st=abc, v=xyz, lp=page1
  ↓
TRACK: /api/split-tests/track-conversion ✅
```

### ✅ Scenario 2: Standalone Lead Page → Popup
```
START: /p/lead-page
  ↓
INJECT: window.__WEBINAR_TRACKING__ = { lp: "page2" }
  ↓
CLICK: Registration button in custom HTML
  ↓
DETECT: Tracking params from window.__WEBINAR_TRACKING__
  ↓
SUBMIT: Registration with lp=page2
  ↓
TRACK: /api/lead-pages/track-conversion ✅
```

### ✅ Scenario 3: External Embed with URL Params
```
START: https://external.com/page?st=def&v=uvw
  ↓
LOAD: <script src="/api/embed/webinarId?type=popup"></script>
  ↓
DETECT: Tracking params from URL
  ↓
CLICK: <button data-webinar-popup="webinarId">
  ↓
SUBMIT: Registration with st=def, v=uvw
  ↓
TRACK: /api/split-tests/track-conversion ✅
```

### ✅ Scenario 4: Direct Registration Page (No Tracking)
```
START: /w/webinar-slug
  ↓
NO TRACKING PARAMS (this is normal)
  ↓
SUBMIT: Registration without tracking params
  ↓
TRACK: Nothing (no split test or lead page) ✅
```

## Security Considerations

```
┌─────────────────────────────────────────────────────────┐
│ Cross-Origin Protection                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Same-Origin (✅ Safe):                                  │
│   • Can access window.parent.__WEBINAR_TRACKING__      │
│   • Can access window.parent.location                   │
│                                                          │
│ Cross-Origin (🔒 Protected):                           │
│   • Cannot access window.parent properties              │
│   • try-catch prevents errors                           │
│   • Falls back to postMessage                           │
│                                                          │
│ Data Validation:                                        │
│   • Tracking IDs validated server-side                  │
│   • No XSS risk from injected values                    │
│   • Optional chaining prevents undefined errors         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Debugging Tips

### Console Messages to Look For

```javascript
// 1. Lead page loads
console.log('🎯 Tracking params injected:', window.__WEBINAR_TRACKING__);

// 2. Embed script loads
console.log('🎯 Webinar Embed Script Loaded', {
  trackingParams: { st: 'xxx', v: 'yyy', lp: 'zzz' },
  trackingSource: 'window.__WEBINAR_TRACKING__'  // ← Should see this!
});

// 3. Modal opens
console.log('🔗 [RegistrationModal] Captured tracking params from window.__WEBINAR_TRACKING__', 
  { splitTestId: 'xxx', variantId: 'yyy', leadPageId: 'zzz' }
);

// 4. Registration submits
console.log('Registration successful, attempting tracking with:', trackingParams);
```

### Browser Console Test

```javascript
// Run in console on lead page:
console.log('Tracking available:', window.__WEBINAR_TRACKING__);

// Expected output:
// { splitTestId: 'abc123', variantId: 'xyz789', leadPageId: 'page456' }
```

---

**Quick Summary**: The fix adds `window.__WEBINAR_TRACKING__` as a reliable source for tracking parameters when URL params are not available (common in popup modals). This ensures split test and lead page conversions are properly tracked.
