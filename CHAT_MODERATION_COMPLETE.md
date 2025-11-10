# Chat Moderation System - Complete Guide

## Overview
The chat moderation system allows webinar hosts to manage chat messages with full control over visibility, approval status, and deletion.

## Features

### 1. ✅ Message Approval/Rejection
- **Approve**: Makes message visible to all future viewers
- **Reject**: Hides message from viewers (but keeps in database)
- Status badges show approval state:
  - 🟢 **Green "Approved"** - Message approved and visible
  - 🟡 **Yellow "Pending"** - Message awaiting moderation

### 2. 👁️ Visibility Control
- **Show/Hide Toggle**: Control message visibility independently
- **Red "Hidden"** badge indicates hidden messages
- Hidden messages appear with strikethrough text

### 3. 🗑️ Permanent Deletion
- **Delete Button**: Permanently removes message from database
- Confirmation dialog prevents accidental deletion
- Once deleted, cannot be recovered

### 4. 📊 Statistics Dashboard
- **Total Messages**: Count of all messages
- **Hidden Messages**: Count of hidden messages
- **Moderated Messages**: Count of processed messages

### 5. 🔍 Advanced Filtering
- **Search**: Filter by message content or user name
- **Webinar Filter**: Show messages from specific webinar
- **Status Filter**: Filter by visible/hidden status

### 6. 📤 Export Options
- **JSON Export**: Structured data export
- **TXT Export**: Plain text chat log

## User Interface

### Message Card Layout
```
┌─────────────────────────────────────────────────────────┐
│ [Avatar] John Doe  12:34 PM  [Approved] [Hidden]       │
│          This is a chat message                         │
│          Webinar: My Awesome Webinar                    │
│                                                          │
│          [Approve/Reject] [Show/Hide] [Delete]          │
└─────────────────────────────────────────────────────────┘
```

### Action Buttons
1. **Approve** (Primary Blue) - Shows when message is pending/rejected
2. **Reject** (Secondary Gray) - Shows when message is approved
3. **Show/Hide** (Secondary Gray) - Toggles visibility
4. **Delete** (Danger Red) - Permanently removes message

## API Endpoints

### GET /api/chat
**Purpose**: Fetch all chat messages for user's webinars

**Query Parameters:**
- `webinarId` (optional) - Filter by specific webinar
- `search` (optional) - Search in message content and user names

**Response:**
```json
{
  "messages": [
    {
      "id": "msg_123",
      "userId": "user_456",
      "message": "Hello everyone!",
      "isHidden": false,
      "isApproved": true,
      "createdAt": "2025-11-04T12:34:56Z",
      "user": {
        "id": "user_456",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "webinar": {
        "id": "webinar_789",
        "title": "My Webinar"
      }
    }
  ]
}
```

### PATCH /api/chat
**Purpose**: Update message visibility and approval status

**Request Body:**
```json
{
  "id": "msg_123",
  "isHidden": false,
  "isApproved": true
}
```

**Response:**
```json
{
  "message": {
    "id": "msg_123",
    "isHidden": false,
    "isApproved": true,
    ...
  }
}
```

### DELETE /api/chat/[id]
**Purpose**: Permanently delete a chat message

**Request:** DELETE `/api/chat/msg_123`

**Response:**
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

## Database Schema

### ChatMessage Model
```prisma
model ChatMessage {
  id             String   @id @default(cuid())
  webinarId      String
  userId         String?
  userName       String   // Display name
  message        String   // Message content
  videoTimestamp Int?     // When message appears in video
  isScripted     Boolean  @default(false) // Pre-planned message
  isApproved     Boolean  @default(false) // Moderator approved
  isHidden       Boolean  @default(false) // Hidden from viewers
  createdAt      DateTime @default(now())
  
  user           User?    @relation(fields: [userId], references: [id])
  webinar        Webinar  @relation(fields: [webinarId], references: [id])
}
```

## Workflow

### New Message Flow
1. **User sends message** in live webinar
2. Message saved with:
   - `isApproved: false` (pending)
   - `isHidden: true` (hidden until approved)
3. **User sees own message** immediately (optimistic UI)
4. **Other viewers don't see** until approved
5. **Moderator reviews** in dashboard
6. **Moderator approves/rejects/deletes**
7. **Approved messages visible** to all future viewers at timestamp

### Moderation Actions
```
┌──────────────────────────────────────────────────────┐
│  New Message (Pending)                               │
│    ↓                                                  │
│  [Approve] → isApproved=true, isHidden=false         │
│  [Reject]  → isApproved=false, isHidden=true         │
│  [Delete]  → Permanently removed from database       │
└──────────────────────────────────────────────────────┘
```

## Frontend Implementation

### State Management
```typescript
const [messages, setMessages] = useState<ChatMessage[]>([])
const [loading, setLoading] = useState(true)
const [searchQuery, setSearchQuery] = useState('')
const [webinarFilter, setWebinarFilter] = useState('all')
const [statusFilter, setStatusFilter] = useState('all')
```

### Key Functions

**Approve/Reject:**
```typescript
const handleApproveMessage = async (id: string, approve: boolean) => {
  const response = await fetch('/api/chat', {
    method: 'PATCH',
    body: JSON.stringify({
      id,
      isApproved: approve,
      isHidden: !approve
    })
  })
  
  if (response.ok) {
    // Update local state
    setMessages(messages.map(msg => 
      msg.id === id ? { ...msg, isApproved: approve, isHidden: !approve } : msg
    ))
  }
}
```

**Delete:**
```typescript
const handleDeleteMessage = async (id: string) => {
  if (!confirm('Are you sure?')) return
  
  const response = await fetch(`/api/chat/${id}`, {
    method: 'DELETE'
  })
  
  if (response.ok) {
    setMessages(messages.filter(msg => msg.id !== id))
  }
}
```

**Toggle Visibility:**
```typescript
const handleToggleVisibility = async (id: string) => {
  const message = messages.find(msg => msg.id === id)
  
  const response = await fetch('/api/chat', {
    method: 'PATCH',
    body: JSON.stringify({
      id,
      isHidden: !message.isHidden
    })
  })
  
  if (response.ok) {
    setMessages(messages.map(msg => 
      msg.id === id ? { ...msg, isHidden: !msg.isHidden } : msg
    ))
  }
}
```

## Security

### Authorization
- ✅ Only webinar host can moderate their messages
- ✅ Server-side verification of ownership
- ✅ Session-based authentication (NextAuth)

### Verification Flow
```typescript
// 1. Verify user session
const session = await getServerSession(authOptions)
if (!session?.user?.email) return 401

// 2. Find user in database
const user = await prisma.user.findUnique({
  where: { email: session.user.email }
})

// 3. Verify message belongs to user's webinar
const message = await prisma.chatMessage.findFirst({
  where: {
    id: messageId,
    webinar: {
      hostId: user.id
    }
  }
})

if (!message) return 404
```

## Best Practices

### For Moderators
1. **Review regularly**: Check pending messages frequently
2. **Approve quickly**: Don't keep users waiting too long
3. **Be consistent**: Apply moderation rules fairly
4. **Use hide wisely**: Hidden messages still in database
5. **Delete sparingly**: Only for spam/abuse
6. **Export regularly**: Backup chat logs for records

### For Developers
1. **Always verify ownership**: Check webinar.hostId matches user.id
2. **Use transactions**: For complex multi-step operations
3. **Soft delete option**: Consider adding deletedAt instead of hard delete
4. **Audit logging**: Track who approved/rejected/deleted what
5. **Rate limiting**: Prevent spam submissions
6. **Batch operations**: Add "Approve All" / "Delete All" for efficiency

## Testing Checklist

### Approval System
- [ ] Approve pending message → Shows "Approved" badge
- [ ] Reject approved message → Shows "Pending" badge
- [ ] Approved message visible in live room
- [ ] Rejected message hidden in live room
- [ ] User sees own message immediately (optimistic UI)

### Visibility Control
- [ ] Hide visible message → Shows "Hidden" badge + strikethrough
- [ ] Show hidden message → Removes "Hidden" badge
- [ ] Hidden message not visible in live room
- [ ] Shown message visible in live room (if approved)

### Deletion
- [ ] Delete button shows confirmation dialog
- [ ] Confirm deletion → Message removed from list
- [ ] Cancel deletion → Message remains
- [ ] Deleted message removed from database
- [ ] Deleted message not visible in live room

### Filtering
- [ ] Search by message content works
- [ ] Search by user name works
- [ ] Webinar filter shows correct messages
- [ ] Status filter (visible/hidden) works
- [ ] Filters combine correctly (AND logic)

### Export
- [ ] JSON export contains all filtered messages
- [ ] TXT export formatted correctly
- [ ] Exports include timestamps and user names
- [ ] File downloads with correct name

### Security
- [ ] Non-host cannot access other host's messages
- [ ] Unauthenticated users redirected to login
- [ ] API returns 401 for unauthorized requests
- [ ] API returns 404 for non-owned messages

## Troubleshooting

### Message not updating
- Check browser console for errors
- Verify API endpoint responding (Network tab)
- Check server logs for errors
- Ensure user has permission

### Messages not showing in live room
- Check `isApproved` is `true`
- Check `isHidden` is `false`
- Check `videoTimestamp` is correct
- Verify query filters in room page

### Delete not working
- Check confirmation dialog appearing
- Verify API route exists: `/api/chat/[id]/route.ts`
- Check ownership verification
- Look for database connection errors

## Future Enhancements

1. **Bulk Actions**
   - Select multiple messages
   - Approve/reject/delete in batch
   - "Select All" checkbox

2. **Advanced Filters**
   - Filter by approval status
   - Filter by date range
   - Filter by specific user

3. **Auto-Moderation**
   - Profanity filter
   - Spam detection
   - Auto-approve trusted users

4. **Moderation History**
   - Track who approved/rejected
   - Audit log of all actions
   - Undo capability

5. **Real-Time Updates**
   - WebSocket for live updates
   - Toast notifications for new messages
   - Auto-refresh every X seconds

6. **Reply System**
   - Moderators can reply to messages
   - Pin important messages
   - Highlight staff responses

---

**Last Updated:** November 4, 2025  
**Status:** ✅ Fully Implemented  
**Version:** 1.0.0
