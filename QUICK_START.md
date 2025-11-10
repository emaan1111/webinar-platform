# Simulated Webinar Platform - API Quick Reference

## Chat Import/Export

### Import Scripted Chats (JSON)
```bash
POST /api/chat/import
Content-Type: application/json

{
  "webinarId": "webinar-id",
  "messages": [
    {
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "message": "Great content!",
      "videoTimestamp": 120
    }
  ]
}
```

### Import Scripted Chats (CSV)
```bash
POST /api/chat/import
Content-Type: multipart/form-data

file: chat-script.csv
webinarId: webinar-id
```

### Export Chat Messages
```bash
# As JSON
GET /api/chat/export?webinarId=xxx&format=json

# As CSV
GET /api/chat/export?webinarId=xxx&format=csv

# Only scripted messages
GET /api/chat/export?webinarId=xxx&format=csv&scriptedOnly=true
```

## Webinar Management

### Create Webinar with Video
```bash
POST /api/webinars
Content-Type: application/json

{
  "title": "My Webinar",
  "description": "Webinar description",
  "videoUrl": "https://youtube.com/watch?v=...",
  "videoDuration": 3600,
  "scheduledAt": "2024-12-01T14:00:00Z",
  "duration": 60,
  "scheduleType": "specific",
  "timezone": "America/New_York",
  "hasReplay": true,
  "hasChat": true,
  "hasOffers": true,
  "hasReactions": true
}
```

### Update Webinar
```bash
PATCH /api/webinars/:id
Content-Type: application/json

{
  "videoUrl": "https://vimeo.com/...",
  "videoDuration": 4200
}
```

## Offer Management

### Create Timed Offer
```bash
POST /api/offers
Content-Type: application/json

{
  "webinarId": "webinar-id",
  "title": "Special Discount!",
  "description": "50% off for the next 10 minutes",
  "price": 97,
  "ctaText": "Get 50% Off Now",
  "ctaUrl": "https://checkout.com/special-offer",
  "videoTimestamp": 1800,
  "hideAfter": 600
}
```

## Chat Operations

### Get All Chat Messages
```bash
GET /api/chat?webinarId=xxx
```

### Delete Chat Message
```bash
DELETE /api/chat/:id
```

## CSV Format for Chat Import

```csv
userName,userEmail,message,videoTimestamp
John Doe,john@example.com,Great presentation!,120
Jane Smith,jane@example.com,Love this!,180
```

See `sample-chat-script.csv` for a complete example with 45+ messages.

## Quick Start

1. **Create webinar** with video URL and duration
2. **Import chat script** using CSV file
3. **Add timed offers** at key moments
4. **Test playback** as attendee
5. **Launch** at scheduled time

## Files Created

- `SIMULATED_WEBINAR_GUIDE.md` - Complete documentation
- `sample-chat-script.csv` - Example chat script template
- `/api/chat/import/route.ts` - Import endpoint
- `/api/chat/export/route.ts` - Export endpoint
- Updated Prisma schema with video fields
- Updated webinar creation form

## Key Differences

This is a **simulated webinar** platform:
- ✅ Pre-recorded videos
- ✅ Scripted chat messages
- ✅ Automated playback
- ✅ AI-powered responses
- ✅ Unlimited scalability
- ❌ No live streaming
- ❌ No host required during playback
