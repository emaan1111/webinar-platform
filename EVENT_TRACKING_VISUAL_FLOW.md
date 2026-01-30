# Event Tracking Visual Comparison

## Before Fix (❌ EVENT TRACKING BROKEN)

```
┌─────────────────────────────────────────────────────────────────┐
│ Split Test Page (/t/test-slug)                                  │
│ - Selects variant                                               │
│ - Redirects to: /event/event-slug?st=testId&v=variantId        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Event Page Server (page.tsx)                                    │
│ ❌ Does NOT extract tracking params from URL                    │
│ ❌ Does NOT pass tracking params to client                      │
│                                                                 │
│ interface PageProps {                                           │
│   params: { slug: string }                                      │
│   // ❌ No searchParams                                        │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Event Page Client (page-client.tsx)                             │
│ ❌ Does NOT receive tracking params                            │
│ ❌ Does NOT send tracking params to API                        │
│                                                                 │
│ function EventRegistrationClient({ event }: Props)              │
│   // ❌ No splitTestId, variantId, leadPageId                 │
│                                                                 │
│ API Call:                                                       │
│   body: JSON.stringify({                                        │
│     name, email, ...                                            │
│     // ❌ Missing: splitTestId, splitTestVariantId            │
│   })                                                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Event Registration API (route.ts)                               │
│ ✅ API ready to accept tracking params                         │
│ ❌ But receives: splitTestId: undefined                        │
│                                                                 │
│ const { splitTestId, splitTestVariantId } = body                │
│ // Both undefined!                                              │
│                                                                 │
│ Database Insert:                                                │
│   splitTestId: null                                             │
│   splitTestVariantId: null                                      │
│                                                                 │
│ ❌ NO TRACKING - Conversion not attributed to split test!     │
└─────────────────────────────────────────────────────────────────┘
```

## After Fix (✅ EVENT TRACKING WORKING)

```
┌─────────────────────────────────────────────────────────────────┐
│ Split Test Page (/t/test-slug)                                  │
│ - Selects variant                                               │
│ - Redirects to: /event/event-slug?st=testId&v=variantId        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Event Page Server (page.tsx)                                    │
│ ✅ Extracts tracking params from URL                            │
│ ✅ Passes tracking params to client                             │
│                                                                 │
│ interface PageProps {                                           │
│   params: { slug: string }                                      │
│   searchParams: { [key: string]: string | string[] }            │
│ }                                                               │
│                                                                 │
│ const splitTestId = searchParams.st                             │
│ const variantId = searchParams.v                                │
│ const leadPageId = searchParams.lp                              │
│                                                                 │
│ <EventRegistrationClient                                        │
│   event={eventData}                                             │
│   splitTestId={splitTestId} ✅                                 │
│   variantId={variantId} ✅                                     │
│   leadPageId={leadPageId} ✅                                   │
│ />                                                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Event Page Client (page-client.tsx)                             │
│ ✅ Receives tracking params as props                            │
│ ✅ Logs params for debugging                                    │
│ ✅ Sends params to API                                          │
│ ✅ Fires client-side conversion tracking                        │
│                                                                 │
│ function EventRegistrationClient({                              │
│   event,                                                        │
│   splitTestId, ✅                                              │
│   variantId, ✅                                                │
│   leadPageId ✅                                                │
│ }: Props)                                                       │
│                                                                 │
│ console.log('🎯 [Event Registration] Tracking params:', {       │
│   splitTestId, variantId, leadPageId                            │
│ })                                                              │
│                                                                 │
│ API Call:                                                       │
│   body: JSON.stringify({                                        │
│     name, email, ...                                            │
│     splitTestId: splitTestId, ✅                               │
│     splitTestVariantId: variantId ✅                           │
│   })                                                            │
│                                                                 │
│ // After successful registration:                               │
│ if (splitTestId && variantId) {                                 │
│   navigator.sendBeacon(                                         │
│     '/api/split-tests/track-conversion',                        │
│     { splitTestId, variantId, registrationId }                  │
│   ) ✅                                                          │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Event Registration API (route.ts)                               │
│ ✅ Receives tracking params from client                        │
│                                                                 │
│ const { splitTestId, splitTestVariantId } = body                │
│ // splitTestId: 'abc123'                                        │
│ // splitTestVariantId: 'xyz789'                                 │
│                                                                 │
│ Database Insert:                                                │
│   splitTestId: 'abc123' ✅                                     │
│   splitTestVariantId: 'xyz789' ✅                              │
│                                                                 │
│ Server-side tracking (lines 443-484):                           │
│   - Update variant conversions ✅                              │
│   - Update split test conversions ✅                           │
│   - Log split test event ✅                                    │
│   - Update lead page (if applicable) ✅                        │
│                                                                 │
│ ✅ TRACKED! Conversion attributed correctly!                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Split Test Analytics Dashboard                                  │
│                                                                 │
│ Test: "Free Event Registration Test"                           │
│   Variant A: Landing Page 1                                    │
│     Views: 100                                                  │
│     Conversions: 15 ✅ (now includes events!)                  │
│     Rate: 15%                                                   │
│                                                                 │
│   Variant B: Landing Page 2                                    │
│     Views: 100                                                  │
│     Conversions: 22 ✅ (now includes events!)                  │
│     Rate: 22%                                                   │
│                                                                 │
│ ✅ Winner: Variant B (+47% conversion rate)                    │
└─────────────────────────────────────────────────────────────────┘
```

## Side-by-Side Code Comparison

### Event Page Server (page.tsx)

| Before | After |
|--------|-------|
| ```typescript<br>interface PageProps {<br>  params: { slug: string }<br>}<br><br>export default async function<br>EventRegistrationPage(<br>  { params }: PageProps<br>) {<br>  const event = await getEventData(<br>    params.slug<br>  )<br><br>  return (<br>    <EventRegistrationClient<br>      event={eventData}<br>    /><br>  )<br>}``` | ```typescript<br>interface PageProps {<br>  params: { slug: string }<br>  searchParams: {<br>    [key: string]: string \| string[]<br>  }<br>}<br><br>export default async function<br>EventRegistrationPage(<br>  { params, searchParams }: PageProps<br>) {<br>  const event = await getEventData(<br>    params.slug<br>  )<br><br>  // Extract tracking params<br>  const splitTestId =<br>    searchParams.st<br>  const variantId =<br>    searchParams.v<br>  const leadPageId =<br>    searchParams.lp<br><br>  return (<br>    <EventRegistrationClient<br>      event={eventData}<br>      splitTestId={splitTestId}<br>      variantId={variantId}<br>      leadPageId={leadPageId}<br>    /><br>  )<br>}``` |

### Event Page Client (page-client.tsx)

| Before | After |
|--------|-------|
| ```typescript<br>interface Props {<br>  event: Event<br>}<br><br>export default function<br>EventRegistrationClient(<br>  { event }: Props<br>) {<br>  // ...<br><br>  const handleFinalSubmit = async () => {<br>    const res = await fetch(<br>      `/api/events/${event.id}/register`,<br>      {<br>        method: 'POST',<br>        body: JSON.stringify({<br>          name: form.name,<br>          email: form.email,<br>          // ... other fields<br>          // ❌ Missing tracking params<br>        })<br>      }<br>    )<br>    // ❌ No conversion tracking<br>  }<br>}``` | ```typescript<br>interface Props {<br>  event: Event<br>  splitTestId?: string<br>  variantId?: string<br>  leadPageId?: string<br>}<br><br>export default function<br>EventRegistrationClient({<br>  event,<br>  splitTestId,<br>  variantId,<br>  leadPageId<br>}: Props) {<br>  // Log tracking params<br>  useEffect(() => {<br>    console.log('🎯 Tracking params:', {<br>      splitTestId, variantId, leadPageId<br>    })<br>  }, [])<br><br>  const handleFinalSubmit = async () => {<br>    const res = await fetch(<br>      `/api/events/${event.id}/register`,<br>      {<br>        method: 'POST',<br>        body: JSON.stringify({<br>          name: form.name,<br>          email: form.email,<br>          // ... other fields<br>          splitTestId: splitTestId,<br>          splitTestVariantId: variantId<br>        })<br>      }<br>    )<br><br>    if (res.ok) {<br>      const data = await res.json()<br><br>      // ✅ Client-side conversion tracking<br>      if (splitTestId && variantId) {<br>        navigator.sendBeacon(<br>          '/api/split-tests/track-conversion',<br>          blob<br>        )<br>      }<br>    }<br>  }<br>}``` |

## Testing Flow

### Test 1: Manual Browser Test
```
1. Create split test:
   Name: "Event Registration Test"
   Variant A: Event page variant 1
   Variant B: Event page variant 2

2. Get split test URL:
   /t/event-test

3. Open browser, clear cookies

4. Visit: http://localhost:3000/t/event-test

5. Should redirect to event page with params:
   http://localhost:3000/event/free-workshop?st=abc123&v=xyz789

6. Open browser console (F12)
   Look for: 🎯 [Event Registration] Tracking params: { splitTestId: 'abc123', ... }

7. Complete registration form

8. Check database:
   SELECT * FROM "EventRegistration" ORDER BY "createdAt" DESC LIMIT 1;
   
   Should see:
   splitTestId: 'abc123'
   splitTestVariantId: 'xyz789'

9. Check split test dashboard:
   Views: 1
   Conversions: 1 ✅
```

### Test 2: Database Query
```sql
-- Before fix: Should return 0 rows
SELECT COUNT(*) FROM "EventRegistration" WHERE "splitTestId" IS NOT NULL;

-- After fix: Should return > 0 rows after testing
SELECT 
  er.email,
  er."splitTestId",
  er."splitTestVariantId",
  st.name as "Split Test Name",
  v.name as "Variant Name"
FROM "EventRegistration" er
JOIN "SplitTest" st ON st.id = er."splitTestId"
JOIN "SplitTestVariant" v ON v.id = er."splitTestVariantId"
ORDER BY er."createdAt" DESC
LIMIT 10;
```

## Key Differences: Webinar vs Event Tracking

| Aspect | Webinar Tracking | Event Tracking |
|--------|-----------------|----------------|
| **Issue** | Params lost in popup modal | Params never extracted from URL |
| **Root Cause** | Modal didn't check `window.__WEBINAR_TRACKING__` | Page didn't extract searchParams |
| **Fix Location** | Embed script + Modal component | Page server + Page client |
| **Complexity** | Medium (multiple sources to check) | Simple (standard URL param flow) |
| **API Changes** | None (already supported) | None (already supported) |
| **Testing** | Test popup on lead page | Test direct event page |

---

**Summary**: Event tracking was a straightforward parameter passing issue, while webinar popup tracking required checking global variables due to the iframe/modal architecture.
