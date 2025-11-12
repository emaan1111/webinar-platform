# ClickFunnels Attendance Tagging - System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    REGISTRATION PHASE                            │
└─────────────────────────────────────────────────────────────────┘

User fills form
     │
     ├─ name, email, phone, timezone
     │
     ▼
POST /api/webinars/[id]/register
     │
     ├─ Create Registration record
     │
     ▼
syncWebinarRegistrationToClickFunnels()
     │
     ├─ Split name → first_name, last_name
     ├─ Add custom_attributes (webinar_id, title, etc.)
     │
     ▼
sendContactToClickFunnels()
     │
     ├─ POST /workspaces/{id}/contacts
     ├─ Payload: { contact: {...} }
     │
     ▼
Contact Created (ID: 896791250)
     │
     ▼
applyTagsToContact(contactId, [368586])
     │
     ├─ POST /workspaces/{id}/contacts/{id}/applied_tags
     ├─ Payload: { applied_tag: { tag_id: "368586" } }
     │
     ▼
✅ Tag Applied: UM-Webinar-Registered


┌─────────────────────────────────────────────────────────────────┐
│                     ATTENDANCE PHASE                             │
└─────────────────────────────────────────────────────────────────┘

User clicks "Join Webinar"
     │
     ▼
POST /api/tracking/session
{ action: "join" }
     │
     ├─ Create AttendeeSession record
     ├─ Update Registration: attended = true, joinedAt = now()
     │
     ▼
Session Active ✅


[User watches webinar...]
     │
     ├─ Every 30 seconds:
     │
     ▼
POST /api/tracking/session
{ action: "update", watchTime: X, videoPosition: Y }
     │
     ├─ Update AttendeeSession
     ├─ totalWatchTime = X seconds
     ├─ videoPosition = Y seconds
     │
     ▼
Continue tracking...


User closes tab or clicks "Leave"
     │
     ▼
POST /api/tracking/session
{ action: "leave", watchTime: 2700, videoPosition: 2700 }
     │
     ├─ Update AttendeeSession:
     │  ├─ leftAt = now()
     │  ├─ isActive = false
     │  ├─ totalWatchTime = 2700 (45 mins)
     │  └─ videoPosition = 2700
     │
     ├─ Update Registration:
     │  └─ leftAt = now()
     │
     ▼
Calculate Metrics
     │
     ├─ webinarDuration = 3600 seconds (60 mins)
     ├─ watchTime = 2700 seconds (45 mins)
     ├─ videoPosition = 2700 seconds
     ├─ offerCTAThreshold = 3600 - 900 = 2700 seconds
     ├─ reachedOfferCTA = (2700 >= 2700) = true ✅
     │
     ▼
syncAttendanceToClickFunnels() [ASYNC]
     │
     ├─ Find contact by email in ClickFunnels
     │  GET /workspaces/{id}/contacts?filter[email_address]=user@example.com
     │
     ▼
Contact Found (ID: 896791250)
     │
     ▼
determineAttendanceTags()
     │
     ├─ attended = true → Add "UM-Webinar-Attended"
     ├─ watchTime = 2700 > 0 → ✅
     ├─ reachedOfferCTA = true → Add "UM-Webinar-MostlyAttended" ✅
     ├─ watchTime >= 2400? → Yes (2700 >= 2400)
     │
     ▼
Tags to Apply: [368587, 368588]
     │
     ▼
applyTagsToContact(896791250, [368587, 368588])
     │
     ├─ POST /workspaces/{id}/contacts/896791250/applied_tags
     ├─ Body: { applied_tag: { tag_id: "368587" } }
     │  ▼
     │  ✅ UM-Webinar-Attended applied
     │
     ├─ POST /workspaces/{id}/contacts/896791250/applied_tags
     ├─ Body: { applied_tag: { tag_id: "368588" } }
     │  ▼
     │  ✅ UM-Webinar-MostlyAttended applied
     │
     ▼
Update Custom Attributes
     │
     ├─ PUT /workspaces/{id}/contacts/896791250
     ├─ Body: {
     │    contact: {
     │      custom_attributes: {
     │        last_attendance_date: "2025-11-12T10:45:00Z",
     │        watch_time_minutes: 45,
     │        watch_percentage: 75,
     │        reached_offer: true,
     │        left_at: "2025-11-12T10:45:00Z"
     │      }
     │    }
     │  }
     │
     ▼
✅ Attendance Synced Successfully


┌─────────────────────────────────────────────────────────────────┐
│                   TAG DECISION LOGIC                             │
└─────────────────────────────────────────────────────────────────┘

                    Did user attend?
                           │
               ┌───────────┴───────────┐
               │                       │
              NO                      YES
               │                       │
               ▼                       ▼
      Tag: UM-Webinar-Missed    Tag: UM-Webinar-Attended
              │                       │
              │              ┌────────┴────────┐
              │              │                 │
              │         Is Replay?        Reached Offer CTA?
              │              │                 │
              │          ┌───┴───┐         ┌───┴───┐
              │         YES     NO         YES     NO
              │          │       │          │       │
              │          ▼       │          ▼       ▼
              │   Tag: Replay    │    Tag: Mostly  Watched 40+ mins?
              │                  │                  │
              │                  │              ┌───┴───┐
              │                  │             YES     NO
              │                  │              │       │
              │                  │              ▼       │
              │                  │        Tag: Partly   │
              │                  │                      │
              └──────────────────┴──────────────────────┘
                                 │
                                 ▼
                          Final Tag Set


┌─────────────────────────────────────────────────────────────────┐
│                     EXAMPLE SCENARIOS                            │
└─────────────────────────────────────────────────────────────────┘

Scenario 1: Perfect Attendee
├─ Watched: 55 minutes of 60-minute webinar
├─ Left at: 55:00
├─ Result: UM-Webinar-Attended + UM-Webinar-MostlyAttended
└─ Action: Send offer email immediately


Scenario 2: Early Leaver
├─ Watched: 45 minutes of 60-minute webinar
├─ Left at: 45:00 (offer starts at 45:00)
├─ Result: UM-Webinar-Attended + UM-Webinar-PartlyAttended
└─ Action: "You left before the best part" email


Scenario 3: Quick Exit
├─ Watched: 15 minutes of 60-minute webinar
├─ Left at: 15:00
├─ Result: UM-Webinar-Attended (only)
└─ Action: Nurture sequence


Scenario 4: No-Show
├─ Watched: 0 minutes
├─ Never joined
├─ Result: UM-Webinar-Missed
└─ Action: Replay email


Scenario 5: Replay Viewer
├─ Watched: 50 minutes of 60-minute webinar replay
├─ Left at: 50:00
├─ Result: UM-Webinar-Attended + UM-Webinar-ReplayAttended + UM-Webinar-MostlyAttended
└─ Action: Offer still available + urgency


┌─────────────────────────────────────────────────────────────────┐
│                    DATA FLOW DIAGRAM                             │
└─────────────────────────────────────────────────────────────────┘

┌────────────┐
│   Browser  │
└─────┬──────┘
      │ Registration Form
      ▼
┌─────────────────┐
│  Next.js API    │ ──────┐
│  /register      │       │
└────────┬────────┘       │
         │                │
         ▼                │
┌─────────────────┐       │
│  PostgreSQL     │       │
│  (Registration) │       │
└─────────────────┘       │
                          │
                          ▼
                  ┌──────────────────┐
                  │  ClickFunnels    │
                  │  POST /contacts  │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │  ClickFunnels    │
                  │  Apply Tags      │
                  └──────────────────┘
                  
                  
[During Webinar]

┌────────────┐
│  Browser   │
│  (Player)  │
└─────┬──────┘
      │ Every 30s
      │ watchTime, videoPosition
      ▼
┌─────────────────┐
│  Next.js API    │
│  /tracking      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL     │
│  (Session)      │
└─────────────────┘


[On Leave]

┌────────────┐
│  Browser   │
└─────┬──────┘
      │ action: "leave"
      ▼
┌─────────────────┐      Calculate
│  Next.js API    │ ──── Metrics ────┐
│  /tracking      │                   │
└────────┬────────┘                   │
         │                            │
         ▼                            │
┌─────────────────┐                   │
│  PostgreSQL     │                   │
│  Update Session │                   │
└─────────────────┘                   │
                                      │
                                      ▼
                           ┌──────────────────┐
                           │  Determine Tags  │
                           │  Based on Rules  │
                           └────────┬─────────┘
                                    │
                                    ▼
                           ┌──────────────────┐
                           │  ClickFunnels    │
                           │  Apply Tags      │
                           └────────┬─────────┘
                                    │
                                    ▼
                           ┌──────────────────┐
                           │  ClickFunnels    │
                           │  Update Attrs    │
                           └──────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                  CLICKFUNNELS CONTACT VIEW                       │
└─────────────────────────────────────────────────────────────────┘

Contact: john.doe@example.com
├─ Tags:
│  ├─ ✅ UM-Webinar-Registered
│  ├─ ✅ UM-Webinar-Attended
│  └─ ✅ UM-Webinar-MostlyAttended
│
└─ Custom Attributes:
   ├─ webinar_id: "cmhv6o0ps0005jwlgxig6b8qw"
   ├─ webinar_title: "How to 10X Your Business"
   ├─ registered_at: "2025-11-12T09:00:00Z"
   ├─ last_attendance_date: "2025-11-12T10:45:00Z"
   ├─ watch_time_minutes: 45
   ├─ watch_percentage: 75
   ├─ reached_offer: true
   └─ left_at: "2025-11-12T10:45:00Z"
```

## Key Points

### ⚡ Performance
- **Async Processing**: Tagging doesn't block user
- **Background Job**: User can close browser immediately
- **Error Resilient**: Failures logged but don't crash app

### 🔒 Data Integrity
- **Idempotent**: Can run multiple times safely
- **Graceful Degradation**: Works even if CF not configured
- **Duplicate Prevention**: ClickFunnels handles duplicate tag application

### 📊 Tracking
- **Real-time**: Watch time updated every 30 seconds
- **Accurate**: Video position tracked precisely
- **Historical**: All data saved in database

### 🎯 Segmentation Ready
- **Immediate**: Tags applied on webinar end
- **Actionable**: Ready for automation workflows
- **Detailed**: Custom attributes for advanced filtering

---

**Next Steps**:
1. Run `node scripts/setup-cf-tags.js` to create tags
2. Copy tag IDs to `.env` file
3. Test with a registration
4. Set up automation workflows in ClickFunnels
