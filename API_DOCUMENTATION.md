# API Endpoints Documentation

## Authentication

### POST /api/auth/signup
Create a new user account
**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

### POST /api/auth/[...nextauth]
NextAuth.js authentication endpoints (handled automatically)

## Webinars

### GET /api/webinars
Get all webinars for the authenticated user
**Query params:**
- None (returns webinars where user is host)

### POST /api/webinars
Create a new webinar
**Body:**
```json
{
  "title": "My Webinar",
  "description": "Description",
  "scheduledAt": "2025-11-15T10:00:00Z",
  "duration": 60,
  "maxAttendees": 100,
  "thumbnail": "https://...",
  "status": "SCHEDULED"
}
```

## Attendees

### GET /api/attendees
Get all attendees for user's webinars
**Query params:**
- `webinarId` (optional): Filter by webinar
- `search` (optional): Search by name or email
- `status` (optional): Filter by `attended`, `all`

### PATCH /api/attendees
Update attendee status
**Body:**
```json
{
  "id": "attendee_id",
  "attended": true
}
```

## Chat

### GET /api/chat
Get chat messages for user's webinars
**Query params:**
- `webinarId` (optional): Filter by webinar
- `search` (optional): Search messages

### POST /api/chat
Send a chat message
**Body:**
```json
{
  "webinarId": "webinar_id",
  "message": "Hello everyone!"
}
```

### PATCH /api/chat
Update message visibility
**Body:**
```json
{
  "id": "message_id",
  "isHidden": true
}
```

## Analytics

### GET /api/analytics
Get analytics data for user's webinars
**Query params:**
- `dateRange` (optional): `7d`, `30d`, `90d`, `1y`

**Response:**
```json
{
  "summary": {
    "totalRegistrations": 150,
    "totalAttendees": 120,
    "attendanceRate": 80.0,
    "totalEngagement": 450
  },
  "registrationTrends": [...],
  "attendanceByWebinar": [...],
  "engagement": [...],
  "peakViewingTimes": [...]
}
```

## Offers

### GET /api/offers
Get all offers for user's webinars
**Query params:**
- `webinarId` (optional): Filter by webinar

### POST /api/offers
Create a new offer
**Body:**
```json
{
  "webinarId": "webinar_id",
  "title": "Special Discount",
  "description": "50% off",
  "price": 299,
  "ctaText": "Claim Now",
  "ctaUrl": "https://...",
  "showAtMinutes": 30,
  "durationMinutes": 10
}
```

### PATCH /api/offers
Update an offer
**Body:**
```json
{
  "id": "offer_id",
  "title": "Updated Title",
  ...
}
```

### DELETE /api/offers?id=offer_id
Delete an offer

## Resources

### GET /api/resources
Get all bonus resources for user's webinars
**Query params:**
- `webinarId` (optional): Filter by webinar

### POST /api/resources
Create a new resource
**Body:**
```json
{
  "webinarId": "webinar_id",
  "title": "Course Slides",
  "description": "PDF slides",
  "fileUrl": "https://...",
  "fileType": "pdf",
  "fileSize": 2048576,
  "isPublic": false
}
```

### PATCH /api/resources
Update a resource
**Body:**
```json
{
  "id": "resource_id",
  "title": "Updated Title",
  ...
}
```

### DELETE /api/resources?id=resource_id
Delete a resource

### PUT /api/resources?id=resource_id
Track a download (increments download count)

## Authentication Required

All endpoints except `/api/auth/signup` and `/api/auth/[...nextauth]` require authentication via NextAuth.js session.

## Error Responses

All endpoints return standard error responses:
```json
{
  "error": "Error message"
}
```

Status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error
