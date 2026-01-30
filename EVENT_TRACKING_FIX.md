# Event Tracking Fix - Split Tests and Lead Pages

## Problem
Event registrations from split tests and lead pages were not being tracked. While the webinar tracking was fixed earlier, **event** tracking was still missing tracking parameter capture and propagation.

## Root Cause
The event registration system had tracking support in the API but was missing it in the client:
- ✅ Event API already accepts `splitTestId` and `splitTestVariantId` (server-side)
- ❌ Event page server did NOT extract tracking params from URL
- ❌ Event client did NOT receive tracking params as props
- ❌ Event client did NOT send tracking params to API
- ❌ Event client did NOT fire client-side conversion tracking

## Solution
Added complete tracking parameter flow for events, matching the webinar implementation:

### 1. Event Page Server (`src/app/event/[slug]/page.tsx`)
**Added:**
- Extract tracking parameters from URL searchParams: `st`, `v`, `lp`
- Pass tracking parameters as props to client component

```typescript
// Extract tracking parameters from URL
const splitTestId = typeof searchParams.st === 'string' ? searchParams.st : undefined;
const variantId = typeof searchParams.v === 'string' ? searchParams.v : undefined;
const leadPageId = typeof searchParams.lp === 'string' ? searchParams.lp : undefined;

// Pass to client
<EventRegistrationClient 
  event={eventData} 
  splitTestId={splitTestId}
  variantId={variantId}
  leadPageId={leadPageId}
/>
```

### 2. Event Client Component (`src/app/event/[slug]/page-client.tsx`)
**Added:**
- Accept tracking params as props
- Send tracking params in API registration call
- Client-side conversion tracking using `navigator.sendBeacon`
- Debug logging for tracking params

```typescript
interface Props {
  event: Event;
  splitTestId?: string;
  variantId?: string;
  leadPageId?: string;
}

// In registration API call:
body: JSON.stringify({
  // ... other fields
  splitTestId: splitTestId,
  splitTestVariantId: variantId,
})

// After successful registration:
if (splitTestId && variantId && data.registration?.id) {
  // Fire-and-forget beacon to track conversion
  navigator.sendBeacon('/api/split-tests/track-conversion', blob);
}
```

## Flow Comparison

### Before Fix (❌ NOT TRACKING)
```
Split Test → Event Page (?st=xxx&v=yyy)
             ↓ (params ignored)
Event Client → API Registration
             ↓ (no tracking params sent)
Database     → splitTestId: null, splitTestVariantId: null
             ❌ NO CONVERSION TRACKED
```

### After Fix (✅ TRACKING)
```
Split Test → Event Page (?st=xxx&v=yyy)
             ↓ (params extracted)
Event Client → API Registration (splitTestId, splitTestVariantId)
             ↓ (server-side tracking)
Database     → splitTestId: xxx, splitTestVariantId: yyy
             ↓ (client-side beacon)
Analytics    ✅ CONVERSION TRACKED
```

## Testing

### Test Case 1: Split Test → Event Registration
1. Create a split test with event as target
2. Visit split test URL: `/t/test-slug`
3. Should redirect to event with params: `/event/event-slug?st=xxx&v=yyy`
4. Open browser console, should see: `🎯 [Event Registration] Tracking params: { splitTestId: 'xxx', variantId: 'yyy' }`
5. Complete event registration
6. Check database: `EventRegistration` should have `splitTestId` and `splitTestVariantId`
7. Check split test analytics: Conversion should be tracked

### Test Case 2: Lead Page → Event Registration
1. Create a lead page pointing to an event
2. Visit lead page: `/p/page-slug?lp=pageId`
3. Click through to event registration
4. Complete registration
5. Check database: `EventRegistration` should have lead page reference
6. Check lead page analytics: Conversion should be tracked

### Database Verification

```sql
-- Check recent event registrations with tracking
SELECT 
  id,
  email,
  "splitTestId",
  "splitTestVariantId",
  "createdAt"
FROM "EventRegistration"
WHERE "createdAt" > NOW() - INTERVAL '1 hour'
ORDER BY "createdAt" DESC;

-- Check split test conversions for events
SELECT 
  st.name as "Split Test",
  v.name as "Variant",
  COUNT(er.id) as "Event Registrations"
FROM "SplitTest" st
JOIN "SplitTestVariant" v ON v."splitTestId" = st.id
LEFT JOIN "EventRegistration" er ON er."splitTestId" = st.id AND er."splitTestVariantId" = v.id
GROUP BY st.id, st.name, v.id, v.name
ORDER BY st."createdAt" DESC;
```

## API Compatibility

The event registration API already had tracking support, so no API changes were needed:
- API accepts: `splitTestId` and `splitTestVariantId` (line 34-36)
- API tracks: Updates split test stats, logs events (lines 443-484)
- API saves: Stores tracking IDs in EventRegistration (lines 278, 297)

## Files Changed
1. **src/app/event/[slug]/page.tsx** (+10 lines)
   - Added searchParams to PageProps
   - Extract tracking params from URL
   - Pass tracking params to client

2. **src/app/event/[slug]/page-client.tsx** (+74 lines)
   - Added tracking params to Props interface
   - Accept tracking params in component
   - Send tracking params to API
   - Add client-side conversion tracking
   - Add debug logging

## Backwards Compatibility
✅ All existing functionality preserved:
- Events without tracking params continue to work
- Registration flow unchanged
- API remains backwards compatible
- No breaking changes

## Related Documentation
- Original webinar tracking fix: `FREE_EVENT_POPUP_TRACKING_FIX.md`
- Event API implementation: `src/app/api/events/[id]/register/route.ts`
- Split test architecture: `AB_TESTING_ARCHITECTURE.md`

## Next Steps
- Manual testing of split test → event flow
- Manual testing of lead page → event flow
- Verify tracking in production analytics
- Monitor for any errors in logs

---

**Status**: ✅ Code changes complete, ready for testing
**Risk**: Low (additive changes, API already supported tracking)
**Breaking Changes**: None
