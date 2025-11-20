# ClickFunnels Attendance Tagging - How It Actually Works

## The Core Concept

**Tags are applied AFTER the webinar broadcast ends (scheduledStartTime + duration), NOT when individual users leave.**

Think of it like this: Everyone who registered for the same webinar time gets tagged together AFTER that webinar ends, regardless of when they individually left.

## Real-World Example

**Webinar Setup:**
- Scheduled: 6:00 PM - 7:00 PM (60 minutes)
- Threshold: 45 minutes (2700 seconds)
- **Cron job runs**: Every 5 minutes

**User Scenarios:**

### User A - Early Leaver
- ⏰ Joins: 6:05 PM
- 🚪 Leaves: 6:45 PM  
- ⏱️ Watch time: 40 minutes
- **🏷️ Tag Applied: PARTLY_ATTENDED (at 7:10 PM by cron job)**
- Why? They watched 40 minutes (less than 45 min threshold). Tag waits until webinar ends.

### User B - Stayed Late
- ⏰ Joins: 6:10 PM
- 🚪 Leaves: 7:05 PM
- ⏱️ Watch time: 55 minutes
- **🏷️ Tag Applied: MOSTLY_ATTENDED (at 7:10 PM by cron job)**
- Why? They watched 55 minutes (more than 45 min threshold). Tag waits until webinar ends.

### User C - Perfect Attendee
- ⏰ Joins: 6:00 PM
- 🚪 Leaves: 7:00 PM
- ⏱️ Watch time: 60 minutes
- **🏷️ Tag Applied: MOSTLY_ATTENDED (at 7:10 PM by cron job)**
- Why? They watched 60 minutes. Tag waits until webinar ends.

### User D - No Show
- ⏰ Never joins
- **🏷️ Tag Applied: MISSED (at 7:10 PM by cron job)**
- Why? They registered but never attended. Tagged when webinar ends.

### User E - Still Watching After Broadcast
- ⏰ Joins: 6:55 PM
- 🚪 Still watching at 7:10 PM (hasn't left yet)
- ⏱️ Watch time so far: 15 minutes
- **🏷️ Tag Applied: PARTLY_ATTENDED (at 7:10 PM by cron job)**
- Why? Cron runs after webinar ends, tags based on watch time UP TO THAT POINT.

## What "Session End" Means

**"Session End" = When the WEBINAR BROADCAST stops (scheduledStartTime + duration)**

It does NOT mean when individual users close their browsers.

### Code Logic:
```typescript
// Webinar scheduled for 6:00 PM, duration 60 minutes
scheduledStartTime = "2024-01-15 18:00:00"
duration = 60 // minutes

// Calculate when webinar broadcast ends
sessionEnd = scheduledStartTime + (duration * 60 * 1000)
sessionEnd = "2024-01-15 19:00:00" // 7:00 PM

// Cron job runs at 7:10 PM
now = "2024-01-15 19:10:00"

// Check if webinar has ended
if (sessionEnd <= now) {
  // Yes! Tag everyone who was registered for this time
  tagAllRegistrations()
}
```

## How The System Works

### 1. Real-Time Tracking (Frontend)
```typescript
// Video player updates every 5 seconds
updateWatchPosition(currentTime) {
  // Saves to database: registration.lastWatchedPosition
  // Updates: registration.attended = true
}
```

### 2. Session End Detection (Backend)
```typescript
// When user leaves/closes tab
onBeforeUnload() {
  // API call to update session.leftAt
  // Triggers tag application if session ended
}
```

### 3. Tag Application (Immediate)
```typescript
// Function: applyAttendanceTagOnSessionEnd()

// Step 1: Check if session ended
sessionEndTime = scheduledStartTime + duration
if (now > sessionEndTime) {
  // Session has ended
}

// Step 2: Calculate watch time
totalWatchTime = sum of all session.watchDuration
OR use registration.lastWatchedPosition as fallback

// Step 3: Determine tag
if (!attended) {
  tag = "MISSED"
} else if (watchTime >= threshold) {
  tag = "MOSTLY_ATTENDED"  // Watched ≥45 minutes
} else if (watchTime > 0) {
  tag = "PARTLY_ATTENDED"   // Watched <45 minutes
} else {
  tag = "ATTENDED"          // Default
}

// Step 4: Apply tag to ClickFunnels
tagClickFunnelsContact(email, tagId)

// Step 5: Mark as tagged
registration.attendanceTagsApplied = true
```

### 4. Cron Job (Backup Processing)
```typescript
// Runs every 5 minutes
// Function: processEndedSessionsAttendanceTags()

// Find registrations where:
// 1. attendanceTagsApplied = false
// 2. scheduledStartTime + duration < now (session ended)

// Apply tags for any missed ones
```

## The Four Tags

### 1. MISSED
- **When Applied**: Never joined the webinar
- **Triggered**: By cron job after webinar broadcast ends
- **Example**: Registered at 5:00 PM, never joined, tagged at 7:10 PM (after webinar ends)
- **ClickFunnels Tag**: `UM-Webinar-Missed`

### 2. ATTENDED
- **When Applied**: Joined but no threshold configured
- **Triggered**: By cron job after webinar broadcast ends
- **Example**: Watched 10 minutes, no threshold set, tagged at 7:10 PM
- **ClickFunnels Tag**: `UM-Webinar-Attended`

### 3. PARTLY_ATTENDED
- **When Applied**: Watched LESS than threshold
- **Triggered**: By cron job after webinar broadcast ends
- **Example**: Watched 30 minutes (threshold 45 min), tagged at 7:10 PM
- **ClickFunnels Tag**: `UM-Webinar-PartlyAttended`

### 4. MOSTLY_ATTENDED
- **When Applied**: Watched MORE than threshold
- **Triggered**: By cron job after webinar broadcast ends
- **Example**: Watched 50 minutes (threshold 45 min), tagged at 7:10 PM
- **ClickFunnels Tag**: `UM-Webinar-MostlyAttended`

## Timeline Example

```
5:30 PM - User A registers
5:45 PM - User B registers
6:00 PM - Webinar starts (live broadcast begins)

6:05 PM - User A joins (tracking watch time)
6:10 PM - User B joins (tracking watch time)

6:45 PM - User A leaves
         └─> watchTime: 40 minutes (recorded)
         └─> NO TAG YET ⏳

7:00 PM - Webinar ends (broadcast stops)
         └─> Tagging window opens 🎯

7:05 PM - User B leaves
         └─> watchTime: 55 minutes (recorded)
         └─> NO TAG YET ⏳

7:10 PM - Cron job runs
         └─> Processes ALL registrations for this webinar
         └─> User A: 40 min → PARTLY_ATTENDED ✅
         └─> User B: 55 min → MOSTLY_ATTENDED ✅
         └─> No-shows → MISSED ✅
```

## Key Points

### ✅ What Happens
1. **Batch tagging**: All users registered for the same webinar time get tagged together
2. **After broadcast ends**: Tags applied after `scheduledStartTime + duration`
3. **Watch time based**: Uses actual watch duration up to webinar end time
4. **Cron-driven**: Automated process runs every 5 minutes checking for ended webinars

### ❌ What Does NOT Happen
1. **NOT individual timing**: Users are NOT tagged when they leave
2. **NOT immediate**: Not tagged as soon as they close their browser
3. **NOT user-centric**: Not based on when each person stops watching
4. **NOT session-based**: Not "when user's session ends"

## Why This Design?

### Advantages:
1. **Fair**: Everyone judged at the same point in time (webinar end)
2. **Consistent**: All registrations for same time slot tagged together
3. **Simple**: One tagging event per webinar, not per user
4. **Reliable**: Cron job catches everyone, no missed tags

### Example Benefit:
- Webinar ends at 7:00 PM
- User A left at 6:30 PM (watched 25 min)
- User B left at 7:15 PM (watched 60 min)
- User C still watching at 7:10 PM (watched 55 min so far)
- **ALL get tagged at 7:10 PM based on their watch time UP TO 7:00 PM**
- Everyone enters follow-up sequences at the same time

## Database Structure

```typescript
// Registration table
{
  id: "reg_123",
  email: "user@example.com",
  attended: true,              // Did they join at all?
  lastWatchedPosition: 3000,   // Last video position in seconds
  attendanceTagsApplied: true, // Have we tagged them yet?
  scheduledStartTime: "6:00 PM",
  webinar: {
    duration: 60,              // Webinar length in minutes
    mostlyAttendedThreshold: 2700 // 45 minutes in seconds
  }
}

// Session table
{
  id: "session_456",
  registrationId: "reg_123",
  joinedAt: "6:05 PM",         // When they opened the page
  leftAt: "6:45 PM",           // When they closed the page
  watchDuration: 2400,         // 40 minutes in seconds
  totalWatchTime: 2400         // Total watched (excluding pauses)
}
```

## Configuration

### Environment Variables:
```bash
# Tag IDs from ClickFunnels
CLICKFUNNELS_TAG_ATTENDED="12345"
CLICKFUNNELS_TAG_MOSTLY_ATTENDED="12346"
CLICKFUNNELS_TAG_PARTLY_ATTENDED="12347"
CLICKFUNNELS_TAG_MISSED="12348"
```

### Webinar Settings:
```typescript
// Set in webinar edit form
{
  duration: 60,                    // How long the webinar runs
  mostlyAttendedThreshold: 2700    // 45 minutes = threshold for "mostly attended"
}
```

## Common Questions

### Q: When does User A get tagged?
**A:** After the webinar broadcast ends (scheduledStartTime + duration), when the cron job runs. NOT when they close their browser.

### Q: What if they leave early at 6:30 PM?
**A:** Their watch time (30 minutes) is recorded, but the tag is applied later at 7:10 PM when cron runs after the 7:00 PM webinar end.

### Q: What if they're still watching after webinar ends?
**A:** They get tagged based on their watch time UP TO the webinar end time. If webinar is 60 min and they watched 55 min by 7:00 PM, they get MOSTLY_ATTENDED even if still watching at 7:10 PM.

### Q: Do all users get tagged at the same time?
**A:** YES! Everyone registered for the same webinar time gets tagged together after that webinar ends.

### Q: What determines the tag?
**A:** The total watch duration UP TO the webinar end time, compared to the threshold.

### Q: How is watch time calculated?
**A:** Either from `session.watchDuration` or falls back to `registration.lastWatchedPosition`, measured up to the webinar end time.

## Summary

**The system tags ALL USERS after the WEBINAR BROADCAST ends, not when each user leaves.**

- ✅ Webinar-centric (batch processing after broadcast ends)
- ✅ Cron-driven (automated every 5 minutes)
- ✅ Watch-based (actual viewing time up to webinar end)
- ❌ NOT user-centric (not per-person timing)
- ❌ NOT immediate (not when browser closes)

This allows for consistent, fair tagging where everyone registered for the same time slot is evaluated together at the same moment.
