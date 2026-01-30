# Free Event Popup Registration Tracking Fix (WEBINAR TRACKING)

> **Note**: This document covers the fix for WEBINAR popup tracking. For EVENT tracking, see `EVENT_TRACKING_FIX.md`.

## Problem Statement
Split tests and lead pages with free event pop-ups (referring to webinar registration popups) were not tracking registrations properly. When users registered through popup modals on custom HTML lead pages, the tracking parameters (splitTestId, variantId, leadPageId) were being lost.

## Root Cause
The tracking parameters were only being read from URL search parameters (`?st=xxx&v=yyy&lp=zzz`), but when:
1. A lead page with custom HTML injects `window.__WEBINAR_TRACKING__` global variable
2. A popup modal is triggered by clicking a button in the custom HTML
3. The popup would not have access to the tracking parameters because they were not in its URL

## Solution
Updated two key files to check for tracking parameters in multiple sources:

### 1. Embed Script (`src/app/api/embed/[id]/route.ts`)
**Before:** Only checked URL search parameters
```javascript
const pageParams = new URLSearchParams(window.location.search);
const TRACKING_PARAMS = {
  splitTestId: pageParams.get('st') || null,
  variantId: pageParams.get('v') || null,
  leadPageId: pageParams.get('lp') || pageParams.get('leadPageId') || null
};
```

**After:** Checks multiple sources with priority order:
```javascript
// Check for tracking params in multiple sources (priority order):
// 1. URL search params (st, v, lp)
// 2. window.__WEBINAR_TRACKING__ (injected by lead pages with custom HTML)
// 3. window.parent.__WEBINAR_TRACKING__ (for iframes)
let webinarTracking = null;
try {
  webinarTracking = window.__WEBINAR_TRACKING__ || (window.parent && window.parent.__WEBINAR_TRACKING__);
} catch (e) {
  // Cross-origin access blocked - expected for external embeds
}

const TRACKING_PARAMS = {
  splitTestId: pageParams.get('st') || (webinarTracking && webinarTracking.splitTestId) || null,
  variantId: pageParams.get('v') || (webinarTracking && webinarTracking.variantId) || null,
  leadPageId: pageParams.get('lp') || pageParams.get('leadPageId') || (webinarTracking && webinarTracking.leadPageId) || null
};
```

### 2. Registration Modal (`src/components/registration-pages/RegistrationModal.tsx`)
**Before:** Only checked parent window URL and postMessage
**After:** Checks `window.__WEBINAR_TRACKING__` first, then falls back to parent window URL and postMessage

Added priority checking:
1. First checks if tracking params already exist in props/URL
2. Then checks `window.__WEBINAR_TRACKING__` (injected by lead pages)
3. Then checks parent window URL (for same-origin iframes)
4. Then checks `window.parent.__WEBINAR_TRACKING__` (for same-origin iframes with injected global)
5. Finally listens for postMessage (for cross-origin embeds)

## How Tracking Works Now

### Flow 1: Split Test → Lead Page → Popup Registration
```
1. User visits split test URL: /t/my-test
2. Split test page redirects to lead page: /p/my-page?st=testId&v=variantId
3. Lead page injects window.__WEBINAR_TRACKING__ = { splitTestId, variantId, leadPageId }
4. User clicks registration button in custom HTML
5. Popup modal opens and checks:
   - URL params (may not have them in popup)
   - window.__WEBINAR_TRACKING__ ✅ Found here!
6. Registration is submitted with tracking params
7. Conversion is tracked for split test
```

### Flow 2: Lead Page → Popup Registration
```
1. User visits lead page directly: /p/my-page?lp=pageId
2. Lead page injects window.__WEBINAR_TRACKING__ = { leadPageId }
3. User clicks registration button in custom HTML
4. Popup modal opens and checks:
   - URL params (may not have them in popup)
   - window.__WEBINAR_TRACKING__ ✅ Found here!
5. Registration is submitted with leadPageId
6. Conversion is tracked for lead page
```

### Flow 3: External Embed Popup
```
1. User visits external website with embedded popup button
2. Website loads embed script: <script src="/api/embed/webinarId?type=popup"></script>
3. Embed script checks:
   - URL params (if website added them)
   - window.__WEBINAR_TRACKING__ (if website injected it)
4. User clicks popup button
5. Registration modal opens with available tracking params
6. Registration is submitted with any available tracking params
```

## Testing Checklist

### Test 1: Split Test with Custom HTML Lead Page Popup
- [ ] Create a split test with 2+ variants
- [ ] Configure variant A as a custom HTML lead page with a popup registration button
- [ ] Visit split test URL (/t/test-slug)
- [ ] Verify redirect to lead page includes ?st=xxx&v=yyy in URL
- [ ] Open browser console and verify `window.__WEBINAR_TRACKING__` exists
- [ ] Click registration button in custom HTML
- [ ] Open browser console in popup and look for "🔗 [RegistrationModal] Captured tracking params"
- [ ] Complete registration
- [ ] Verify in database that registration has splitTestId and variantId populated
- [ ] Verify in split test analytics that conversion was tracked

### Test 2: Standalone Lead Page with Popup
- [ ] Create a standalone lead page (not part of split test)
- [ ] Configure as custom HTML with a popup registration button
- [ ] Visit lead page URL (/p/page-slug)
- [ ] Open browser console and verify `window.__WEBINAR_TRACKING__` exists
- [ ] Click registration button in custom HTML
- [ ] Open browser console in popup and look for "🔗 [RegistrationModal] Captured tracking params"
- [ ] Complete registration
- [ ] Verify in database that registration has leadPageId populated
- [ ] Verify in lead page analytics that conversion was tracked

### Test 3: External Website Embed Popup
- [ ] Create an external HTML page
- [ ] Add embed script: `<script src="https://yoursite.com/api/embed/webinarId?type=popup"></script>`
- [ ] Add button: `<button data-webinar-popup="webinarId">Register</button>`
- [ ] (Optional) Inject tracking: `<script>window.__WEBINAR_TRACKING__ = { leadPageId: 'test' }</script>`
- [ ] Click registration button
- [ ] Complete registration
- [ ] Verify registration was created
- [ ] If tracking was injected, verify it was captured

### Test 4: Inline Embed (Should still work)
- [ ] Create inline embed code
- [ ] Add to external page with ?st=xxx&v=yyy&lp=zzz in URL
- [ ] Complete registration
- [ ] Verify tracking params were captured

## SQL Queries for Verification

### Check if registration has tracking params:
```sql
SELECT 
  id, 
  email, 
  "splitTestId", 
  "variantId", 
  "leadPageId",
  "createdAt"
FROM "Registration"
WHERE email = 'test@example.com'
ORDER BY "createdAt" DESC
LIMIT 5;
```

### Check split test conversions:
```sql
SELECT 
  st.name as "Split Test",
  v.name as "Variant",
  COUNT(r.id) as "Registrations"
FROM "SplitTest" st
JOIN "SplitTestVariant" v ON v."splitTestId" = st.id
LEFT JOIN "Registration" r ON r."splitTestId" = st.id AND r."variantId" = v.id
GROUP BY st.id, st.name, v.id, v.name
ORDER BY st."createdAt" DESC;
```

### Check lead page conversions:
```sql
SELECT 
  lp.name as "Lead Page",
  lp.views as "Views",
  COUNT(r.id) as "Conversions",
  CASE 
    WHEN lp.views > 0 THEN ROUND((COUNT(r.id)::numeric / lp.views::numeric) * 100, 2)
    ELSE 0 
  END as "Conversion Rate %"
FROM "LeadPage" lp
LEFT JOIN "Registration" r ON r."leadPageId" = lp.id
GROUP BY lp.id, lp.name, lp.views
ORDER BY lp."createdAt" DESC;
```

## Files Changed
1. `src/app/api/embed/[id]/route.ts` - Embed script now checks `window.__WEBINAR_TRACKING__`
2. `src/components/registration-pages/RegistrationModal.tsx` - Modal now checks multiple tracking sources

## Backwards Compatibility
✅ All existing tracking methods continue to work:
- URL parameters (highest priority)
- Parent window URL (for same-origin iframes)
- postMessage (for cross-origin embeds)
- New: `window.__WEBINAR_TRACKING__` global (for custom HTML pages)

## Edge Cases Handled
1. **Cross-origin iframe**: Gracefully handles access errors and falls back to postMessage
2. **Missing tracking params**: Works fine, just tracks registration without split test/lead page attribution
3. **Multiple sources**: Takes first available source in priority order (URL > window.__WEBINAR_TRACKING__ > parent)
4. **External embeds**: Still works with URL params or can use window.__WEBINAR_TRACKING__ if injected

## Related Documentation
- Split test tracking: See AB_TESTING_ARCHITECTURE.md
- Lead page setup: See REGISTRATION_PAGES_COMPLETE.md
- Embed system: See EMBED_SYSTEM_COMPLETE.md
