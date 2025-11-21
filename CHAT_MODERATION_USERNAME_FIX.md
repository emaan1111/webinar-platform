# Chat Moderation Username Display Fix

## Issue
All chat messages in the moderation screen (`/dashboard/chat`) were showing as "Anonymous" instead of displaying the actual user names.

## Root Cause
The chat moderation screen was only looking for usernames in the `user` relation (from the User table), but:

1. **Real user messages** store the name in `ChatMessage.userName` field (copied from registration)
2. **Scripted messages** don't populate `userName`, they rely on the `userId` relation to User table
3. The API was using `include` instead of `select`, which didn't explicitly return the `userName` field
4. The frontend mapping only checked `msg.user?.name`, missing the `userName` field entirely

## Solution

### 1. Updated API Response (`src/app/api/chat/route.ts`)
Changed from `include` to `select` to explicitly return the `userName` field:

```typescript
const messages = await prisma.chatMessage.findMany({
  where: whereClause,
  select: {
    id: true,
    userId: true,
    registrationId: true,
    userName: true, // ✅ Now explicitly included
    message: true,
    isHidden: true,
    isApproved: true,
    isScripted: true,
    isAI: true,
    videoTimestamp: true,
    createdAt: true,
    user: {
      select: {
        id: true,
        name: true,
        email: true
      }
    },
    webinar: {
      select: {
        id: true,
        title: true
      }
    }
  },
  orderBy: {
    createdAt: 'desc'
  }
})
```

### 2. Updated Frontend Mapping (`src/app/dashboard/chat/page.tsx`)
Changed the userName mapping to use a proper fallback chain:

```typescript
const mappedMessages = data.messages.map((msg: ChatMessage) => ({
  ...msg,
  // Use userName field from ChatMessage table first, then fallback to user relation, then 'Anonymous'
  userName: msg.userName || msg.user?.name || msg.user?.email || 'Anonymous',
  webinarTitle: msg.webinar?.title || 'Unknown Webinar',
  timestamp: msg.createdAt,
  isModerated: false
}))
```

### 3. Updated TypeScript Interface
Updated the `ChatMessage` interface to reflect the correct data structure:

```typescript
interface ChatMessage {
  id: string
  userId: string
  registrationId?: string | null
  userName: string | null  // ✅ Added - userName field from ChatMessage table
  message: string
  isHidden: boolean
  isApproved: boolean
  isScripted: boolean
  isAI: boolean
  videoTimestamp: number | null
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
  webinar: {
    id: string
    title: string
  }
  // Computed properties for easier access
  webinarTitle?: string
  timestamp?: string
  isModerated?: boolean
}
```

## How It Works Now

### For Real User Messages (from registrations):
1. When a registered attendee sends a chat message, the `userName` field is populated from `registration.name`
2. The API returns this `userName` field
3. Frontend uses this directly: `msg.userName` → Shows correct name ✅

### For Scripted Messages (pre-written):
1. Scripted messages have `userName = null` but have a `userId` relation to User table
2. The API returns both `userName: null` and `user.name: "Admin"` (or other user)
3. Frontend fallback chain: `msg.userName || msg.user?.name` → Shows correct name ✅

## Database Schema Context

```prisma
model ChatMessage {
  id             String        @id @default(cuid())
  webinarId      String
  webinar        Webinar       @relation(fields: [webinarId], references: [id], onDelete: Cascade)
  userId         String?       // Optional - for authenticated users (admins)
  user           User?         @relation(fields: [userId], references: [id])
  registrationId String?       // Optional - for registered attendees without accounts
  registration   Registration? @relation(fields: [registrationId], references: [id])
  userName       String?       // Store name from registration or user ✅ THIS FIELD WAS KEY
  message        String
  isScripted     Boolean       @default(false)
  isAI           Boolean       @default(false)
  videoTimestamp Int?
  isHidden       Boolean       @default(false)
  isApproved     Boolean       @default(false)
  createdAt      DateTime      @default(now())
}
```

## Testing Results

Tested with 20 recent messages:
- ✅ **Real user messages** (6 messages): All showing correct names (Shabana Khan, Lubna)
- ✅ **Scripted messages** (14 messages): All showing correct names from user relation
- ✅ **0 messages showing "Anonymous"**

## Files Changed
1. `src/app/api/chat/route.ts` - Updated query to explicitly select userName field
2. `src/app/dashboard/chat/page.tsx` - Updated interface and mapping logic with proper fallback

## Result
✅ All chat messages in the moderation screen now display proper user names instead of "Anonymous"!
