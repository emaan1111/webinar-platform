# Chat & Reactions for Registered Attendees

## Overview
Registered attendees (who may not have a user account) can now send chat messages and reactions during webinars using their registration information.

## How It Works

### Database Changes

#### ChatMessage Model
```prisma
model ChatMessage {
  userId         String?       // Optional - for authenticated users
  user           User?         
  registrationId String?       // Optional - for registered attendees
  registration   Registration? 
  userName       String?       // Store name from registration or user
  // ... other fields
}
```

#### Reaction Model
```prisma
model Reaction {
  userId         String?       // Optional - for authenticated users
  user           User?         
  registrationId String?       // Optional - for registered attendees
  registration   Registration? 
  userName       String?       // Store name from registration or user
  // ... other fields
}
```

### API Endpoints

#### POST /api/chat
Send a chat message as either an authenticated user or registered attendee.

**Request Body:**
```json
{
  "webinarId": "string (required)",
  "message": "string (required)",
  "registrationId": "string (optional - required if not authenticated)"
}
```

**Authentication Options:**
1. **Authenticated User** - Has active session (higher priority)
2. **Registered Attendee** - Provides valid `registrationId`

**Response:**
```json
{
  "message": {
    "id": "string",
    "message": "string",
    "userName": "string",
    "userId": "string | null",
    "registrationId": "string | null",
    "isHidden": false,
    "isApproved": true,
    "createdAt": "timestamp"
  }
}
```

#### POST /api/webinars/[id]/reactions
Save a reaction as either an authenticated user or registered attendee.

**Request Body:**
```json
{
  "type": "heart | clap | thumbsUp (required)",
  "videoTimestamp": "number (required)",
  "registrationId": "string (optional - required if not authenticated)"
}
```

**Authentication Options:**
1. **Authenticated User** - Has active session (higher priority)
2. **Registered Attendee** - Provides valid `registrationId`

**Response:**
```json
{
  "success": true,
  "reaction": {
    "id": "string",
    "type": "string",
    "videoTimestamp": "number",
    "userName": "string",
    "createdAt": "timestamp"
  }
}
```

### Priority System

Both endpoints follow this priority:
1. **Authenticated User First** - If user is logged in, use their account
2. **Registered Attendee Fallback** - If no session but valid `registrationId` provided
3. **Deny Access** - If neither authenticated nor valid registration

### Validation

#### Registration Validation:
- Registration must exist in database
- Registration must be for the same webinar
- Registration ID must be valid

#### Message/Reaction Validation:
- All required fields must be provided
- Reaction type must be valid (heart, clap, thumbsUp)
- Video timestamp must be a positive number

## Frontend Integration

### Getting Registration ID

After a user registers for a webinar, the registration ID is returned:

```typescript
const response = await fetch(`/api/webinars/${webinarId}/register`, {
  method: 'POST',
  body: JSON.stringify({ name, email, phone, scheduleId })
});

const data = await response.json();
const registrationId = data.registrationId;

// Store in localStorage or state for later use
localStorage.setItem('registrationId', registrationId);
```

### Sending Chat Message

```typescript
// Get registrationId from storage or state
const registrationId = localStorage.getItem('registrationId');

await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    webinarId,
    message: 'Hello from registered attendee!',
    registrationId  // Include if not authenticated
  })
});
```

### Sending Reaction

```typescript
// Get registrationId from storage or state
const registrationId = localStorage.getItem('registrationId');

await fetch(`/api/webinars/${webinarId}/reactions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'heart',
    videoTimestamp: currentTime,
    registrationId  // Include if not authenticated
  })
});
```

## Security Features

- ✅ Validates registration belongs to the correct webinar
- ✅ Prevents unauthorized access without session or valid registration
- ✅ Stores attendee name with each message/reaction
- ✅ Auto-approves messages from registered attendees
- ✅ Maintains audit trail with registration information

## Benefits

1. **No Account Required** - Attendees can participate without creating an account
2. **Identity Tracking** - Messages/reactions linked to registration for analytics
3. **Name Display** - Shows actual attendee name from registration form
4. **Backward Compatible** - Authenticated users still work as before
5. **Secure** - Registration must match webinar to prevent unauthorized access

## Database Queries

### Get all chat messages for a webinar (including attendees):
```typescript
const messages = await prisma.chatMessage.findMany({
  where: { webinarId },
  include: {
    user: true,           // Authenticated user info
    registration: true,    // Registered attendee info
  },
  orderBy: { createdAt: 'asc' }
});
```

### Get all reactions for a webinar (including attendees):
```typescript
const reactions = await prisma.reaction.findMany({
  where: { webinarId },
  include: {
    user: true,           // Authenticated user info
    registration: true,    // Registered attendee info
  },
  orderBy: { videoTimestamp: 'asc' }
});
```

## Migration Notes

- Existing chat messages and reactions (with userId) will continue to work
- New messages/reactions can use registrationId instead
- userName field stores display name from either user account or registration
- Both userId and registrationId are optional, but at least one must be provided
