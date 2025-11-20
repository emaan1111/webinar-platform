# ClickFunnels Tagging - Visual Flow

## Timeline Visualization

```
TIME          WEBINAR BROADCAST        USER A                   USER B                   USER C
─────────────────────────────────────────────────────────────────────────────────────────────────
5:30 PM                                📝 Registers
5:45 PM                                                         📝 Registers
6:00 PM      🎬 STARTS                
6:05 PM                                ▶️  Joins (opens tab)
6:10 PM                                                         ▶️  Joins (opens tab)
6:15 PM                                ⏯️  Watching...          ⏯️  Watching...
6:30 PM                                ⏯️  Watching...          ⏯️  Watching...
6:45 PM                                🚪 Leaves (closes tab)
                                       ↓
                                       🏷️  TAG APPLIED!
                                       (PARTLY_ATTENDED)
                                       Watch: 40 min < 45 min
7:00 PM      🛑 ENDS                                            ⏯️  Still watching...
7:05 PM                                                         🚪 Leaves
                                                                ↓
                                                                🏷️  TAG APPLIED!
                                                                (MOSTLY_ATTENDED)
                                                                Watch: 55 min > 45 min
7:10 PM      🤖 Cron Job                                                                  🏷️  TAG APPLIED!
             (processes no-shows)                                                        (MISSED)
                                                                                         Never joined
```

## Tag Decision Flow

```
┌─────────────────────────────────────┐
│   User Closes Browser/Tab           │
│   (session.leftAt = now)            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Calculate Watch Time              │
│   totalWatchTime = Σ watchDuration  │
│   OR lastWatchedPosition            │
└──────────────┬──────────────────────┘
               │
               ▼
         ┌─────────┐
         │ Did they│
         │ attend? │
         └────┬────┘
              │
      ┌───────┴───────┐
      │               │
      NO              YES
      │               │
      ▼               ▼
┌──────────┐    ┌─────────────┐
│  MISSED  │    │ watchTime   │
│   🚫     │    │ >= threshold?│
└──────────┘    └──────┬──────┘
                       │
               ┌───────┴───────┐
               │               │
              YES              NO
               │               │
               ▼               ▼
        ┌─────────────┐  ┌─────────────┐
        │   MOSTLY    │  │   PARTLY    │
        │  ATTENDED   │  │  ATTENDED   │
        │     ✅      │  │     ⚠️      │
        └─────────────┘  └─────────────┘
```

## Watch Time Calculation

```
User Session Timeline:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Webinar:     6:00 PM ═══════════════════════════ 7:00 PM
Duration:    |                                    |
             |←────────── 60 minutes ────────────→|

User A:              6:05 PM ────────── 6:45 PM
Join:                |                    |
                     |←──── 40 min ──────→|
                     
Threshold:   |                     45 min                    |
Result:      40 min < 45 min = PARTLY_ATTENDED ⚠️


User B:                  6:10 PM ──────────────────→ 7:05 PM
Join:                    |                              |
                         |←────────── 55 min ──────────→|
                         
Threshold:   |                     45 min                    |
Result:      55 min > 45 min = MOSTLY_ATTENDED ✅
```

## Code Execution Flow

```
┌────────────────────────────────┐
│  1. User Opens Webinar Page    │
│     - Create session record    │
│     - Set joinedAt timestamp   │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│  2. Video Player Running       │
│     - Update lastWatchedPosition│
│       every 5 seconds          │
│     - Set attended = true      │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│  3. User Closes Tab            │
│     - Set session.leftAt       │
│     - Calculate watchDuration  │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│  4. Check Session Status       │
│     sessionEnd = scheduledStart│
│                + duration      │
│     if (now > sessionEnd) {    │
│       // Session ended         │
│     }                          │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│  5. Apply Attendance Tag       │
│     - getAttendanceTag()       │
│     - tagClickFunnelsContact() │
│     - attendanceTagsApplied=true│
└────────────────────────────────┘
```

## Tag Application Examples

### Example 1: Early Leaver (Before Threshold)
```
Registration:
├─ attended: true
├─ lastWatchedPosition: 2400 (40 minutes)
├─ webinar.mostlyAttendedThreshold: 2700 (45 minutes)
├─ calculation: 2400 < 2700
└─ result: PARTLY_ATTENDED ⚠️

ClickFunnels API Call:
POST /contacts/{email}/tags
{
  "tag_id": "12347",  // PARTLY_ATTENDED
  "tag_name": "UM-Webinar-PartlyAttended"
}
```

### Example 2: Stayed Long (Past Threshold)
```
Registration:
├─ attended: true
├─ lastWatchedPosition: 3300 (55 minutes)
├─ webinar.mostlyAttendedThreshold: 2700 (45 minutes)
├─ calculation: 3300 > 2700
└─ result: MOSTLY_ATTENDED ✅

ClickFunnels API Call:
POST /contacts/{email}/tags
{
  "tag_id": "12346",  // MOSTLY_ATTENDED
  "tag_name": "UM-Webinar-MostlyAttended"
}
```

### Example 3: No Show
```
Registration:
├─ attended: false
├─ lastWatchedPosition: 0
├─ sessions: []
└─ result: MISSED 🚫

ClickFunnels API Call:
POST /contacts/{email}/tags
{
  "tag_id": "12348",  // MISSED
  "tag_name": "UM-Webinar-Missed"
}
```

## Database State Changes

### Before User Joins
```sql
Registration {
  id: "reg_123",
  email: "user@example.com",
  attended: false,              ❌
  lastWatchedPosition: 0,       ❌
  attendanceTagsApplied: false, ❌
  scheduledStartTime: "2024-01-15 18:00:00"
}
```

### While User Watching
```sql
Registration {
  id: "reg_123",
  email: "user@example.com",
  attended: true,               ✅ (changed)
  lastWatchedPosition: 1200,    ✅ (updating every 5s)
  attendanceTagsApplied: false, ❌
  scheduledStartTime: "2024-01-15 18:00:00"
}

Session {
  id: "session_456",
  registrationId: "reg_123",
  joinedAt: "2024-01-15 18:05:00", ✅
  leftAt: null,                     ❌ (not left yet)
  watchDuration: 0                  ❌ (not calculated yet)
}
```

### After User Leaves
```sql
Registration {
  id: "reg_123",
  email: "user@example.com",
  attended: true,               ✅
  lastWatchedPosition: 2400,    ✅ (40 minutes)
  attendanceTagsApplied: true,  ✅ (changed!)
  scheduledStartTime: "2024-01-15 18:00:00"
}

Session {
  id: "session_456",
  registrationId: "reg_123",
  joinedAt: "2024-01-15 18:05:00", ✅
  leftAt: "2024-01-15 18:45:00",   ✅ (changed!)
  watchDuration: 2400               ✅ (40 min, changed!)
}

ClickFunnelsAttendanceTag {
  registrationId: "reg_123",
  tagName: "PARTLY_ATTENDED",       ✅ (created!)
  appliedAt: "2024-01-15 18:45:01"  ✅
}
```

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Browser)                       │
├─────────────────────────────────────────────────────────────┤
│  • Video Player Component                                    │
│  • Updates watch position every 5s                          │
│  • Calls: POST /api/sessions/{id}/update                   │
│  • onBeforeUnload: POST /api/sessions/{id}/end            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND (API)                           │
├─────────────────────────────────────────────────────────────┤
│  • /api/sessions/{id}/update                                │
│    - Updates registration.lastWatchedPosition               │
│    - Sets registration.attended = true                      │
│                                                              │
│  • /api/sessions/{id}/end                                   │
│    - Sets session.leftAt                                    │
│    - Calculates session.watchDuration                       │
│    - Triggers: applyAttendanceTagOnSessionEnd()            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  TAG APPLICATION LOGIC                       │
├─────────────────────────────────────────────────────────────┤
│  • Check if session ended                                    │
│  • Calculate total watch time                               │
│  • Compare with threshold                                   │
│  • Determine tag (MISSED/ATTENDED/PARTLY/MOSTLY)           │
│  • Call ClickFunnels API                                    │
│  • Mark attendanceTagsApplied = true                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  CLICKFUNNELS API                            │
├─────────────────────────────────────────────────────────────┤
│  POST /contacts/{email}/tags                                │
│  {                                                           │
│    "tag_id": "12346",                                       │
│    "tag_name": "UM-Webinar-MostlyAttended"                 │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

## Cron Job (Backup System)

```
┌──────────────────────────────────────────────────────────────┐
│  CRON JOB: Runs Every 5 Minutes                              │
│  /api/cron/process-attendance-tags                           │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────────┐
         │  Find registrations where:  │
         │  • attendanceTagsApplied=0  │
         │  • sessionEnd < now         │
         └──────────┬──────────────────┘
                    │
                    ▼
         ┌─────────────────────────────┐
         │  For each registration:     │
         │  • Calculate watch time     │
         │  • Determine tag            │
         │  • Apply to ClickFunnels    │
         │  • Mark as tagged           │
         └─────────────────────────────┘
```

This catches:
- Users who never properly closed their tab
- Sessions where the frontend didn't trigger
- Any missed tagging operations

---

**Remember:** Tags apply PER USER when THEIR session ends, not when the webinar ends!
