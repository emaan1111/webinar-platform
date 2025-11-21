# Chat Message Video Timestamp Fix

## Issue
New chat messages were not saving the video timestamp (the point in the video when the message was sent).

## Root Cause
The frontend was including `videoTimestamp: elapsedSeconds` in the optimistic UI message display, but was NOT sending it to the API. The API was also not extracting or saving the videoTimestamp field.

## Solution

### 1. Frontend Fix (`src/app/w/[slug]/live/page-client.tsx`)
Added `videoTimestamp` to the payload sent to the API:

```typescript
const payload = {
  webinarId: webinar.id,
  message: text,
  videoTimestamp: elapsedSeconds, // ✅ Now included
  registrationId: viewer?.id,
};
```

### 2. Backend Fix (`src/app/api/chat/route.ts`)

**a) Extract videoTimestamp from request body:**
```typescript
const { webinarId, message, videoTimestamp, registrationId } = body
```

**b) Save to database:**
```typescript
const newMessage = await prisma.chatMessage.create({
  data: {
    webinarId,
    userId,
    registrationId: regId,
    userName,
    message,
    videoTimestamp: videoTimestamp ? Math.floor(videoTimestamp) : null, // ✅ Now saved
    isHidden: false,
    isApproved: false
  },
  // ...
})
```

## How It Works Now

1. **User sends chat message** at 15:30 in the video
2. **Frontend captures** `elapsedSeconds` (930 seconds)
3. **Frontend sends** to API with `videoTimestamp: 930`
4. **Backend receives** and logs the timestamp
5. **Backend saves** to database: `videoTimestamp: 930`
6. **Moderation screen** can now show "at 15:30" for each message
7. **Replay viewers** will see the message appear at the correct time

## Database Field
The `ChatMessage` model already has the `videoTimestamp` field:
```prisma
model ChatMessage {
  videoTimestamp Int?  // Timestamp in seconds when message should appear
}
```

## Benefits
- ✅ Messages appear at correct time during replays
- ✅ Moderators can see when each message was sent
- ✅ Better context for message approval
- ✅ Consistent timing for scripted vs real messages

## Testing
1. Join a live webinar
2. Wait until 2-3 minutes into the video
3. Send a chat message
4. Check the database: `videoTimestamp` should match current video position
5. Check moderation screen: Should show timestamp in message details
6. Replay the webinar: Message should appear at the same point

## Files Changed
- `src/app/w/[slug]/live/page-client.tsx` - Added videoTimestamp to payload
- `src/app/api/chat/route.ts` - Extract and save videoTimestamp

## Date Fixed
November 21, 2025
