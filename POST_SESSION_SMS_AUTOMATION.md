# 📱 Automated Post-Session SMS System

**Status:** ✅ Fully Implemented (Backend Complete, UI Ready, Cron Setup Pending)

## Overview

The automated post-session SMS system sends personalized SMS messages to attendees after their individual webinar session ends. Unlike the manual post-webinar SMS tool, this system runs automatically via cron job, requires no manual intervention, and respects each attendee's personal session timing (crucial for evergreen webinars).

## How It Works

### 1. **Session-Based Triggering (Evergreen Model)**

Each attendee has their own personal webinar session:
- **Alice** registers for 6:00 PM → Her session: 6:00 PM - 7:00 PM
- **Bob** registers for 8:00 PM → His session: 8:00 PM - 9:00 PM
- **Charlie** registers for 10:00 PM → His session: 10:00 PM - 11:00 PM

SMS is sent based on **each attendee's session end time**, not a global webinar end time.

### 2. **Automated Workflow**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User registers for webinar                                   │
│    → scheduledStartTime saved in registrations table            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. User joins and watches webinar                               │
│    → lastWatchedPosition updated every 5 seconds                │
│    → attended flag set to true                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Session ends (scheduledStartTime + duration)                 │
│    → Cron job runs every 15 minutes                             │
│    → Checks: Is sendTime <= now?                                │
│      sendTime = scheduledStartTime + duration + minutesAfter    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Check watch criteria (if configured)                         │
│    • Option A: All attendees (no criteria)                      │
│    • Option B: Watched X minutes minimum                        │
│    • Option C: Watched Y% of webinar minimum                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Personalize and send SMS                                     │
│    → Replace {name} with attendee name                          │
│    → Replace {webinar_title} with webinar title                 │
│    → Send via ClickSend SMS API                                 │
│    → Mark postSessionSmsSent = true                             │
└─────────────────────────────────────────────────────────────────┘
```

### 3. **Duplicate Prevention**

- Each registration has a `postSessionSmsSent` boolean flag
- Once SMS is sent, flag is set to `true` + `postSessionSmsSentAt` timestamp
- Cron job only processes registrations where `postSessionSmsSent = false`
- Even if SMS sending fails, flag is still set to prevent infinite retry loops

## Configuration

### Webinar Settings (UI)

Navigate to: **Dashboard → Webinars → Edit Webinar → Automated Post-Session SMS**

#### 1. **Enable Toggle**
```
☑ Enable Automated Post-Session SMS
```
Turn on/off automated sending for this webinar.

#### 2. **Delay After Session**
```
Send SMS After: [__30__] minutes after session ends
```
- Set to `0` for immediate sending when session ends
- Or delay by X minutes (e.g., 30 = half hour later, 60 = 1 hour later)
- Useful for giving users time to complete offers or check email

#### 3. **Watch Criteria (Optional Filtering)**

Choose who receives the SMS:

**Option A: All Attendees**
```
○ Attended (any amount)
  Send to everyone who joined, regardless of watch time
```

**Option B: Minimum Minutes**
```
○ Watched at least [__30__] minutes
  Only send to users who watched 30+ minutes
```

**Option C: Minimum Percentage**
```
○ Watched at least [__50__]% of webinar
  Only send to users who watched 50%+ of the webinar
```

#### 4. **SMS Message Template**
```
Hi {name}, thanks for attending {webinar_title}! 
Here's your exclusive offer: https://example.com/special
```

**Available Placeholders:**
- `{name}` - Replaced with attendee's name
- `{webinar_title}` - Replaced with webinar title

**Character Limit:**
- 160 characters (standard SMS)
- Exceeding 160 splits into multiple SMS (costs more)
- Live character counter shows: `142/160 characters`

## Database Schema

### Webinar Table (Configuration)

```prisma
model Webinar {
  // ... existing fields ...
  
  autoSendPostSessionSMS          Boolean  @default(false)
  postSessionSMSMinutesAfter      Int      @default(0)
  postSessionSMSMinWatchedMinutes Int?
  postSessionSMSMinWatchedPercentage Int?
  postSessionSMSBody              String?  @db.Text
}
```

### Registration Table (Tracking)

```prisma
model Registration {
  // ... existing fields ...
  
  postSessionSmsSent   Boolean   @default(false)
  postSessionSmsSentAt DateTime?
  
  @@index([postSessionSmsSent, scheduledStartTime])
}
```

## API Endpoints

### Unified Cron Endpoint (All Automations)

**URL:** `POST /api/cron/process-reminders`

**What It Processes:**
1. ✅ Pre-webinar reminders (SMS/email)
2. ✅ ClickFunnels reminder tags (24hr, 2hr, 1hr, 15min, started)
3. ✅ Post-webinar attendance tagging
4. ✅ **Post-session SMS automation** (NEW!)

**Authentication:** Bearer token (CRON_SECRET)

**Headers:**
```
Authorization: Bearer your-cron-secret-token
```

**Response:**
```json
{
  "success": true,
  "reminderStats": {
    "processed": 15,
    "sent": 12,
    "failed": 3
  },
  "clickFunnelsTagStats": {
    "processed": 8,
    "tagged": 6,
    "failed": 2
  },
  "attendanceTagStats": {
    "checked": 23,
    "tagged": 18,
    "failed": 5
  },
  "postSessionSmsStats": {
    "checked": 47,
    "sent": 35,
    "failed": 2,
    "errors": ["user@example.com: Invalid phone number"]
  },
  "timestamp": "2025-11-20T15:30:00.000Z"
}
```

**Execution Logic:**
- All four processes run in **parallel** using `Promise.all()`
- Each process is independent and won't block others
- Post-session SMS processing:
  1. Query registrations WHERE `postSessionSmsSent = false` AND `scheduledStartTime IS NOT NULL`
  2. Filter to webinars WHERE `autoSendPostSessionSMS = true`
  3. Calculate send time: `scheduledStartTime + (duration * 60 * 1000) + (minutesAfter * 60 * 1000)`
  4. Check if `sendTime <= now`
  5. Validate watch criteria (if configured)
  6. Send SMS and mark as sent
  7. Process up to 100 registrations per run
  8. Rate limit: 100ms delay between sends

**Current Schedule:** Every 5-10 minutes (already configured in Railway)

### Manual Trigger (Admin Only)

**Function:** `sendPostSessionSMSForWebinar(webinarId)`

**Location:** `src/lib/postSessionSmsAutomation.ts`

**Usage:**
```typescript
import { sendPostSessionSMSForWebinar } from '@/lib/postSessionSmsAutomation'

const result = await sendPostSessionSMSForWebinar('webinar-id-here')
console.log(`Sent: ${result.sent}, Failed: ${result.failed}`)
```

Useful for:
- Testing SMS before enabling automation
- Resending to failed recipients
- One-off campaigns

**Function:** `sendPostSessionSMSForWebinar(webinarId)`

**Location:** `src/lib/postSessionSmsAutomation.ts`

**Usage:**
```typescript
import { sendPostSessionSMSForWebinar } from '@/lib/postSessionSmsAutomation'

const result = await sendPostSessionSMSForWebinar('webinar-id-here')
console.log(`Sent: ${result.sent}, Failed: ${result.failed}`)
```

Useful for:
- Testing SMS before enabling automation
- Resending to failed recipients
- One-off campaigns

## Core Logic

**File:** `src/lib/postSessionSmsAutomation.ts`

### Main Function: `processEndedSessionsForPostSMS()`

```typescript
export async function processEndedSessionsForPostSMS() {
  // 1. Query registrations ready for SMS
  const registrations = await prisma.registration.findMany({
    where: {
      postSessionSmsSent: false,
      scheduledStartTime: { not: null },
      phone: { not: null },
      webinar: { autoSendPostSessionSMS: true }
    },
    take: 100
  })
  
  // 2. Filter by send time reached
  const ready = registrations.filter(reg => {
    const sendTime = new Date(
      reg.scheduledStartTime.getTime() + 
      (webinar.duration * 60 * 1000) + 
      (webinar.postSessionSMSMinutesAfter * 60 * 1000)
    )
    return sendTime <= new Date()
  })
  
  // 3. Apply watch criteria filter
  const qualified = ready.filter(reg => 
    checkWatchCriteria(
      reg.lastWatchedPosition,
      reg.attended,
      webinar.duration,
      webinar.postSessionSMSMinWatchedMinutes,
      webinar.postSessionSMSMinWatchedPercentage
    )
  )
  
  // 4. Send SMS to each qualified attendee
  for (const reg of qualified) {
    const personalizedMessage = webinar.postSessionSMSBody
      .replace(/{name}/g, reg.name || 'there')
      .replace(/{webinar_title}/g, webinar.title)
    
    await sendClickSendSMS(reg.phone, personalizedMessage)
    
    // Mark as sent (even if failed to prevent infinite retries)
    await prisma.registration.update({
      where: { id: reg.id },
      data: {
        postSessionSmsSent: true,
        postSessionSmsSentAt: new Date()
      }
    })
    
    await new Promise(resolve => setTimeout(resolve, 100)) // Rate limit
  }
  
  return { checked, sent, failed, errors }
}
```

### Watch Criteria Validation

```typescript
function checkWatchCriteria(
  lastWatchedPosition: number,
  attended: boolean,
  webinarDuration: number,
  minWatchedMinutes?: number | null,
  minWatchedPercentage?: number | null
): boolean {
  // Must have attended
  if (!attended) return false
  
  // No criteria = all attendees qualify
  if (!minWatchedMinutes && !minWatchedPercentage) {
    return true
  }
  
  // Check minutes criteria
  if (minWatchedMinutes) {
    const watchedMinutes = lastWatchedPosition / 60
    return watchedMinutes >= minWatchedMinutes
  }
  
  // Check percentage criteria
  if (minWatchedPercentage) {
    const watchedPercent = (lastWatchedPosition / (webinarDuration * 60)) * 100
    return watchedPercent >= minWatchedPercentage
  }
  
  return false
}
```

## Railway Cron Setup

### ✅ Already Configured!

**Good news:** You don't need to create a new cron job! The post-session SMS automation has been added to your existing cron job that already runs every 5-10 minutes.

**Your existing cron job now processes:**
1. Pre-webinar reminders (SMS/email notifications)
2. ClickFunnels reminder tags (24hr, 2hr, 1hr, 15min, started)
3. Post-webinar attendance tagging (ATTENDED, MOSTLY_ATTENDED, etc.)
4. **Post-session SMS automation** (NEW! ✨)

All four automations run in parallel, so adding post-session SMS doesn't slow down your existing processes.

### Verify It's Working

**Check Railway Logs:**
```bash
railway logs -f
```

**Look for:**
```
🔔 Cron job: Processing reminders + ClickFunnels tags + attendance tagging + post-session SMS...
```

**Response should include:**
```json
{
  "postSessionSmsStats": {
    "checked": 47,
    "sent": 35,
    "failed": 2
  }
}
```

### If You Need to Create a New Cron Job (Not Required)

Only do this if you want a separate cron job specifically for post-session SMS:

1. **Navigate to:** Railway Project → Cron Jobs
2. **Click:** "New Cron Job"
3. **Configuration:**
   - **Name:** Post-Session SMS Only
   - **Schedule:** `*/15 * * * *` (every 15 minutes)
   - **Command/URL:** `POST https://emaanpowerclasses.com/api/cron/process-post-session-sms`
   - **Headers:** 
     ```
     Authorization: Bearer ${CRON_SECRET}
     Content-Type: application/json
     ```
   - **Method:** POST

**Note:** This endpoint no longer exists since we merged everything into `/api/cron/process-reminders`.

## Monitoring & Analytics

### View SMS Queue

**URL:** `/dashboard/clickfunnels/tag-queue` (Tab 3: Post-Session SMS)

**Coming Soon:**
- Pending SMS count by webinar
- Sent/Failed statistics
- Error logs with retry options
- Individual attendee SMS status
- Pagination (50 per page)
- Filters: webinar, status (sent/pending/failed)

### Database Queries

**Check pending SMS:**
```sql
SELECT 
  r.name,
  r.email,
  r.phone,
  w.title AS webinar_title,
  r.scheduledStartTime,
  w.duration,
  w.postSessionSMSMinutesAfter,
  r.lastWatchedPosition,
  r.attended
FROM registrations r
JOIN webinars w ON r."webinarId" = w.id
WHERE r."postSessionSmsSent" = false
  AND r."scheduledStartTime" IS NOT NULL
  AND w."autoSendPostSessionSMS" = true
ORDER BY r."scheduledStartTime" ASC;
```

**Check sent SMS:**
```sql
SELECT 
  r.name,
  r.email,
  r."postSessionSmsSentAt",
  w.title AS webinar_title
FROM registrations r
JOIN webinars w ON r."webinarId" = w.id
WHERE r."postSessionSmsSent" = true
ORDER BY r."postSessionSmsSentAt" DESC
LIMIT 100;
```

## Comparison: Automated vs Manual

| Feature | Automated System | Manual Tool (`/dashboard/post-webinar-sms`) |
|---------|------------------|---------------------------------------------|
| **Trigger** | Cron job (every 15 min) | Admin clicks "Send" button |
| **Timing** | Per-attendee session end | Global webinar end or manual trigger |
| **Configuration** | Per-webinar settings | One-time form submission |
| **Watch Criteria** | Minutes OR percentage | Advanced filters (purchases, watched %, tags) |
| **Duplicate Prevention** | Automatic (database flag) | Manual (admin responsibility) |
| **Evergreen Support** | ✅ Yes (per-user sessions) | ❌ No (global timing) |
| **Use Case** | Standard post-session thank you/offer | Ad-hoc campaigns, special announcements |
| **Setup Effort** | Configure once, runs forever | Setup each time |
| **Message Personalization** | `{name}`, `{webinar_title}` | `{name}`, `{webinar_title}`, `{date}`, `{time}` |

**When to Use Which:**

- **Automated System:** Standard "thank you for attending" messages, post-session offers, feedback requests
- **Manual Tool:** Special announcements, limited-time bonuses, re-engagement campaigns, testing

## Example Scenarios

### Scenario 1: Thank You Message (All Attendees)

**Configuration:**
- Enable: ✅ Yes
- Delay: 0 minutes (immediate)
- Criteria: Attended (any amount)
- Message: `Hi {name}, thanks for joining {webinar_title}! Check your email for the replay link.`

**Result:**
- Alice attends 5 minutes → Gets SMS immediately at session end
- Bob attends 50 minutes → Gets SMS immediately at session end
- Charlie never joins → No SMS

---

### Scenario 2: Special Offer (Engaged Viewers Only)

**Configuration:**
- Enable: ✅ Yes
- Delay: 30 minutes (give time to check email)
- Criteria: Watched at least 50%
- Message: `{name}, you watched {webinar_title}! Here's your 50% off code: WEBINAR50. Valid 24hrs: https://buy.now/special`

**Result:**
- Alice watches 25 minutes (41% of 60min) → No SMS
- Bob watches 35 minutes (58% of 60min) → Gets SMS 30min after his session ends
- Charlie watches 55 minutes (92% of 60min) → Gets SMS 30min after his session ends

---

### Scenario 3: High-Intent Follow-Up

**Configuration:**
- Enable: ✅ Yes
- Delay: 60 minutes (1 hour cooling period)
- Criteria: Watched at least 45 minutes
- Message: `Hi {name}! Our team noticed you watched most of {webinar_title}. Book a 1-on-1 call: https://cal.com/expert`

**Result:**
- Only users who watched 45+ minutes get the high-touch follow-up
- 1 hour delay allows them to process the content first
- Personalized with their name and webinar title

## Testing Checklist

### 1. UI Testing
- [ ] Navigate to webinar edit page
- [ ] Find "Automated Post-Session SMS" section
- [ ] Enable toggle and configure settings
- [ ] Add SMS message with placeholders
- [ ] Save webinar and reload page
- [ ] Verify settings persisted correctly

### 2. Backend Testing
- [ ] Create test webinar (duration: 10 minutes)
- [ ] Enable automated SMS (delay: 0, criteria: any attendee)
- [ ] Register with valid phone number
- [ ] Join webinar and watch for 2+ minutes
- [ ] Wait for session end + 15 minutes (next cron run)
- [ ] Verify SMS received on phone
- [ ] Check database: `postSessionSmsSent = true`

### 3. Criteria Testing
- [ ] Set criteria: "Watched at least 5 minutes"
- [ ] Test A: Watch 3 minutes → Should NOT receive SMS
- [ ] Test B: Watch 7 minutes → Should receive SMS
- [ ] Set criteria: "Watched at least 50%"
- [ ] Test C: Watch 30% → Should NOT receive SMS
- [ ] Test D: Watch 60% → Should receive SMS

### 4. Cron Testing
- [ ] Manually trigger cron: `POST /api/cron/process-post-session-sms`
- [ ] Verify response includes checked/sent/failed counts
- [ ] Check Railway logs for execution details
- [ ] Verify no duplicate SMS sent on subsequent runs

### 5. Edge Cases
- [ ] User with no phone number → Skip gracefully
- [ ] User never joined → Skip (attended = false)
- [ ] Invalid phone format → Log error, mark as sent
- [ ] SMS API failure → Log error, mark as sent (no infinite retry)
- [ ] Multiple sessions (user rejoins) → Only uses lastWatchedPosition

## Troubleshooting

### Issue: SMS Not Being Sent

**Check:**
1. Is `autoSendPostSessionSMS` enabled for the webinar?
2. Does registration have `scheduledStartTime` and `phone`?
3. Has send time been reached? (scheduledStartTime + duration + minutesAfter)
4. Does user meet watch criteria?
5. Is `postSessionSmsSent` still false?
6. Is cron job running? (Check Railway logs)

**SQL Query:**
```sql
SELECT 
  r.id,
  r.name,
  r.email,
  r.phone,
  r.scheduledStartTime,
  r.attended,
  r.lastWatchedPosition,
  r.postSessionSmsSent,
  w.autoSendPostSessionSMS,
  w.postSessionSMSMinutesAfter,
  w.postSessionSMSMinWatchedMinutes,
  w.postSessionSMSMinWatchedPercentage
FROM registrations r
JOIN webinars w ON r."webinarId" = w.id
WHERE r.email = 'user@example.com'
  AND w.id = 'webinar-id';
```

---

### Issue: Duplicate SMS Sent

**Root Cause:** `postSessionSmsSent` flag not being set properly

**Fix:**
```sql
-- Check for duplicates
SELECT 
  r.email,
  r."postSessionSmsSent",
  r."postSessionSmsSentAt",
  COUNT(*) 
FROM registrations r
WHERE r."postSessionSmsSent" = true
GROUP BY r.email, r."postSessionSmsSent", r."postSessionSmsSentAt"
HAVING COUNT(*) > 1;

-- Manually mark as sent if needed
UPDATE registrations
SET "postSessionSmsSent" = true,
    "postSessionSmsSentAt" = NOW()
WHERE id = 'registration-id';
```

---

### Issue: SMS Sent to Wrong Users

**Check watch criteria logic:**
```typescript
// Debug: Log watch data before sending
console.log({
  lastWatchedPosition: reg.lastWatchedPosition,
  attended: reg.attended,
  webinarDuration: webinar.duration,
  minMinutes: webinar.postSessionSMSMinWatchedMinutes,
  minPercentage: webinar.postSessionSMSMinWatchedPercentage,
  qualified: checkWatchCriteria(...)
})
```

---

### Issue: Cron Job Not Running

**Verify Railway setup:**
1. Check cron schedule is correct: `*/15 * * * *`
2. Verify CRON_SECRET matches environment variable
3. Check Railway logs for error messages
4. Test endpoint manually with curl:

```bash
curl -X POST https://emaanpowerclasses.com/api/cron/process-post-session-sms \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"
```

## Files Modified/Created

### New Files
- `src/lib/postSessionSmsAutomation.ts` - Core automation logic (294 lines)
- `add-post-session-sms-automation.sql` - Database migration
- `POST_SESSION_SMS_AUTOMATION.md` - This documentation

### Modified Files
- `prisma/schema.prisma` - Added SMS fields to Webinar and Registration models
- `src/app/api/webinars/[id]/route.ts` - Added SMS fields to API with numeric/boolean conversion
- `src/app/dashboard/webinars/[id]/edit/page.tsx` - Added SMS configuration UI (complete form)
- `src/app/api/cron/process-reminders/route.ts` - **Added post-session SMS to unified cron job**

### Deleted Files
- ~~`src/app/api/cron/process-post-session-sms/route.ts`~~ - No longer needed (merged into unified cron)

## Future Enhancements

### Phase 2 Features
- [ ] Add Tab 3 to `/dashboard/clickfunnels/tag-queue` for SMS monitoring
- [ ] Create `/api/clickfunnels/post-sms-queue` endpoint
- [ ] Add retry mechanism for failed SMS (with max retry limit)
- [ ] SMS templates library (pre-written messages)
- [ ] A/B test different SMS messages
- [ ] SMS analytics (open rates via link tracking)
- [ ] Schedule SMS for specific days/times (not just after session)
- [ ] Multi-message sequences (SMS 1 immediately, SMS 2 after 24hrs)

### Advanced Features
- [ ] Integration with Twilio (alternative to ClickSend)
- [ ] MMS support (send images/videos)
- [ ] Two-way SMS (receive replies)
- [ ] SMS opt-out management
- [ ] Cost tracking per SMS campaign
- [ ] Emoji support in messages

## Support

**Questions?** Contact the development team or check:
- Railway logs: `railway logs -f`
- Database queries in this doc
- Manual SMS tool: `/dashboard/post-webinar-sms` for testing

---

**Last Updated:** November 20, 2025  
**Status:** Production Ready (Cron Setup Pending)  
**Version:** 1.0.0
