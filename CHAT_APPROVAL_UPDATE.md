# Chat Approval System - Updated Behavior

## Summary of Changes

The chat approval system has been updated to provide better moderation control while maintaining a natural live chat experience.

## Previous Behavior ❌

- **Attendee messages** were AUTO-APPROVED (`isApproved: true`)
- Messages appeared immediately in ALL sessions (current and future)
- No moderation control over live chat
- All messages visible to all future viewers

## New Behavior ✅

- **Attendee messages** require approval (`isApproved: false`)
- Messages appear in **current live session only**
- Messages need **manual approval** to appear in future sessions
- Gives hosts control over what future viewers see

---

## How It Works

### For Current Live Session

When an attendee sends a message during the webinar:

```typescript
isHidden: false  // ✅ Visible in current session
isApproved: false // ❌ Not approved for future sessions
```

**Result:** Message shows up immediately for everyone in the current live session, creating a natural chat experience.

### For Future Replay Sessions

Only approved messages appear:

```typescript
isHidden: false
isApproved: true  // ✅ Only approved messages show
```

**Result:** Future viewers only see curated, approved messages.

---

## Benefits

1. **Live Experience**: Chat flows naturally during live webinar
2. **Moderation Control**: Host can review and approve messages later
3. **Quality Control**: Only good questions/comments appear in replays
4. **Professional**: Removes spam, off-topic, or low-quality messages from replays
5. **Best of Both**: Combines live engagement with curated replay experience

---

## Moderation Workflow

### Step 1: Attendees Send Messages
- Messages appear instantly in the current live session
- All attendees see the message
- Natural, real-time chat experience

### Step 2: Review Messages (Dashboard → Chat Manager)
- Host sees all messages with "Pending" status
- Messages marked with yellow "Pending" badge
- Host can review content, username, timestamp

### Step 3: Approve or Reject
- **Approve**: Message will appear in future replay sessions
- **Reject/Hide**: Message hidden from future sessions
- Scripted messages always show (pre-planned content)

### Step 4: Future Viewers See Curated Chat
- Only approved messages + scripted messages
- Clean, professional chat experience
- No spam or off-topic content

---

## Technical Implementation

### Changed Files

**1. `/src/app/api/chat/route.ts`**
```typescript
// Before
isApproved: true // Auto-approve messages from registered attendees

// After  
isApproved: false // Needs approval to show in future sessions
```

**2. `/src/app/room/[slug]/page.tsx`**
```typescript
// Before
chatMessages: {
  where: {
    isHidden: false,
    OR: [
      { isScripted: true },
      { isApproved: true },
    ],
  }
}

// After
chatMessages: {
  where: {
    isHidden: false,
    // Fetch all non-hidden messages
    // Client handles filtering approved vs current session
  }
}
```

---

## User Experience

### For Attendees (No Change)
- Send messages normally during webinar
- See their message appear instantly
- See other attendees' messages in real-time
- Natural chat experience

### For Hosts (New Control)
- Review all messages in Chat Manager
- Approve good questions/comments
- Hide spam or off-topic messages
- Control what future viewers see

### For Future Viewers (Improved)
- See only approved + scripted messages
- Clean, professional chat timeline
- High-quality questions and responses
- No spam or noise

---

## Migration Notes

- **Existing messages**: Already approved messages remain approved
- **New messages**: All new attendee messages require approval
- **Scripted messages**: Always visible (no approval needed)
- **Backward compatible**: No data migration required

---

## Dashboard - Chat Manager

Messages now show three categories:

1. **Scripted Messages** (Blue badge)
   - Pre-written messages
   - Always visible in all sessions
   - Planned chat content

2. **Pending Messages** (Yellow badge)
   - Attendee messages awaiting approval
   - Visible in current session only
   - Needs host action

3. **Approved Messages** (Green badge)
   - Attendee messages approved by host
   - Visible in all sessions
   - Curated content

---

## Best Practices

### During Live Webinar
- Let chat flow naturally
- Don't worry about approving during live
- Focus on delivering content

### After Webinar
- Review pending messages
- Approve good questions
- Approve constructive comments
- Hide spam, duplicates, off-topic

### For Evergreen/Replay
- Curate best questions
- Keep chat professional
- Create engaging experience
- Show social proof

---

## Example Workflow

**Live Webinar (3:00 PM)**
```
Attendee: "Great presentation! How do I apply this?"
→ Appears instantly for all current viewers
→ Status: PENDING (isApproved: false)
```

**Later That Day (5:00 PM)**
```
Host reviews in Dashboard
→ Approves message
→ Status: APPROVED (isApproved: true)
```

**Future Replay (Next Week)**
```
New viewer watches recording
→ Sees approved message at correct timestamp
→ Professional, curated chat experience
```

---

## Troubleshooting

**Q: Why don't my messages appear in replay?**
A: New messages need host approval. Check with webinar host.

**Q: Can I approve messages during live webinar?**
A: Yes, but not required. Better to focus on delivery and approve later.

**Q: What happens to old approved messages?**
A: They remain approved. This only affects NEW messages.

**Q: Do scripted messages need approval?**
A: No, scripted messages (isScripted: true) always show automatically.

---

## Commit Reference

**Commit:** fdf4a04
**Message:** "fix: Update chat approval logic - show in current session but require approval for future sessions"
**Date:** Nov 20, 2025
**Files Changed:** 
- src/app/api/chat/route.ts
- src/app/room/[slug]/page.tsx
