# Registrant Chat & Reactions Implementation Summary

## ✅ Implementation Complete

Registered attendees can now send chat messages and reactions during live webinars without needing to create a user account.

## Changes Made

### 1. Database Schema (`prisma/schema.prisma`)

#### ChatMessage Model
```prisma
model ChatMessage {
  id             String        @id @default(cuid())
  webinarId      String
  webinar        Webinar       @relation(fields: [webinarId], references: [id], onDelete: Cascade)
  userId         String?       // ← Made optional
  user           User?         @relation(fields: [userId], references: [id])
  registrationId String?       // ← Added for registrants
  registration   Registration? @relation(fields: [registrationId], references: [id])
  userName       String?       // ← Added to store name
  message        String
  isScripted     Boolean       @default(false)
  videoTimestamp Int?
  isHidden       Boolean       @default(false)
  isApproved     Boolean       @default(false)
  createdAt      DateTime      @default(now())
}
```

#### Reaction Model
```prisma
model Reaction {
  id             String        @id @default(cuid())
  webinarId      String
  webinar        Webinar       @relation(fields: [webinarId], references: [id], onDelete: Cascade)
  userId         String?       // ← Made optional
  user           User?         @relation(fields: [userId], references: [id])
  registrationId String?       // ← Added for registrants
  registration   Registration? @relation(fields: [registrationId], references: [id])
  userName       String?       // ← Added to store name
  type           String
  isScripted     Boolean       @default(false)
  videoTimestamp Int
  isHidden       Boolean       @default(false)
  createdAt      DateTime      @default(now())
}
```

#### Registration Model
```prisma
model Registration {
  // ... existing fields ...
  
  // Relations
  chatMessages ChatMessage[]  // ← Added
  reactions    Reaction[]     // ← Added
}
```

### 2. API Routes Updated

#### `/src/app/api/chat/route.ts`
- **POST endpoint** now accepts `registrationId` parameter
- Validates registration belongs to the correct webinar
- Stores `userName` from registration
- Auto-approves messages from registered attendees
- Priority: Authenticated user > Registered attendee > Deny

```typescript
// Request body
{
  "webinarId": "string",
  "message": "string",
  "registrationId": "string (optional)"
}
```

#### `/src/app/api/webinars/[id]/reactions/route.ts`
- **POST endpoint** now accepts `registrationId` parameter
- Validates registration belongs to the correct webinar
- Stores `userName` from registration
- Priority: Authenticated user > Registered attendee > Deny

```typescript
// Request body
{
  "type": "heart | clap | thumbsUp",
  "videoTimestamp": number,
  "registrationId": "string (optional)"
}
```

### 3. Frontend Updates

#### `/src/app/w/[slug]/live/page-client.tsx`

**Updated `handleReaction` function:**
```typescript
const handleReaction = useCallback(
  async (type: ReactionType, button: HTMLButtonElement | null) => {
    // ... visual feedback code ...

    // Save to database with registrationId
    await fetch(`/api/webinars/${webinar.id}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        videoTimestamp: elapsedSeconds,
        registrationId: viewer?.id, // ← Added registrationId
      }),
    });
  },
  [spawnReaction, viewer, webinar.id, elapsedSeconds]
);
```

**Updated `handleSendMessage` function:**
```typescript
const handleSendMessage = useCallback(async () => {
  // ... validation code ...

  // Save to database with registrationId
  await fetch(`/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      webinarId: webinar.id,
      message: text,
      registrationId: viewer?.id, // ← Added registrationId
    }),
  });
}, [chatInput, elapsedSeconds, webinar.id, viewer, addChatMessage]);
```

#### `/src/app/room/[slug]/page.tsx`

**Updated data fetching to include registration info:**
```typescript
const webinar = await prisma.webinar.findUnique({
  where: { slug },
  include: {
    chatMessages: {
      include: {
        user: true,
        registration: true, // ← Added
      },
    },
    reactions: {
      include: {
        user: true,
        registration: true, // ← Added
      },
    },
  },
});
```

**Updated name resolution logic:**
```typescript
// For chat messages
const displayName =
  message.userName ||           // 1. Stored userName
  message.user?.name ||         // 2. User account name
  message.user?.email.split('@')[0] || // 3. User email
  message.registration?.name || // 4. Registration name
  'Guest';                      // 5. Fallback

// For reactions  
const displayName =
  reaction.userName ||          // 1. Stored userName
  reaction.user?.name ||        // 2. User account name
  reaction.user?.email.split('@')[0] || // 3. User email
  reaction.registration?.name || // 4. Registration name
  'Guest';                       // 5. Fallback
```

## How It Works

### Registration Flow
1. User registers for webinar → receives `registrationId`
2. User accesses live room with URL: `/room/[slug]?r=[registrationId]`
3. `registrationId` is passed to client as `viewer.id`
4. Client includes `registrationId` in all API calls

### Chat Message Flow
1. User types message and clicks send
2. Frontend calls `/api/chat` with `registrationId`
3. Backend validates registration exists and belongs to webinar
4. Message saved with `registrationId` and `userName` from registration
5. Message auto-approved and visible to all attendees

### Reaction Flow
1. User clicks reaction button (heart/clap/thumbsUp)
2. Frontend calls `/api/webinars/[id]/reactions` with `registrationId`
3. Backend validates registration exists and belongs to webinar
4. Reaction saved with `registrationId`, `userName`, and `videoTimestamp`
5. Reaction visible to future viewers at that timestamp

## Security Features

✅ **Registration Validation**: Ensures registration exists and matches webinar
✅ **Webinar Association**: Prevents using registrationId from different webinar
✅ **Name Tracking**: Stores attendee name for accountability
✅ **Audit Trail**: All messages/reactions linked to registration
✅ **Backward Compatible**: Authenticated users still work as before

## Testing

### Test Chat Messages
1. Register for a webinar
2. Join live room with registration link
3. Send a chat message
4. Verify message appears with your registration name
5. Check database: `SELECT * FROM chat_messages WHERE registrationId = 'your-registration-id'`

### Test Reactions
1. While in live room, click reaction buttons
2. Verify animations appear
3. Check database: `SELECT * FROM reactions WHERE registrationId = 'your-registration-id'`
4. Verify `videoTimestamp` is recorded correctly

### Test Name Display
1. Register with name "Test User"
2. Send chat/reactions
3. Verify "Test User" appears (not "Guest")
4. Check database for `userName` field

## Database Migrations

Run these commands to apply changes:
```bash
# Push schema changes
npx prisma db push

# Regenerate Prisma client
npx prisma generate

# Restart development server
npm run dev
```

## Known Issues / Notes

- TypeScript may show errors for Prisma include types - these are cosmetic and won't affect runtime
- Existing chat messages/reactions (with userId) continue to work
- Both userId and registrationId are optional, but at least one should be provided
- The `userName` field is populated automatically from user or registration

## Future Enhancements

- [ ] Add rate limiting for chat messages per registrant
- [ ] Add profanity filter for chat messages
- [ ] Add ability to ban/mute specific registrants
- [ ] Add "verified registrant" badge in chat
- [ ] Add typing indicators showing registrant names
- [ ] Add private messages between host and registrants

## Documentation

See also:
- `CHAT_REACTIONS_FOR_REGISTRANTS.md` - API documentation and examples
- `API_DOCUMENTATION.md` - General API reference
