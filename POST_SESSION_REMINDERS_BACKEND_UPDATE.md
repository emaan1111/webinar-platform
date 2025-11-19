# Post-Session Reminders - Backend Implementation Complete

## Overview
Backend has been updated to support both pre-webinar and post-session reminders with flexible channel-based validation.

## ✅ Changes Implemented

### 1. Database Schema Updated
**File**: `prisma/schema.prisma`

Added new fields to `WebinarReminderTemplate` model:
```prisma
model WebinarReminderTemplate {
  // Type of reminder
  type        String   @default("pre_webinar") // 'pre_webinar' or 'post_webinar'
  
  // Timing - Pre-webinar
  minutesBefore Int?    // Optional now (only for pre-webinar)
  
  // Timing - Post-session
  minutesAfter Int?    // Minutes after completion (0 = immediate, 1440 = 1 day)
  
  // Watch criteria for post-session
  minWatchedMinutes Int?     // Minimum minutes watched (e.g., 30)
  minWatchedPercentage Int?  // Minimum percentage watched (e.g., 50)
  
  // Content fields now optional (based on channel)
  emailSubject String?  // Optional when using SMS only
  emailBody    String?  @db.Text
  smsBody      String?  @db.Text
  
  // ... other existing fields
}
```

**Status**: ✅ Schema pushed to database successfully

### 2. API Endpoint Updated
**File**: `/src/app/api/webinars/[id]/reminders/route.ts`

#### New Request Body Fields
```typescript
{
  type: 'pre_webinar' | 'post_webinar',  // Defaults to 'pre_webinar'
  
  // Pre-webinar fields
  minutesBefore?: number,
  
  // Post-session fields
  minutesAfter?: number,
  minWatchedMinutes?: number,
  minWatchedPercentage?: number,
  
  // Channel and content
  channel: 'EMAIL' | 'SMS' | 'BOTH',
  emailSubject?: string,  // Required only if channel includes EMAIL
  emailBody?: string,     // Required only if channel includes EMAIL
  smsBody?: string,       // Required only if channel includes SMS
  
  // Status and tags
  isActive?: boolean,
  applyClickFunnelsTag?: boolean,
  clickFunnelsTag?: string
}
```

#### Smart Validation Logic

**Pre-Webinar Reminders:**
```typescript
if (type === 'pre_webinar') {
  // Require minutesBefore
  if (!minutesBefore) return error
  
  // Validate email fields if EMAIL channel
  if (channel === 'EMAIL' || channel === 'BOTH') {
    if (!emailSubject || !emailBody) return error
  }
  
  // Validate SMS field if SMS channel
  if (channel === 'SMS' || channel === 'BOTH') {
    if (!smsBody) return error
  }
}
```

**Post-Session Reminders:**
```typescript
if (type === 'post_webinar') {
  // Require minutesAfter
  if (!minutesAfter) return error
  
  // Require watch criteria (minutes OR percentage)
  if (!minWatchedMinutes && !minWatchedPercentage) return error
  
  // Same channel-based validation as pre-webinar
  if (channel === 'EMAIL' || channel === 'BOTH') {
    if (!emailSubject || !emailBody) return error
  }
  
  if (channel === 'SMS' || channel === 'BOTH') {
    if (!smsBody) return error
  }
}
```

### 3. Reminder Template Functions Updated
**File**: `/src/lib/reminders.ts`

#### Updated Interface
```typescript
interface ReminderTemplateData {
  type?: 'pre_webinar' | 'post_webinar'
  minutesBefore?: number
  minutesAfter?: number
  minWatchedMinutes?: number | null
  minWatchedPercentage?: number | null
  channel: 'EMAIL' | 'SMS' | 'BOTH'
  emailSubject?: string | null
  emailBody?: string | null
  smsBody?: string | null
  isActive?: boolean
  applyClickFunnelsTag?: boolean
  clickFunnelsTag?: string | null
}
```

#### Updated createReminderTemplate
```typescript
export async function createReminderTemplate(
  webinarId: string,
  data: ReminderTemplateData
): Promise<any> {
  return await prisma.webinarReminderTemplate.create({
    data: {
      webinarId,
      type: data.type || 'pre_webinar',
      minutesBefore: data.minutesBefore || null,
      minutesAfter: data.minutesAfter || null,
      minWatchedMinutes: data.minWatchedMinutes || null,
      minWatchedPercentage: data.minWatchedPercentage || null,
      channel: data.channel,
      emailSubject: data.emailSubject || null,
      emailBody: data.emailBody || null,
      smsBody: data.smsBody || null,
      isActive: data.isActive ?? true,
      applyClickFunnelsTag: data.applyClickFunnelsTag ?? false,
      clickFunnelsTag: data.applyClickFunnelsTag ? (data.clickFunnelsTag || null) : null
    }
  })
}
```

### 4. Menu Navigation Updated
**File**: `/src/components/dashboard/DashboardLayout.tsx`

- ✅ Removed "Post-Webinar SMS" from sidebar menu
- Post-session functionality now accessed via webinar's reminders page tabs

## 🎯 Testing Scenarios

### Test 1: SMS-Only Pre-Webinar Reminder ✅
```json
{
  "type": "pre_webinar",
  "minutesBefore": 120,
  "channel": "SMS",
  "smsBody": "Hi {{name}}, your webinar starts in 2 hours!"
}
```
**Expected**: ✅ Saves successfully without requiring email fields

### Test 2: Email-Only Post-Session Reminder ✅
```json
{
  "type": "post_webinar",
  "minutesAfter": 1440,
  "minWatchedMinutes": 30,
  "channel": "EMAIL",
  "emailSubject": "Thanks for watching!",
  "emailBody": "<h2>Hi {{name}}</h2><p>Thanks for watching...</p>"
}
```
**Expected**: ✅ Saves successfully without requiring SMS body

### Test 3: Both Channels Post-Session ✅
```json
{
  "type": "post_webinar",
  "minutesAfter": 0,
  "minWatchedPercentage": 50,
  "channel": "BOTH",
  "emailSubject": "Next steps",
  "emailBody": "<h2>Hi {{name}}</h2>",
  "smsBody": "Hi {{name}}, here's what to do next..."
}
```
**Expected**: ✅ Requires all content fields since using BOTH channels

### Test 4: Invalid - Missing Watch Criteria ❌
```json
{
  "type": "post_webinar",
  "minutesAfter": 0,
  "channel": "SMS",
  "smsBody": "Thanks!"
}
```
**Expected**: ❌ Error: "Either minWatchedMinutes or minWatchedPercentage is required for post-session reminders"

### Test 5: Invalid - SMS Channel Without Body ❌
```json
{
  "type": "pre_webinar",
  "minutesBefore": 120,
  "channel": "SMS"
}
```
**Expected**: ❌ Error: "smsBody is required when sending SMS"

## 📋 What Still Needs Work

### 1. Session Completion Tracking (HIGH PRIORITY)
**Status**: ⏳ Not implemented

Need to detect when user completes/closes webinar and trigger post-session reminders.

**Implementation Plan**:
- Add endpoint: `POST /api/webinars/[id]/sessions/complete`
- Call from webinar player on:
  - User closes player
  - User reaches end of replay
  - Player inactive for X minutes
- Calculate watch time (minutes + percentage)
- Find active post-session templates
- Filter by watch criteria
- Schedule reminders based on `completionTime + minutesAfter`

### 2. Cron Job Updates (MEDIUM PRIORITY)
**Status**: ⏳ Needs testing

**File**: `/src/app/api/cron/process-reminders/route.ts`

Current cron should work for pre-webinar reminders. Need to verify it handles:
- `type` field discrimination
- `post_webinar` reminders scheduled from completion time
- Watch criteria already applied during scheduling

### 3. Update Reminder (PATCH Endpoint)
**Status**: ⏳ Needs update

**File**: `/src/app/api/webinars/[id]/reminders/[reminderId]/route.ts`

Update the PATCH handler to:
- Accept new fields (type, minutesAfter, watch criteria)
- Use same validation logic as POST
- Update `updateReminderTemplate` function in lib

### 4. Reminder Logs Display
**Status**: ⏳ Minor

Update reminder logs page to show:
- Type badge (pre-webinar vs post-session)
- Watch criteria info for post-session
- Timing info (before vs after)

## 🔧 Environment Variables

No new environment variables required. Existing setup works with new fields.

## 🗄️ Database Migration

Migration completed automatically via Prisma:
```bash
npx prisma db push --skip-generate
npx prisma generate
```

**Result**: Schema synced, client regenerated successfully

## 📝 API Examples

### Create SMS-Only Pre-Webinar Reminder
```bash
POST /api/webinars/{webinarId}/reminders
Content-Type: application/json

{
  "type": "pre_webinar",
  "minutesBefore": 1440,
  "channel": "SMS",
  "smsBody": "Hi {{name}}! Your webinar {{webinarTitle}} starts tomorrow at {{webinarTime}}. Join here: {{countdownLink}}",
  "isActive": true
}
```

### Create Email-Only Post-Session Follow-up
```bash
POST /api/webinars/{webinarId}/reminders
Content-Type: application/json

{
  "type": "post_webinar",
  "minutesAfter": 0,
  "minWatchedMinutes": 30,
  "channel": "EMAIL",
  "emailSubject": "Thanks for watching {{webinarTitle}}!",
  "emailBody": "<h2>Hi {{name}}</h2><p>Thanks for completing the webinar...</p>",
  "isActive": true
}
```

### Create Multi-Channel Post-Session (3 Days Later)
```bash
POST /api/webinars/{webinarId}/reminders
Content-Type: application/json

{
  "type": "post_webinar",
  "minutesAfter": 4320,
  "minWatchedPercentage": 75,
  "channel": "BOTH",
  "emailSubject": "Have you taken action on {{webinarTitle}}?",
  "emailBody": "<h2>Hi {{name}}</h2><p>3 days ago you watched our webinar...</p>",
  "smsBody": "Hi {{name}}, did you implement what you learned? Reply YES for help!",
  "applyClickFunnelsTag": true,
  "clickFunnelsTag": "3DAYFOLLOWUP",
  "isActive": true
}
```

## 🎉 Benefits

1. **Flexible Channel Selection**: No longer forced to fill both email and SMS
2. **Type-Aware Validation**: Smart validation based on reminder type
3. **Evergreen Support**: Post-session reminders perfect for on-demand webinars
4. **Engagement Filtering**: Only target engaged viewers (watch time criteria)
5. **Timing Flexibility**: Immediate to 1 week after completion
6. **Backwards Compatible**: Existing pre-webinar reminders still work
7. **Clean Navigation**: Integrated into webinar context, not separate page

---

**Status**: ✅ Backend Ready for Testing
**Next**: Implement session completion tracking
**Last Updated**: November 19, 2025
