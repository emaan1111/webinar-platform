# SMS Reminders Fix - Applied

## Problem Identified
SMS reminders were not being sent because:
1. ❌ **`scheduleRemindersForRegistration()` was not being called** during registration
2. ❌ Missing `CLICK_SEND_FROM` environment variable in Railway
3. ✅ ClickSend credentials were configured correctly
4. ✅ SMS reminder templates existed
5. ✅ 25 registrations had phone numbers

## Root Cause
The registration API route (`/api/webinars/[id]/register/route.ts`) was not calling the `scheduleRemindersForRegistration()` function that creates the reminder records in the database. This meant:
- No EMAIL reminders were being scheduled
- No SMS reminders were being scheduled
- Only ClickFunnels tags were being applied

## Fixes Applied

### 1. Added Reminder Scheduling to Registration Flow
**File:** `src/app/api/webinars/[id]/register/route.ts`

Added the import:
```typescript
import { scheduleRemindersForRegistration } from '@/lib/reminders'
```

Added the function call in the background tasks (after ClickFunnels sync):
```typescript
// Schedule email and SMS reminders
await scheduleRemindersForRegistration(registration.id)
  .catch(err => console.error('Failed to schedule reminders:', err));
```

### 2. Added Missing Environment Variable
**Railway:** Added `CLICK_SEND_FROM="+18332993106"`

This variable is used as the sender ID for SMS messages via ClickSend.

## How It Works Now

### For New Registrations
1. ✅ User registers for webinar
2. ✅ System fetches all active reminder templates (EMAIL, SMS, or BOTH)
3. ✅ Calculates when each reminder should be sent (e.g., 24hr, 2hr, 10min before)
4. ✅ Creates `WebinarReminderSent` records with status: PENDING
5. ✅ Only schedules reminders for future times (skips past times)
6. ✅ Checks if user has phone number before scheduling SMS reminders

### Cron Job Processing (Every 5 minutes)
1. ✅ Finds all PENDING reminders where `scheduledFor <= now`
2. ✅ For SMS reminders: validates phone number exists
3. ✅ Sends via ClickSend API using configured credentials
4. ✅ Updates status to SENT or FAILED
5. ✅ Records any errors for troubleshooting

## For Existing Registrations

### Backfill Script
A script has been created to schedule reminders for existing registrations that didn't get them:

**File:** `backfill-reminders.js`

Run it with:
```bash
node backfill-reminders.js
```

This will:
- Find all registrations without scheduled reminders
- Check if they have an upcoming webinar
- Schedule appropriate reminders (only future ones)
- Report how many reminders were scheduled

## Testing

### Test SMS Reminders
1. Create a test webinar with start time in 15 minutes
2. Add SMS reminder template: 10 minutes before
3. Register with a valid phone number (international format: +1234567890)
4. Wait 5 minutes (reminder should be due)
5. Manually trigger cron: 
   ```bash
   curl -X POST https://webinar-platform-production.up.railway.app/api/cron/process-reminders \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```
6. Check your phone for SMS

### Check Logs
```bash
railway logs

# Look for:
# - "📅 Scheduling reminders for registration"
# - "⏰ Scheduled reminder: 10 minutes before"
# - "📬 Processing X pending reminders"
# - "📱 Reminder SMS sent"
```

## Environment Variables Required

### ClickSend (for SMS)
```bash
CLICK_SEND_USERNAME=emaaanWork
CLICK_SEND_API_KEY=81ACB559-9540-9010-EC2F-0EAE11BDEFE6
CLICK_SEND_FROM="+18332993106"
```

### Cron Job
```bash
CRON_SECRET=your_secret_here
```

## Current Status
- ✅ Fix applied to registration flow
- ✅ Environment variables configured
- ✅ Ready for new registrations
- ⏳ Existing registrations need backfill (run script)

## Next Steps
1. **Deploy the fix** - Push code and redeploy on Railway
2. **Run backfill script** - Schedule reminders for existing registrations
3. **Test with real registration** - Verify SMS is sent
4. **Monitor logs** - Check cron job output for any errors

## Support
If SMS reminders still don't work:
1. Check ClickSend account balance
2. Verify phone numbers are in international format (+country_code...)
3. Check Railway logs for ClickSend API errors
4. Verify cron job is running every 5 minutes
5. Check reminder template has `smsBody` text
