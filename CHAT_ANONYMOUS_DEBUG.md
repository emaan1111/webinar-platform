# Chat "Anonymous" Bug - Debugging Guide

## Issue
Chat messages are being saved with the userName "Anonymous" instead of the actual registration name, even though reactions work correctly with the proper names.

## Root Cause Analysis

### Backend Code (✅ CORRECT)
Both chat and reactions APIs use identical logic:

**Chat API** (`src/app/api/chat/route.ts` line 193):
```typescript
if (!userId && registrationId) {
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId }
  })
  regId = registration.id
  userName = registration.name // ← Gets from registration
}
```

**Reactions API** (`src/app/api/webinars/[id]/reactions/route.ts` line 78):
```typescript
if (!userId && registrationId) {
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId }
  })
  regId = registration.id
  userName = registration.name // ← Same logic
}
```

### Frontend Code (⚠️ SUSPICIOUS)

**Chat Frontend** (`src/app/w/[slug]/live/page-client.tsx` line 1342):
```typescript
const response = await fetch(`/api/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    webinarId: webinar.id,
    message: text,
    registrationId: viewer?.id, // ← Sends registrationId
  }),
});
```

**Viewer Prop** (`src/app/room/[slug]/page.tsx` lines 472-478):
```typescript
viewer={
  registrationMeta
    ? {
        id: registrationMeta.id,  // ← This is the registration ID
        name: registrationMeta.name,
        email: registrationMeta.email,
        lastWatchedPosition: registrationMeta.lastWatchedPosition,
      }
    : null
}
```

## Hypothesis

The issue occurs when `viewer` is `null` or `undefined` on the client side, causing:
1. `registrationId: viewer?.id` to be `undefined`
2. The API's `if (!userId && registrationId)` check at line 169 to be **skipped**
3. `userName` to remain `null`
4. Database saves with `userName: null`
5. Dashboard displays as "Anonymous"

## Debugging Added

### Frontend Logging
Added to `src/app/w/[slug]/live/page-client.tsx`:
```typescript
console.log('💬 [Chat] Sending message:', {
  viewer: viewer,
  viewerId: viewer?.id,
  viewerName: viewer?.name,
  userName: userName
});

console.log('💬 [Chat] Sending to API:', payload);
```

### Backend Logging
Added to `src/app/api/chat/route.ts`:
```typescript
console.log('💬 [API] Received chat message:', {
  webinarId,
  message: message?.substring(0, 50),
  registrationId,
  hasRegistrationId: !!registrationId
});

console.log('💬 [API] Looking up registration:', registrationId);
console.log('💬 [API] Found registration:', {
  found: !!registration,
  name: registration?.name,
  email: registration?.email
});

console.log('💬 [API] Final userName:', userName);
```

## Testing Instructions

1. **Start dev server**: `npm run dev`
2. **Register for webinar**: Use registration form with valid name/email
3. **Join webinar room**: Click join link with registration ID (r=xxx parameter)
4. **Check browser console**: Should show `viewer` object with id, name, email
5. **Send chat message**: Type message and send
6. **Check logs**:
   - Frontend should log viewer data and payload
   - Backend should log receiving registrationId and finding registration
   - Backend should log final userName (should NOT be null)

## Expected Scenarios

### Scenario A: Viewer is null (Bug Scenario)
```
💬 [Chat] Sending message: { viewer: null, viewerId: undefined, ... }
💬 [Chat] Sending to API: { registrationId: undefined, ... }
💬 [API] Received chat message: { registrationId: undefined, hasRegistrationId: false }
💬 [API] Final userName: null
Result: Saves as "Anonymous" ❌
```

### Scenario B: Viewer exists (Working Scenario)
```
💬 [Chat] Sending message: { viewer: { id: 'cxxx', name: 'John' }, viewerId: 'cxxx', ... }
💬 [Chat] Sending to API: { registrationId: 'cxxx', ... }
💬 [API] Received chat message: { registrationId: 'cxxx', hasRegistrationId: true }
💬 [API] Looking up registration: cxxx
💬 [API] Found registration: { found: true, name: 'John', email: 'john@example.com' }
💬 [API] Final userName: John
Result: Saves with correct name ✅
```

## Possible Causes

1. **URL Parameter Missing**: User joined without `r=xxx` parameter
   - Registration ID not passed to room page
   - `registrationMeta` is null
   - `viewer` prop is null

2. **Session Expired**: Registration record deleted or expired
   - `registrationMeta` lookup fails
   - `viewer` prop is null

3. **State Management**: Viewer state not properly initialized
   - Component mounted before viewer prop loaded
   - Race condition between initial load and chat send

4. **Component Re-render**: Viewer prop lost during re-render
   - State update causing viewer to reset
   - Need to check useEffect dependencies

## Next Steps

1. **Run test with logging** to identify which scenario is happening
2. **Check registration URL** - verify `r=xxx` parameter is present
3. **Check registration data** - verify record exists in database
4. **Check component lifecycle** - ensure viewer prop persists

## Comparison with Reactions (Working)

Reactions work because they use the **exact same logic**. If reactions work but chat doesn't, the difference must be:
- **Timing**: Chat sent before viewer loaded?
- **State**: Viewer state cleared between reactions and chat?
- **Context**: Different execution context losing viewer prop?

Need to compare **when** reactions are sent vs **when** chat is sent relative to viewer loading.

## Resolution Plan

Once we identify the root cause from logs:

### If viewer is null:
- Add fallback to get registrationId from URL parameter
- Add validation before allowing chat send
- Show "Please register to chat" message

### If registration lookup fails:
- Add better error handling
- Prompt user to re-register
- Log detailed error for debugging

### If race condition:
- Add loading state for chat input
- Disable chat until viewer loaded
- Use useEffect to monitor viewer state
