# Post-Webinar Reminders Complete Implementation

## Overview
Unified reminders page now supports both **pre-webinar reminders** and **post-session follow-ups** in a single tabbed interface. This is specifically designed for evergreen webinars where "post-webinar" means after an individual attendee completes their viewing session.

## ✅ What's Been Implemented

### 1. **Tab-Based Interface** 
- Single page at `/dashboard/webinars/[id]/reminders`
- Two tabs:
  - **Pre-Webinar Reminders** (blue theme) - Sent before scheduled session
  - **Post-Session Follow-ups** (purple theme) - Sent after user completes viewing
- Badge counts showing active reminders in each category
- Color-coded UI for easy distinction

### 2. **Channel-Based Field Visibility**
**FIXED:** You are no longer forced to fill both email and SMS fields!

- **EMAIL only**: Shows email subject + email body fields
- **SMS only**: Shows SMS body field only  
- **BOTH**: Shows all fields (email subject, email body, SMS body)

Form validation now checks:
- If channel includes EMAIL → email subject and body are required
- If channel includes SMS → SMS body is required
- No unnecessary fields are shown or validated

### 3. **Post-Session Specific Features**

#### Watch Criteria Filtering
- **By Minutes**: Send only to attendees who watched X+ minutes (e.g., 30+ minutes)
- **By Percentage**: Send only to attendees who watched X%+ of webinar (e.g., 50%+)
- Radio button toggle to switch between minutes and percentage
- Real-time preview text showing the criteria

#### Send Timing After Completion
Choose when to send after session ends:
- **Immediately** (0 minutes)
- **1 hour later** (60 minutes)
- **6 hours later** (360 minutes)
- **12 hours later** (720 minutes)
- **1 day later** (1,440 minutes)
- **2 days later** (2,880 minutes)
- **3 days later** (4,320 minutes)
- **1 week later** (10,080 minutes)

### 4. **Context-Aware Info Banners**

#### Pre-Webinar (Blue Banner)
```
How pre-webinar reminders work:
• Sent before attendee's scheduled registration time
• Customize timing (5 min, 1 hour, 1 day, etc. before start)
• Perfect for reducing no-shows
• Use placeholders to personalize emails and SMS
```

#### Post-Session (Purple Banner)
```
How post-session follow-ups work:
• Triggered AFTER an attendee completes their viewing session
• Filter by minimum watch time (e.g., only send to people who watched 30+ minutes or 50%+)
• Send immediately after completion or schedule for X days later
• Perfect for evergreen webinars where each attendee finishes at different times
```

### 5. **Visual Distinction in Reminders List**

#### Pre-Webinar Display
- Green/blue timing badge: "2 hours before"
- Gray channel badge: "Email + SMS"
- Green active indicator
- ClickFunnels tag badge (if applicable)

#### Post-Session Display
- Purple timing badge: "Immediately after" or "3 days after completion"
- **Purple watch criteria badge**: "30+ min watched" or "50%+ watched"
- Gray channel badge: "SMS Only"
- Green active indicator
- ClickFunnels tag badge (if applicable)

### 6. **Smart Form Behavior**

#### Pre-Webinar Form Shows:
1. Timing: "Send reminder X before" dropdown
2. Default templates (optional quick-fill)
3. Channel selection (EMAIL/SMS/BOTH)
4. Email subject (if EMAIL selected)
5. Placeholders helper
6. SMS body (if SMS selected)
7. Email body (if EMAIL selected)
8. Active status checkbox
9. ClickFunnels integration (optional)

#### Post-Session Form Shows:
1. **Watch criteria**: Minutes OR Percentage filtering
2. **Send timing**: Immediately to 1 week after completion
3. Channel selection (EMAIL/SMS/BOTH)
4. Email subject (if EMAIL selected)
5. Placeholders helper
6. SMS body (if SMS selected)
7. Email body (if EMAIL selected)
8. Active status checkbox
9. ClickFunnels integration (optional)

## 🎨 UI/UX Highlights

### Color Coding
- **Blue (#3B82F6)**: Pre-webinar theme
- **Purple (#9333EA)**: Post-session theme
- **Green**: Active status indicators
- **Gray**: Neutral elements (channel badges, inactive states)

### Dynamic Placeholders
Both reminder types support these placeholders:
- `{{name}}` - Attendee name
- `{{email}}` - Attendee email
- `{{webinarTitle}}` - Webinar title
- `{{countdownLink}}` - Countdown page link
- `{{replayLink}}` - Replay link (for post-session)
- And more...

Placeholders have different default values in SMS/email based on reminder type.

### Responsive Empty States
When no reminders exist for a tab:
- Shows appropriate icon (Bell)
- Contextual message for that type
- "Create First Reminder/Follow-up" button
- Different copy for pre vs post

## 📝 TypeScript Interface

```typescript
interface ReminderTemplate {
  id: string
  webinarId: string
  minutesBefore: number           // Pre-webinar: minutes before start
  channel: 'EMAIL' | 'SMS' | 'BOTH'
  emailSubject: string
  emailBody: string
  smsBody: string | null
  isActive: boolean
  applyClickFunnelsTag: boolean
  clickFunnelsTag: string | null
  
  // New fields for post-session
  type?: 'pre_webinar' | 'post_webinar'   // Defaults to 'pre_webinar'
  minutesAfter?: number                    // Post-session: minutes after completion
  minWatchedMinutes?: number               // Watch filter: min minutes watched
  minWatchedPercentage?: number            // Watch filter: min percentage watched
}
```

## 🚀 What Still Needs Backend Work

### 1. Database Schema Update
Add new columns to `WebinarReminderTemplate` table:
```sql
ALTER TABLE "WebinarReminderTemplate" 
ADD COLUMN "type" TEXT DEFAULT 'pre_webinar',
ADD COLUMN "minutesAfter" INTEGER,
ADD COLUMN "minWatchedMinutes" INTEGER,
ADD COLUMN "minWatchedPercentage" INTEGER;
```

### 2. API Endpoint Updates
File: `/src/app/api/webinars/[id]/reminders/route.ts`
- Accept new fields in POST/PATCH handlers
- Validate based on type:
  - `pre_webinar` requires `minutesBefore`
  - `post_webinar` requires `minutesAfter` and watch criteria
- Store to database with new fields

### 3. Session Completion Tracking
- Detect when attendee completes/closes webinar player
- Calculate watch time (minutes + percentage)
- Trigger post-session reminder scheduling
- Find all active `post_webinar` templates for that webinar
- Filter by watch criteria
- Schedule reminder for `completionTime + minutesAfter`

### 4. Cron Job Updates
File: `/src/app/api/cron/process-reminders/route.ts`
- Handle both `pre_webinar` and `post_webinar` types
- For post-session: Check `scheduledFor` based on `sessionCompletionTime + minutesAfter`
- Process and send reminders based on type

## 🎯 User Experience Flow

### Pre-Webinar Scenario
1. Admin creates reminder: "1 day before" → Email + SMS
2. User registers for webinar (schedule: Nov 20, 2pm)
3. System schedules reminder for Nov 19, 2pm
4. Cron job sends reminder at scheduled time
5. User receives: "Your webinar starts tomorrow!"

### Post-Session Scenario (Evergreen)
1. Admin creates follow-up: "Immediately after completion" → SMS only, 30+ min watched
2. User joins webinar anytime (evergreen)
3. User watches for 45 minutes, then closes player
4. System triggers: User watched 45min ✓, Schedule SMS now (0 minutes after)
5. User receives: "Thanks for watching! Here's your next step..."

6. Admin creates another follow-up: "3 days after completion" → Email, 50%+ watched
7. Same user (watched 45 min = 75% of 60min webinar) ✓
8. System schedules email for 3 days later
9. 3 days later, cron sends: "Did you take action on what you learned?"

## 📱 Example Use Cases

### SMS-Only Post-Session (No Email Required!)
```
Channel: SMS Only
Watch Criteria: 30+ minutes watched
Send Timing: Immediately after completion
SMS Body: "Hi {{name}}, thanks for watching! Book your strategy call: [link]"

✅ No email subject required
✅ No email body required
✅ Only SMS field is mandatory
```

### Email-Only Pre-Webinar
```
Channel: EMAIL Only  
Send: 1 day before
Email Subject: "Tomorrow: {{webinarTitle}}"
Email Body: "<h2>See you tomorrow, {{name}}!</h2>..."

✅ No SMS body required
✅ Only email fields are mandatory
```

## 🔧 Technical Notes

### State Management
- `reminderType: 'pre_webinar' | 'post_webinar'` - Controls active tab
- `formData.type` - Stores type for submission
- `formData.useWatchMinutes` - Toggle between minutes/percentage
- Tab switching updates form visibility and info banner

### Filtering Logic
```typescript
// Show only reminders matching active tab
reminders.filter(r => (r.type || 'pre_webinar') === reminderType)

// Backwards compatibility: treat null/undefined type as 'pre_webinar'
```

### Form Validation
```typescript
// Channel-aware validation
if (channel includes EMAIL) → require emailSubject & emailBody
if (channel includes SMS) → require smsBody
```

## ✨ Key Improvements

1. **No More Separate Pages**: Everything in one place
2. **Context Awareness**: No webinar selector needed (URL already has webinar ID)
3. **Flexible Messaging**: Choose only the channels you want to use
4. **Engagement Filtering**: Target only engaged viewers (watch time)
5. **Timing Flexibility**: Immediate to 1 week after completion
6. **Visual Clarity**: Color-coded tabs and badges
7. **Better UX**: Conditional fields, smart validation, contextual help

---

**Status**: ✅ Frontend Complete | ⏳ Backend Pending (schema, API, tracking, cron)
**Last Updated**: November 19, 2025
