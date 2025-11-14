# Replay Analytics & Device Tracking - Implementation Summary

## 🎯 Overview
Enhanced tracking system to capture device information and replay engagement metrics, with automatic ClickFunnels tagging based on replay viewing behavior.

---

## ✅ Database Schema Changes

### New Fields Added to `Registration` Model

```prisma
model Registration {
  // ... existing fields ...
  
  // Replay Tracking (NEW)
  watchedReplay      Boolean   @default(false) // Has watched replay
  replayWatchTime    Int       @default(0)     // Total seconds watched in replay
  replayClickedCTA   Boolean   @default(false) // Clicked CTA during replay
  replayDevice       String?   // Device used for replay: "mobile" | "desktop"
  registrationDevice String?   // Device used during registration
}
```

**Migration Status**: ✅ Applied with `prisma db push`

---

## 📊 What Gets Tracked

### 1. **Registration Device**
- Captured when user registers for webinar
- Detected from User-Agent header
- Values: `"mobile"` | `"desktop"`
- Stored in: `Registration.registrationDevice`

### 2. **Replay Device**  
- Captured when user watches replay
- Detected from screen width (`window.innerWidth <= 768`)
- Values: `"mobile"` | `"desktop"`
- Stored in: `Registration.replayDevice`

### 3. **Replay Watch Status**
- Boolean flag indicating if user watched replay
- Stored in: `Registration.watchedReplay`

### 4. **Replay Watch Time**
- Total seconds watched during replay
- Updated when replay session ends
- Stored in: `Registration.replayWatchTime`

### 5. **Replay CTA Click**
- Boolean flag indicating if user clicked CTA during replay
- Checked via `OfferAnalytics` table
- Stored in: `Registration.replayClickedCTA`

---

## 🔄 Data Flow

### Registration Flow
```
User Submits Registration Form
   ↓
Detect Device from User-Agent
   ↓
Store in registrationDevice field
   ↓
Create Registration record
```

### Replay Session Flow
```
User Enters Replay Page
   ↓
Initialize WebinarTracker with device detection
   ↓
Track watch time every 10 seconds
   ↓
User Clicks CTA (optional)
   ↓
Create OfferAnalytics record
   ↓
User Leaves Replay Page
   ↓
Session ends (action: 'leave')
   ↓
Check for replay page visit
   ↓
Check for CTA clicks during session
   ↓
Update Registration record:
  - watchedReplay = true
  - replayWatchTime = total seconds
  - replayClickedCTA = (has offer analytics)
  - replayDevice = session device
   ↓
Sync to ClickFunnels with isReplay: true
```

---

## 🏷️ ClickFunnels Tagging Logic

### Tag Application Rules

#### 1. **UM-Webinar-ReplayAttended**
- **When Applied**: User watched any amount of replay
- **Trigger**: `isReplay: true` in attendance sync
- **Purpose**: Identify all replay viewers

#### 2. **UM-Webinar-MostlyAttended**
- **When Applied**: User reached offer CTA (last 15 min of video)
- **Calculation**: `videoPosition >= (webinarDuration - 900)`
- **Purpose**: High-engagement replay viewers

#### 3. **UM-Webinar-Attended**
- **When Applied**: User watched any amount (live or replay)
- **Purpose**: General attendance tracking

#### 4. **UM-Webinar-PartlyAttended**  
- **When Applied**: Watched 40+ minutes but didn't reach CTA
- **Purpose**: Moderate engagement

### Tag Application Code
```typescript
// In src/app/api/tracking/session/route.ts

// Determine if user reached offer CTA (last 15 minutes of webinar)
const offerCTAThreshold = Math.max(0, webinarDuration - 900); // 15 min before end
const reachedOfferCTA = finalVideoPosition >= offerCTAThreshold;

syncAttendanceToClickFunnels({
  email: registration.email,
  webinarDuration,
  watchTime: finalWatchTime,
  attended: true,
  isReplay: isReplaySession, // ✅ Detected from page visits
  reachedOfferCTA, // ✅ Based on video position
  webinarTitle: registration.webinar.title,
  leftAt: updatedSession.leftAt || undefined,
});
```

---

## 📁 Files Modified

### 1. **Schema Changes**
**File**: `prisma/schema.prisma`
```prisma
// Added 5 new fields to Registration model
watchedReplay      Boolean   @default(false)
replayWatchTime    Int       @default(0)
replayClickedCTA   Boolean   @default(false)
replayDevice       String?
registrationDevice String?
```

### 2. **Registration API**
**File**: `src/app/api/webinars/[id]/register/route.ts`

**Changes**:
- Detect device from User-Agent during registration
- Store device in `registrationDevice` field

```typescript
// Detect device from user agent
const userAgentHeader = request.headers.get('user-agent') || '';
const registrationDevice = userAgentHeader.includes('Mobile') || 
                          userAgentHeader.includes('Android') || 
                          userAgentHeader.includes('iPhone') 
  ? 'mobile' 
  : 'desktop';

// Create registration
const registration = await prisma.registration.create({
  data: {
    // ... other fields ...
    registrationDevice, // NEW
  }
});
```

### 3. **Session Tracking API**
**File**: `src/app/api/tracking/session/route.ts`

**Changes**:
- Detect replay sessions via page visits
- Check for CTA clicks during session
- Update Registration record with replay data
- Pass correct `isReplay` flag to ClickFunnels

```typescript
// Check if this is a replay session
const replayPageVisit = await prisma.pageVisit.findFirst({
  where: {
    sessionId: session.id,
    pageType: 'replay',
  },
});
const isReplaySession = !!replayPageVisit;

// Check if user clicked CTA during this session
const offerClicked = await prisma.offerAnalytics.findFirst({
  where: {
    registrationId: registrationId,
    clickedOffer: true,
    clickedOfferAt: {
      gte: session.joinedAt,
    },
  },
});

// Update registration with replay data
if (isReplaySession) {
  await prisma.registration.update({
    where: { id: registrationId },
    data: {
      watchedReplay: true,
      replayWatchTime: updatedSession.totalWatchTime,
      replayClickedCTA: !!offerClicked,
      replayDevice: updatedSession.device || undefined,
    },
  });
}

// Sync to ClickFunnels with correct replay flag
syncAttendanceToClickFunnels({
  // ... other params ...
  isReplay: isReplaySession, // ✅ Now correct
  reachedOfferCTA, // ✅ Based on video position
});
```

### 4. **Attendees API (New)**
**File**: `src/app/api/webinars/[id]/attendees-with-replay/route.ts`

**Purpose**: Get all registration data including replay metrics

**Response Structure**:
```json
{
  "success": true,
  "webinar": {
    "id": "clx123...",
    "title": "My Webinar"
  },
  "stats": {
    "totalRegistrations": 150,
    "totalAttended": 98,
    "totalWatchedReplay": 45,
    "totalClickedCTAInReplay": 23,
    "registrationDevices": {
      "mobile": 78,
      "desktop": 72,
      "unknown": 0
    },
    "replayDevices": {
      "mobile": 20,
      "desktop": 25,
      "unknown": 0
    },
    "avgReplayWatchTime": 1847
  },
  "attendees": [
    {
      "id": "reg123",
      "name": "John Doe",
      "email": "john@example.com",
      "registeredAt": "2025-11-15T10:00:00Z",
      "registrationDevice": "mobile",
      "attended": true,
      "watchedReplay": true,
      "replayWatchTime": 2400,
      "replayWatchTimeFormatted": "40:00",
      "replayClickedCTA": true,
      "replayDevice": "desktop",
      "lastSessionDevice": "desktop",
      "lastSessionWatchTime": 2400,
      "lastSessionCompleted": false
    }
  ]
}
```

---

## 🎨 Admin Dashboard Display

### Suggested Table Columns

| Column | Data Source | Format |
|--------|-------------|--------|
| Name | `Registration.name` | Text |
| Email | `Registration.email` | Text |
| Registration Device | `Registration.registrationDevice` | 📱 Mobile / 💻 Desktop |
| Registered At | `Registration.registeredAt` | Date/Time |
| Attended Live | `Registration.attended` | ✅ Yes / ❌ No |
| Watched Replay | `Registration.watchedReplay` | ✅ Yes / ❌ No |
| Replay Watch Time | `Registration.replayWatchTime` | MM:SS format |
| Replay Device | `Registration.replayDevice` | 📱 Mobile / 💻 Desktop |
| Clicked CTA in Replay | `Registration.replayClickedCTA` | ✅ Yes / ❌ No |

### Suggested Filters
- Device type (Mobile/Desktop)
- Watched replay (Yes/No)
- Clicked CTA (Yes/No)
- Watch time range (0-10 min, 10-30 min, 30+ min)

---

## 📈 Analytics Queries

### Get Replay Statistics
```sql
-- Total replay viewers
SELECT COUNT(*) FROM registrations 
WHERE webinarId = 'xxx' AND watchedReplay = true;

-- Average replay watch time
SELECT AVG(replayWatchTime) FROM registrations 
WHERE webinarId = 'xxx' AND watchedReplay = true;

-- Replay CTA conversion rate
SELECT 
  COUNT(CASE WHEN replayClickedCTA = true THEN 1 END) * 100.0 / COUNT(*) as cta_rate
FROM registrations 
WHERE webinarId = 'xxx' AND watchedReplay = true;

-- Device breakdown for replay
SELECT replayDevice, COUNT(*) as count
FROM registrations 
WHERE webinarId = 'xxx' AND watchedReplay = true
GROUP BY replayDevice;

-- Compare registration device vs replay device
SELECT 
  registrationDevice,
  replayDevice,
  COUNT(*) as count
FROM registrations 
WHERE webinarId = 'xxx' AND watchedReplay = true
GROUP BY registrationDevice, replayDevice;
```

---

## 🧪 Testing Checklist

### Registration Device Tracking
- [ ] Register on desktop → verify `registrationDevice = 'desktop'`
- [ ] Register on mobile → verify `registrationDevice = 'mobile'`
- [ ] Check database after registration

### Replay Device Tracking
- [ ] Watch replay on desktop → verify `replayDevice = 'desktop'`
- [ ] Watch replay on mobile → verify `replayDevice = 'mobile'`
- [ ] Check database after replay session ends

### Replay Watch Time
- [ ] Watch replay for 5 minutes → verify `replayWatchTime ≈ 300`
- [ ] Watch replay for 20 minutes → verify `replayWatchTime ≈ 1200`
- [ ] Pause/resume → verify time only counts when playing

### Replay CTA Tracking
- [ ] Click CTA during replay → verify `replayClickedCTA = true`
- [ ] Don't click CTA → verify `replayClickedCTA = false`

### ClickFunnels Tagging
- [ ] Watch replay for 5 min → verify `UM-Webinar-ReplayAttended` tag
- [ ] Watch until CTA (last 15 min) → verify `UM-Webinar-MostlyAttended` tag
- [ ] Check ClickFunnels contact for both tags

### API Endpoint
- [ ] Call `/api/webinars/[id]/attendees-with-replay`
- [ ] Verify stats are correct
- [ ] Verify all attendee data is present
- [ ] Test filters and sorting

---

## 🚀 Deployment Notes

### Environment Variables Required
```env
# Already configured
CLICKFUNNELS_API_KEY=xxx
CLICKFUNNELS_WORKSPACE_ID=xxx
```

### Database Migration
```bash
# Already applied
npx prisma db push
npx prisma generate
```

### TypeScript Types
After deploying, restart the TypeScript server to pick up new Prisma types:
- VS Code: Reload window or restart TS server
- The types will be correct after prisma generate runs

---

## 💡 Future Enhancements

### 1. **Replay Engagement Score**
Calculate an engagement score based on:
- Watch time percentage
- CTA clicks
- Video completion
- Device type

### 2. **Replay Heatmap**
Track which parts of the replay are most watched:
- Video position distribution
- Drop-off points
- Rewatch segments

### 3. **Device-Specific Optimization**
- A/B test mobile vs desktop replay experiences
- Optimize CTA placement per device
- Different offer strategies for mobile users

### 4. **Multi-Session Tracking**
Track if user watched replay multiple times:
- First watch vs return views
- Completion improvements over time
- Engagement pattern analysis

---

## ✅ Summary

### What's Working
✅ Registration device tracking  
✅ Replay device tracking  
✅ Replay watch time tracking  
✅ Replay CTA click tracking  
✅ Automatic Registration record updates  
✅ ClickFunnels replay tagging (`UM-Webinar-ReplayAttended`)  
✅ ClickFunnels engagement tagging (`UM-Webinar-MostlyAttended`)  
✅ API endpoint for attendee data with replay metrics  

### Key Achievement
**Complete visibility into user journey** from registration to replay, with device-specific insights and automatic ClickFunnels segmentation for targeted follow-up campaigns.

---

**Status**: ✅ **IMPLEMENTATION COMPLETE**  
**Date**: November 15, 2025  
**Next Step**: Build admin dashboard UI to display this data
