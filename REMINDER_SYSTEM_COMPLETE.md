# Webinar Reminder System - Complete Guide

## Overview

A comprehensive reminder system that automatically sends email reminders to registered attendees before their webinar starts. The system supports multiple reminders per webinar (e.g., 24 hours, 2 hours, 15 minutes before) and only sends reminders that are still relevant based on when the user registered.

## Features

✅ **Multiple Reminders Per Webinar**
- Set as many reminder times as you want (24 hrs, 2 hrs, 15 mins, etc.)
- Each webinar can have its own reminder schedule

✅ **Smart Scheduling**
- Only sends reminders that haven't passed
- If someone registers 2 hours before, they won't get the 24-hour reminder
- Automatically skips reminders for webinars that have already started

✅ **Personalized Emails**
- Includes webinar details, countdown link, and referral link
- Shows time in user's timezone
- Customizable email templates with placeholders

✅ **Email via Microsoft Graph API**
- No phone verification needed
- Uses your Office 365 account (support@emaanpower.com)
- Reliable delivery with fallback options

✅ **Tracking & Analytics**
- Track reminder status (sent, failed, skipped, cancelled)
- See delivery statistics per webinar
- Retry failed reminders

## Database Schema

### WebinarReminderTemplate
Defines when and what to send for a webinar:
```prisma
model WebinarReminderTemplate {
  id             String
  webinarId      String
  minutesBefore  Int      // 1440 = 24 hrs, 120 = 2 hrs, 15 = 15 mins
  channel        ReminderChannel (EMAIL, SMS, BOTH)
  emailSubject   String
  emailBody      String   // HTML with placeholders
  smsBody        String?
  isActive       Boolean
}
```

### WebinarReminderSent
Tracks individual reminders sent to registrants:
```prisma
model WebinarReminderSent {
  id             String
  templateId     String
  registrationId String
  scheduledFor   DateTime  // When to send this reminder
  sentAt         DateTime? // When it was actually sent
  status         ReminderStatus (PENDING, SENT, FAILED, CANCELLED, SKIPPED)
  channel        ReminderChannel
  errorMessage   String?
  retryCount     Int
}
```

## Setup Instructions

### 1. Run Database Migration

```bash
npx prisma migrate dev --name add_reminder_system
```

This creates the reminder tables in your database.

### 2. Configure Microsoft Graph API

Add to `.env`:
```env
# Microsoft Graph API (PRIMARY)
MICROSOFT_CLIENT_ID=cdfb9105-b4db-419c-b19f-8d1fb267e872
MICROSOFT_TENANT_ID=common
MICROSOFT_CLIENT_SECRET=your_client_secret_here

# Email Configuration
EMAIL_ADDRESS=support@emaanpower.com

# Cron Secret (for securing the cron endpoint)
CRON_SECRET=your_random_secret_here
```

**Important:** You need to get the `MICROSOFT_CLIENT_SECRET` from Azure Portal:
1. Go to Azure Portal → App Registrations
2. Find your app (Client ID: cdfb9105-b4db-419c-b19f-8d1fb267e872)
3. Go to "Certificates & secrets"
4. Create a new client secret
5. Copy the value and add it to `.env`

### 3. Set Up Cron Job

You need a cron job to process reminders every 5-10 minutes.

#### Option A: Using Railway's Cron Jobs
1. Go to your Railway project dashboard
2. Add a new cron job service
3. Schedule: `*/5 * * * *` (every 5 minutes)
4. Command: 
```bash
curl -X POST https://your-domain.com/api/cron/process-reminders \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

#### Option B: Using External Cron Service (cron-job.org, EasyCron, etc.)
1. Sign up for a cron service
2. Create a new cron job:
   - URL: `https://your-domain.com/api/cron/process-reminders`
   - Method: POST
   - Headers: `Authorization: Bearer your_cron_secret_here`
   - Schedule: Every 5-10 minutes

#### Option C: Using Vercel Cron (if you switch to Vercel)
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/process-reminders",
    "schedule": "*/5 * * * *"
  }]
}
```

### 4. Enable Reminder Scheduling in Registration

Uncomment the lines in `/api/webinars/[id]/register/route.ts`:

```typescript
// Add import at top:
import { scheduleRemindersForRegistration } from '@/lib/reminders'

// In the registration handler, after ClickFunnels sync:
scheduleRemindersForRegistration(registration.id).catch(error => {
  console.error('⚠️ Failed to schedule reminders (non-blocking):', error)
})
```

## Usage

### Creating Reminder Templates

Use the dashboard UI or API to create reminders for a webinar:

**API: POST /api/webinars/{webinarId}/reminders**
```json
{
  "minutesBefore": 1440,
  "channel": "EMAIL",
  "emailSubject": "Your webinar starts in 24 hours!",
  "emailBody": "<h1>Hi {{name}}!</h1><p>Your webinar <strong>{{webinarTitle}}</strong> starts in 24 hours.</p><p>Time: {{webinarTime}}</p><p><a href='{{countdownLink}}'>Go to Countdown Page</a></p><p>Invite friends: <a href='{{referralLink}}'>{{referralLink}}</a></p>"
}
```

### Email Template Placeholders

Use these placeholders in your email templates:

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{name}}` | Attendee's name | John Doe |
| `{{email}}` | Attendee's email | john@example.com |
| `{{webinarTitle}}` | Webinar title | How to Help Your Child Love Islam |
| `{{webinarTime}}` | Formatted time in user's timezone | Thursday, November 13, 2025 at 11:43:23 PM GMT+5:30 |
| `{{countdownLink}}` | Direct link to countdown page | https://yoursite.com/countdown/loveislam?r=abc... |
| `{{referralLink}}` | User's unique referral link | https://yoursite.com/w/loveislam?ref=WJ7X0U |
| `{{webinarTimezone}}` | User's timezone | Asia/Calcutta |

### Default Reminder Templates (Recommended)

#### 24 Hours Before
```json
{
  "minutesBefore": 1440,
  "emailSubject": "Tomorrow: {{webinarTitle}}",
  "emailBody": "Your webinar starts in 24 hours! Details: {{webinarTime}}"
}
```

#### 2 Hours Before
```json
{
  "minutesBefore": 120,
  "emailSubject": "Starting Soon: {{webinarTitle}}",
  "emailBody": "Your webinar starts in 2 hours! Join here: {{countdownLink}}"
}
```

#### 15 Minutes Before
```json
{
  "minutesBefore": 15,
  "emailSubject": "Final Reminder: {{webinarTitle}} starts in 15 minutes!",
  "emailBody": "Get ready! Your webinar starts in 15 minutes. Click here: {{countdownLink}}"
}
```

## API Endpoints

### Get Reminder Templates
```
GET /api/webinars/{webinarId}/reminders
```

Returns all reminder templates for a webinar.

### Create Reminder Template
```
POST /api/webinars/{webinarId}/reminders
Body: {
  minutesBefore: number,
  channel: "EMAIL" | "SMS" | "BOTH",
  emailSubject: string,
  emailBody: string,
  smsBody?: string
}
```

### Update Reminder Template
```
PATCH /api/webinars/{webinarId}/reminders/{templateId}
Body: { ...fields to update }
```

### Delete Reminder Template
```
DELETE /api/webinars/{webinarId}/reminders/{templateId}
```

### Process Reminders (Cron)
```
POST /api/cron/process-reminders
Headers: Authorization: Bearer {CRON_SECRET}
```

## How It Works

### 1. Registration Flow
```
User Registers
    ↓
Registration Created
    ↓
scheduleRemindersForRegistration() called
    ↓
For each active reminder template:
  - Calculate: webinarStartTime - minutesBefore
  - If that time is in the future:
    → Create WebinarReminderSent record with status=PENDING
  - If that time has passed:
    → Skip (don't create record)
```

### 2. Reminder Processing (Cron)
```
Every 5-10 minutes:
  ↓
Find all PENDING reminders where scheduledFor <= now
  ↓
For each reminder:
  - Check if webinar has passed → mark as SKIPPED
  - Build personalized email with placeholders
  - Send email via Microsoft Graph API
  - Update status to SENT or FAILED
  - Track error messages and retry count
```

### 3. Smart Scheduling Example

**Scenario:** Webinar starts at 6:00 PM
- Templates: 24 hrs (6:00 PM yesterday), 2 hrs (4:00 PM today), 15 mins (5:45 PM today)

**User A registers at 12:00 PM (6 hours before):**
- ✅ 2 hrs reminder scheduled for 4:00 PM
- ✅ 15 mins reminder scheduled for 5:45 PM
- ❌ 24 hrs reminder NOT scheduled (time has passed)

**User B registers at 5:30 PM (30 minutes before):**
- ✅ 15 mins reminder scheduled for 5:45 PM
- ❌ 2 hrs reminder NOT scheduled (time has passed)
- ❌ 24 hrs reminder NOT scheduled (time has passed)

## Monitoring & Troubleshooting

### Check Reminder Status

Query the database:
```sql
SELECT 
  r.name,
  r.email,
  rt.minutesBefore,
  rs.scheduledFor,
  rs.sentAt,
  rs.status,
  rs.errorMessage
FROM webinar_reminders_sent rs
JOIN registrations r ON rs.registrationId = r.id
JOIN webinar_reminder_templates rt ON rs.templateId = rt.id
WHERE r.webinarId = 'your_webinar_id'
ORDER BY rs.scheduledFor DESC;
```

### View Reminder Statistics

Call the API or check logs:
```typescript
import { getWebinarReminderStats } from '@/lib/reminders'

const stats = await getWebinarReminderStats(webinarId)
// Returns: { PENDING: 10, SENT: 45, FAILED: 2, SKIPPED: 3 }
```

### Common Issues

**Reminders not sending:**
1. Check cron job is running
2. Verify MICROSOFT_CLIENT_SECRET is set
3. Check email logs in Railway/server logs
4. Test manually: `POST /api/cron/process-reminders`

**Wrong timezone:**
- Reminders use the timezone from user's registration
- Make sure registration captures timezone correctly

**Emails going to spam:**
- Add SPF/DKIM records for your domain
- Use your actual domain in EMAIL_ADDRESS

## Future Enhancements

- [ ] SMS reminders via Twilio
- [ ] Calendar invite attachments (.ics files)
- [ ] A/B testing different reminder times
- [ ] Reminder analytics dashboard in UI
- [ ] Unsubscribe functionality
- [ ] Preview reminder emails before sending
- [ ] Bulk edit reminder templates
- [ ] Template library with pre-made templates

## Testing

### Manual Test

1. Create a test webinar with reminders (e.g., 5 minutes before, 2 minutes before)
2. Register with your email
3. Wait for scheduled time
4. Manually trigger: `curl -X POST http://localhost:3000/api/cron/process-reminders -H "Authorization: Bearer your_secret"`
5. Check your email

### Check Logs

```bash
# Railway logs
railway logs

# Check for:
# - "📅 Scheduling reminders for registration"
# - "📬 Processing X pending reminders"
# - "✅ Reminder sent successfully"
# - "❌ Failed to send reminder"
```

## Security

- Cron endpoint requires `CRON_SECRET` header
- All reminder APIs require authentication
- Email templates are sanitized
- Rate limiting on email sending (built into Graph API)

## Cost Considerations

- Microsoft Graph API: Free with Office 365
- Database: Minimal storage (reminders are small records)
- Processing: Very light (runs every 5-10 minutes)
- Emails: Included in Office 365 license

## Support

For issues:
1. Check server logs
2. Verify environment variables
3. Test with manual registration
4. Check database for reminder records
