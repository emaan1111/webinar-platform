# Chat & Reactions System - How It Works

## 🎯 Current Behavior (CORRECT)

The chat messages and reactions system **already works identically for all schedule types**. The code does NOT filter by schedule type.

### What Gets Loaded

When a user enters the webinar room, the system loads:

1. **All Chat Messages** for that webinar where:
   - `isHidden = false` AND
   - (`isScripted = true` OR `isApproved = true`)

2. **All Reactions** for that webinar where:
   - `isHidden = false`

### Schedule Type Independence

✅ **Just-in-Time schedule** → Shows ALL webinar messages/reactions
✅ **Specific schedule** → Shows ALL webinar messages/reactions  
✅ **Recurring schedule** → Shows ALL webinar messages/reactions

**The schedule type does NOT affect which messages are shown!**

## 📝 Code Reference

### File: `/src/app/room/[slug]/page.tsx` (Lines 154-206)

```typescript
const webinar = await prisma.webinar.findUnique({
  where: { slug },  // Only filters by webinar slug, NOT by schedule!
  include: {
    chatMessages: {
      where: {
        isHidden: false,
        OR: [
          { isScripted: true },      // Pre-configured messages
          { isApproved: true },      // Real-time approved messages
        ],
      },
      orderBy: [
        { videoTimestamp: 'asc' },   // Sorted by video time
        { createdAt: 'asc' },
      ],
    },
    reactions: {
      where: { isHidden: false },    // Only visible reactions
      orderBy: [
        { videoTimestamp: 'asc' },   // Sorted by video time
        { createdAt: 'asc' },
      ],
    },
  },
});
```

**Key Point**: The query uses `where: { slug }` - it fetches the webinar by slug, and then loads ALL associated chat messages and reactions. There's NO filter by `scheduleId` or `scheduleType`.

## 🔧 Message Types

### 1. Scripted Messages (`isScripted: true`)
- Pre-configured by host in dashboard
- Created at `/dashboard/chat`
- Timed to appear at specific video timestamps
- Example: "Great question!" at 5:23 in the video

### 2. Real-time Approved Messages (`isApproved: true`)
- Sent by attendees during live webinar
- Must be approved by moderator
- Also timed to video timestamp when approved

### 3. Real-time Reactions
- Sent by attendees (hearts, claps, thumbs up)
- Appear at current video timestamp
- Can be hidden by moderator

## 🧪 Testing Checklist

If you're not seeing any chat messages or reactions, check:

### 1. Does the webinar have scripted messages?
- Go to `/dashboard/chat`
- Select your webinar
- Check if any messages exist
- Verify `isScripted: true` and `isHidden: false`

### 2. Does the webinar have reactions?
- Check `reactions` table in database
- Verify `webinarId` matches your webinar
- Verify `isHidden: false`

### 3. Is the webinar room loading correctly?
- Open browser console (F12)
- Look for errors
- Check Network tab for successful API calls

## 💾 Database Schema

### ChatMessage Model
```prisma
model ChatMessage {
  id             String    @id @default(cuid())
  webinarId      String    // Links to webinar
  message        String
  videoTimestamp Int?      // When to show (seconds)
  isScripted     Boolean   @default(false)
  isApproved     Boolean   @default(false)
  isHidden       Boolean   @default(false)
  // ...other fields
}
```

### Reaction Model
```prisma
model Reaction {
  id             String      @id @default(cuid())
  webinarId      String      // Links to webinar
  type           String      // 'heart', 'clap', 'thumbsUp'
  videoTimestamp Int         // When to show (seconds)
  isHidden       Boolean     @default(false)
  // ...other fields
}
```

## 🎬 How It Works in the UI

1. **Page Load** (`/room/[slug]`):
   - Server fetches webinar with ALL messages/reactions
   - Passes them to `WebinarLiveClient` component

2. **Client Component** (`page-client.tsx`):
   - Receives `chatMessages` and `reactionEvents` props
   - Monitors video playback time
   - Shows messages/reactions when `videoTimestamp` matches current time

3. **Timeline Sync**:
   - As video plays, compare `currentVideoTime` with `message.videoTimestamp`
   - When time matches, display the message/reaction
   - Example: Video at 10 seconds → show all messages with `videoTimestamp: 10`

## ✅ Expected Behavior

### Scenario 1: User registers for JIT schedule
1. Enters room immediately
2. Video starts at 0:00
3. Sees messages at timestamps: 0s, 5s, 10s, 15s...
4. Sees reactions at timestamps: 3s, 8s, 12s...

### Scenario 2: User registers for specific schedule  
1. Enters room at scheduled time
2. Video starts at 0:00
3. **Sees SAME messages** as Scenario 1
4. **Sees SAME reactions** as Scenario 1

### Scenario 3: User joins 5 mins late
1. Enters room 5 mins after start
2. Video starts at 5:00 (or 2:00 with grace period)
3. **Sees SAME messages** starting from that timestamp
4. **Sees SAME reactions** starting from that timestamp

## 🚨 Common Issues

### Issue: "No messages showing"
**Cause**: Webinar has no scripted messages in database
**Solution**: Go to `/dashboard/chat` and add messages

### Issue: "No reactions showing"
**Cause**: Webinar has no reactions in database
**Solution**: 
- Have attendees send reactions during live session
- Or manually add test reactions to database

### Issue: "Messages show at wrong time"
**Cause**: `videoTimestamp` doesn't match video playback
**Solution**: 
- Check `videoTimestamp` values in database
- Ensure they're in seconds (not milliseconds)
- Verify video is actually playing

## 📊 Example Data

### Sample Scripted Messages
```sql
INSERT INTO chat_messages (id, "webinarId", message, "videoTimestamp", "isScripted", "isHidden", "userName")
VALUES 
  ('msg1', 'cmhuyjwsp0007jw3kvrx3yrl6', 'Welcome everyone!', 0, true, false, 'Host'),
  ('msg2', 'cmhuyjwsp0007jw3kvrx3yrl6', 'Great question!', 120, true, false, 'Sarah'),
  ('msg3', 'cmhuyjwsp0007jw3kvrx3yrl6', 'This is amazing!', 300, true, false, 'John');
```

### Sample Reactions
```sql
INSERT INTO reactions (id, "webinarId", type, "videoTimestamp", "isHidden", "userName")
VALUES
  ('react1', 'cmhuyjwsp0007jw3kvrx3yrl6', 'heart', 5, false, 'Alice'),
  ('react2', 'cmhuyjwsp0007jw3kvrx3yrl6', 'clap', 125, false, 'Bob'),
  ('react3', 'cmhuyjwsp0007jw3kvrx3yrl6', 'thumbsUp', 305, false, 'Charlie');
```

## 🎯 Summary

**The system is already working correctly!** All schedule types show the same messages and reactions. If you're not seeing any, it's because the webinar doesn't have any messages/reactions in the database yet.

To test:
1. Go to `/dashboard/chat`
2. Select your webinar
3. Add some scripted messages with video timestamps
4. Try joining the webinar room again
5. Messages should appear at the specified timestamps regardless of schedule type

---

**Status**: ✅ Working As Intended
**Date**: November 12, 2025
**No Code Changes Needed**: The system already loads ALL messages for ALL schedule types
