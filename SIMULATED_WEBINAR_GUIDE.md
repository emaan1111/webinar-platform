# Simulated Webinar System - Complete Guide

## Overview

This platform is designed for **simulated/automated webinars** (similar to EverWebinar), NOT live webinars. The webinar plays a pre-recorded video at scheduled times, creating the illusion of a live event for attendees.

## Key Concepts

### 1. Pre-recorded Video
- Webinars use pre-recorded videos (YouTube, Vimeo, or direct upload)
- Videos play automatically at scheduled times
- Same video for both "live" and "replay" viewers

### 2. Scripted Chat Messages
- Chat messages are pre-written and appear at specific video timestamps
- Creates illusion of live interaction
- Hosts can import chat scripts via CSV or JSON
- Real attendees can also send messages (answered by AI)

### 3. Timed Offers
- Offers appear at specific points in the video timeline
- Triggered by video timestamp, not clock time
- Multiple offers can be configured per webinar

### 4. AI-Powered Responses
- OpenAI responds to real attendee questions
- Scripted messages continue to play in background
- Creates hybrid experience

## Database Schema Updates

### Webinar Model
```prisma
model Webinar {
  videoUrl      String?    // URL to pre-recorded video
  videoDuration Int?       // Video duration in seconds
  // ... other fields
}
```

### ChatMessage Model
```prisma
model ChatMessage {
  isScripted      Boolean  @default(false)  // Is this a scripted message?
  videoTimestamp  Int?                      // When to show (in seconds)
  // ... other fields
}
```

### Offer Model
```prisma
model Offer {
  videoTimestamp  Int      // When offer appears (in seconds)
  hideAfter       Int?     // Seconds after appearing to hide
  // ... other fields
}
```

## Chat Import/Export System

### Import Scripted Chats

**JSON Format:**
```json
{
  "webinarId": "webinar-id-here",
  "messages": [
    {
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "message": "Great presentation!",
      "videoTimestamp": 120
    },
    {
      "userName": "Jane Smith",
      "userEmail": "jane@example.com",
      "message": "Love this content!",
      "videoTimestamp": 180
    }
  ]
}
```

**CSV Format:**
```csv
userName,userEmail,message,videoTimestamp
John Doe,john@example.com,Great presentation!,120
Jane Smith,jane@example.com,Love this content!,180
Sarah Wilson,sarah@example.com,Very informative!,240
```

### Import API

**Endpoint:** `POST /api/chat/import`

**JSON Import:**
```bash
curl -X POST http://localhost:3000/api/chat/import \
  -H "Content-Type: application/json" \
  -d '{
    "webinarId": "your-webinar-id",
    "messages": [
      {
        "userName": "John Doe",
        "userEmail": "john@example.com",
        "message": "Great presentation!",
        "videoTimestamp": 120
      }
    ]
  }'
```

**CSV Import:**
```bash
curl -X POST http://localhost:3000/api/chat/import \
  -F "file=@chat-script.csv" \
  -F "webinarId=your-webinar-id"
```

**Response:**
```json
{
  "message": "Successfully imported 25 chat messages",
  "count": 25,
  "messages": [/* array of created messages */]
}
```

### Export API

**Endpoint:** `GET /api/chat/export`

**Export as JSON:**
```bash
curl "http://localhost:3000/api/chat/export?webinarId=xxx&format=json"
```

**Export as CSV:**
```bash
curl "http://localhost:3000/api/chat/export?webinarId=xxx&format=csv" \
  -o chat-export.csv
```

**Export Only Scripted Messages:**
```bash
curl "http://localhost:3000/api/chat/export?webinarId=xxx&format=csv&scriptedOnly=true"
```

## Creating a Simulated Webinar

### Step 1: Create Webinar with Video
1. Go to Dashboard → Webinars → New
2. Fill in basic information:
   - Title
   - Description
   - Pre-recorded Video URL (YouTube/Vimeo)
   - Video Duration (in seconds)
3. Choose schedule type:
   - **Specific**: One-time at specific date/time
   - **X Minutes from Now**: Starts X minutes after creation
   - **Recurring**: Daily/Weekly/Monthly at specific time
4. Set timezone
5. Enable features:
   - ✅ Replay Available
   - ✅ Chat Enabled
   - ✅ Offers Enabled
   - ✅ Reactions Enabled
6. Save as Draft or Schedule

### Step 2: Import Scripted Chat
1. Prepare CSV file with chat script:
   ```csv
   userName,userEmail,message,videoTimestamp
   Alice Johnson,alice@example.com,Excited for this!,30
   Bob Smith,bob@example.com,Thanks for hosting this,90
   Carol White,carol@example.com,Great explanation!,240
   ```
2. Import via API:
   ```bash
   curl -X POST http://localhost:3000/api/chat/import \
     -F "file=@my-chat-script.csv" \
     -F "webinarId=your-webinar-id"
   ```

### Step 3: Create Timed Offers
1. Go to Dashboard → Offers
2. Create new offer:
   - Title: "Special 50% Discount!"
   - Description
   - Price
   - CTA Button Text and URL
   - **Video Timestamp**: 1800 (30 minutes into video)
   - **Hide After**: 300 (hide after 5 minutes)
3. Save offer

### Step 4: Add Bonus Resources
1. Go to Dashboard → Resources
2. Upload resources:
   - PDF guides
   - Video tutorials
   - Templates
3. Set availability (public or private)

## How It Works During Playback

### Timeline Synchronization
When a viewer watches the webinar:

1. **Video Starts**: Pre-recorded video begins playing
2. **Chat Messages Appear**: At each `videoTimestamp`, scripted messages appear
3. **Offers Pop Up**: At specified timestamps, offer modals appear
4. **AI Responds**: Real attendee questions get AI responses
5. **Resources Available**: Bonus materials accessible throughout

### Example Timeline
```
00:00 - Video starts
00:30 - Scripted chat: "Excited for this!"
01:30 - Scripted chat: "Thanks for hosting"
04:00 - Scripted chat: "Great explanation"
10:00 - First offer appears
15:00 - First offer auto-hides
30:00 - Second offer appears
45:00 - Resources reminder
60:00 - Final CTA
```

## Best Practices

### Chat Script Creation
1. **Timing**: Spread messages throughout video (every 1-3 minutes)
2. **Variety**: Mix questions, comments, and reactions
3. **Authenticity**: Use diverse names and realistic messages
4. **Engagement**: Include messages that trigger discussion

### Offer Timing
1. **Build Value First**: Don't show offers too early
2. **Multiple Touchpoints**: 2-3 offers at key moments
3. **Scarcity**: Use time-limited offers effectively
4. **Clear CTA**: Make offers compelling and actionable

### Video Selection
1. **High Quality**: Professional production value
2. **Engaging**: Dynamic content that holds attention
3. **Timed Correctly**: Match video duration to webinar duration
4. **Clear Audio**: Essential for good experience

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/webinars` | POST | Create webinar with video |
| `/api/webinars/:id` | PATCH | Update webinar details |
| `/api/chat/import` | POST | Import scripted chat messages |
| `/api/chat/export` | GET | Export chat messages |
| `/api/chat` | GET | Get all chat messages |
| `/api/chat/:id` | DELETE | Delete chat message |
| `/api/offers` | POST | Create timed offer |
| `/api/offers/:id` | PATCH | Update offer |
| `/api/resources` | POST | Add bonus resource |

## Feature Toggles

Each webinar can independently enable/disable:
- **hasReplay**: Allow viewing after scheduled time
- **hasChat**: Enable chat functionality
- **hasOffers**: Show timed offers
- **hasReactions**: Enable reaction buttons

## Differences from Live Webinars

| Feature | Live (Zoom) | Simulated (EverWebinar) |
|---------|-------------|-------------------------|
| Video | Live stream | Pre-recorded |
| Chat | Real-time | Scripted + AI |
| Host Present | Yes | No |
| Scalability | Limited | Unlimited |
| Consistency | Varies | Identical every time |
| Setup Time | 30 min prep | Once per video |
| Attendee Limit | Depends on plan | No limit |

## Next Steps

1. ✅ Database schema updated
2. ✅ Chat import/export APIs created
3. ✅ Webinar form updated with video fields
4. ⏳ Build video player interface
5. ⏳ Implement chat playback system
6. ⏳ Create offer popup system
7. ⏳ Integrate OpenAI for real responses
8. ⏳ Build attendee-facing pages
9. ⏳ Add analytics tracking

## Testing Your Setup

1. Create a test webinar with a YouTube video
2. Import a small chat script (5-10 messages)
3. Create one test offer
4. View the webinar as an attendee
5. Verify messages appear at correct timestamps
6. Check offer popup timing
7. Test real chat with AI responses

---

**Remember**: This is a simulated live experience, not actual live streaming. The goal is to create an engaging, scalable webinar that feels live to attendees while being completely automated for the host.
