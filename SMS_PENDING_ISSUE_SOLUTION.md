# SMS Reminders Stuck in PENDING - Root Cause & Solution

## 🚨 Current Status

**SMS reminders are stuck in PENDING and not being sent.**

### What We Found

```bash
📱 Pending SMS Reminders (Due Now): 2

1. ID: cmi6jby0t0004nw0foz1pwycr
   Phone: +91 9310880027
   Scheduled: Nov 19, 9:55 PM (OVERDUE)
   Template: 5 minutes before webinar

2. ID: cmi6jby0t0003nw0fqjfxy58n
   Phone: +91 9310880027  
   Scheduled: Nov 19, 9:59 PM (OVERDUE)
   Template: 1 minute before webinar

⚙️ Environment Check:
✗ CLICK_SEND_USERNAME: Missing
✗ CLICK_SEND_API_KEY: Missing
✗ CLICK_SEND_FROM: Using default "Webinar"
✓ CRON_SECRET: Set

📤 Last Sent SMS: NONE (no SMS has ever been sent)
```

---

## 🔍 Root Causes

### Issue 1: Missing ClickSend Credentials ❌

**Local Environment:**
- `CLICK_SEND_USERNAME` is **NOT SET**
- `CLICK_SEND_API_KEY` is **NOT SET**  
- `CLICK_SEND_FROM` is **NOT SET**

**Railway Environment:**
Need to verify these are properly configured in Railway.

### Issue 2: No Automated Cron Job ⏰

**Current State:**
- Reminders are being **scheduled correctly** (status: PENDING)
- Cron job endpoint exists at `/api/cron/process-reminders`
- **BUT**: No external service is calling this endpoint every 5 minutes

**What Should Happen:**
- External cron service (EasyCron, Cron-Job.org, etc.) hits endpoint every 5 min
- Endpoint processes all PENDING reminders where `scheduledFor <= now`
- Sends SMS via ClickSend API
- Updates status to SENT or FAILED

**What's Actually Happening:**
- Reminders sit in PENDING status forever
- No automated processing
- Manual trigger would work, but no automation exists

---

## ✅ Solutions

### Solution 1: Configure ClickSend Credentials in Railway

#### Step 1: Get ClickSend Credentials
You should already have these:
```
CLICK_SEND_USERNAME=emaaanWork
CLICK_SEND_API_KEY=81ACB559-9540-9010-EC2F-0EAE11BDEFE6
CLICK_SEND_FROM="+18332993106"
```

#### Step 2: Set in Railway
```bash
railway variables set CLICK_SEND_USERNAME=emaaanWork
railway variables set CLICK_SEND_API_KEY=81ACB559-9540-9010-EC2F-0EAE11BDEFE6
railway variables set CLICK_SEND_FROM="+18332993106"
```

Or via Railway Dashboard:
1. Go to your project
2. Click "Variables" tab
3. Add these three variables
4. Redeploy

#### Step 3: Verify
```bash
railway logs | grep -i "clicksend"
```

---

### Solution 2: Set Up Automated Cron Job

You need an **external service** to call your endpoint every 5 minutes.

#### Option A: EasyCron (Recommended - FREE)

**Setup Time: 5 minutes**

1. **Sign Up**
   - Go to: https://www.easycron.com/user/register
   - Free account, no credit card needed
   - Verify your email

2. **Create Cron Job**
   - Click "Create New Cron Job"
   - Fill in:
     ```
     Job Name: Webinar SMS & Email Reminders
     URL: https://webinar-platform-production.up.railway.app/api/cron/process-reminders
     HTTP Method: POST
     Cron Expression: */5 * * * *
     (Every 5 minutes)
     ```

3. **Add Authorization Header**
   - Click "HTTP Headers" section
   - Add header:
     - Header Name: `Authorization`
     - Header Value: `Bearer F1viPR8MgoVQzDVnK/vy1bqeH35qQB/xFa0azaiiHEI=`

4. **Save and Test**
   - Click "Create Cron Job"
   - Click "Test Run" to verify
   - Should see: `{"success":true,...}`

✅ **Done!** SMS reminders will now process automatically every 5 minutes.

---

#### Option B: Cron-Job.org (Also FREE)

**Setup Time: 5 minutes**

1. **Sign Up**
   - Go to: https://cron-job.org/en/signup/
   - Create FREE account
   - Verify email

2. **Create Cronjob**
   - Click "Create cronjob"
   - Fill in:
     ```
     Title: Webinar Reminders
     Address: https://webinar-platform-production.up.railway.app/api/cron/process-reminders
     Schedule: */5 * * * * (Every 5 minutes)
     ```

3. **Advanced Settings**
   - Under "Request":
     - Request method: **POST**
   - Under "Request headers":
     - Click "Add header"
     - Key: `Authorization`
     - Value: `Bearer F1viPR8MgoVQzDVnK/vy1bqeH35qQB/xFa0azaiiHEI=`

4. **Save and Enable**
   - Click "Create cronjob"
   - Enable the cronjob
   - Click "Run now" to test

✅ **Done!**

---

#### Option C: UptimeRobot (Monitoring Service)

**Setup Time: 10 minutes**

1. Sign up at: https://uptimerobot.com/
2. Create "HTTP(s)" monitor
3. Set interval to 5 minutes
4. Use POST method
5. Add custom HTTP header for Authorization

*Note: UptimeRobot is primarily for uptime monitoring, not ideal for cron jobs*

---

## 🧪 How to Verify It's Working

### Check 1: Cron Service Dashboard
- View execution history in EasyCron/Cron-Job.org
- Check for successful runs every 5 minutes
- Look for any errors

### Check 2: Railway Logs
```bash
railway logs --tail
```

Look for these messages every 5 minutes:
```
🔔 Cron job: Processing pending reminders + ClickFunnels tags...
📬 Processing X pending reminders...
📱 Reminder SMS sent
✅ Reminder processed successfully
```

### Check 3: Database Query
```bash
cd "/Volumes/WD/CODE/Webinar Play 2" && node << 'EOF'
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.webinarReminderSent.findMany({
  where: {
    channel: { in: ['SMS', 'BOTH'] },
    status: 'SENT'
  },
  orderBy: { sentAt: 'desc' },
  take: 5
}).then(r => {
  console.log('✅ Recent Sent SMS:', r.length);
  r.forEach(s => console.log('  -', s.sentAt, s.smsSentTo));
}).finally(() => prisma.$disconnect());
EOF
```

### Check 4: Your Phone
- Should receive SMS at scheduled times
- Check if messages are personalized correctly
- Verify sender ID shows correctly

---

## 🔄 What Happens After Setup

### Every 5 Minutes:
1. ✅ Cron service hits your endpoint
2. ✅ System finds PENDING reminders where `scheduledFor <= now`
3. ✅ For each reminder:
   - Validates phone number exists
   - Replaces placeholders ({{name}}, {{webinarTime}}, etc.)
   - Sends via ClickSend API
   - Updates status to SENT or FAILED
4. ✅ Processes ClickFunnels tags similarly
5. ✅ Returns stats: `{ processed: X, sent: Y, failed: Z }`

### For Future Registrations:
1. ✅ User registers with phone number
2. ✅ `scheduleRemindersForRegistration()` is called
3. ✅ SMS reminder record created with status: PENDING
4. ✅ Cron job automatically sends it at scheduled time

---

## 🐛 Troubleshooting

### Problem: SMS Still Not Sending

**Check 1: ClickSend Balance**
- Login to ClickSend dashboard
- Verify account has credits
- Check SMS pricing for your destination country

**Check 2: Phone Format**
- Must include country code: `+1234567890`
- No spaces, dashes, or parentheses
- Valid international format

**Check 3: Cron Execution**
```bash
# Test manually
curl -X POST https://webinar-platform-production.up.railway.app/api/cron/process-reminders \
  -H "Authorization: Bearer F1viPR8MgoVQzDVnK/vy1bqeH35qQB/xFa0azaiiHEI="
```

**Check 4: Railway Environment Variables**
```bash
railway variables
# Should show:
# - CLICK_SEND_USERNAME
# - CLICK_SEND_API_KEY
# - CLICK_SEND_FROM
# - CRON_SECRET
```

**Check 5: SMS Template**
- Ensure template has `smsBody` field filled
- Check for any syntax errors in template
- Verify placeholders are valid

---

## 📊 Current Pending SMS

As of **Nov 19, 2025 10:13 PM**:

### Overdue SMS (Should have been sent):
1. **5-minute reminder** - Scheduled for 9:55 PM (18 minutes overdue)
2. **1-minute reminder** - Scheduled for 9:59 PM (14 minutes overdue)

**Recipient:** +91 9310880027 (Ariba Farheen)
**Webinar:** Started at 10:00 PM

**Status:** ⏰ These will be marked as SKIPPED when cron runs (webinar already passed)

---

## ⚡ Quick Action Checklist

Priority order:

- [ ] **1. Set up cron job** (Choose EasyCron or Cron-Job.org)
- [ ] **2. Verify Railway has ClickSend credentials**
- [ ] **3. Wait 5-10 minutes for cron to run**
- [ ] **4. Check Railway logs** for processing messages
- [ ] **5. Verify SMS sent** to your phone
- [ ] **6. Check database** for SENT status
- [ ] **7. Test with new registration** for upcoming webinar

---

## 🎯 Expected Behavior After Fix

### Immediate Future (Next 5 minutes):
- Cron job runs
- Finds 2 overdue SMS reminders
- Marks them as SKIPPED (webinar already passed)
- No SMS sent (correct behavior - webinar is over)

### Next Registration (Future Webinar):
- User registers with phone number
- SMS reminder scheduled (status: PENDING)
- Cron job picks it up at scheduled time
- SMS sent via ClickSend
- Status updated to SENT
- User receives SMS on their phone

---

## 📝 Summary

**Two separate issues:**

1. **Missing ClickSend Credentials in Railway** ❌
   - Fix: Add environment variables
   - Impact: Prevents SMS from being sent

2. **No Automated Cron Job Running** ❌  
   - Fix: Set up external cron service (EasyCron/Cron-Job.org)
   - Impact: Reminders sit in PENDING forever

**After both fixes:**
- ✅ SMS reminders will send automatically
- ✅ Email reminders will send automatically
- ✅ ClickFunnels tags will apply automatically
- ✅ No manual intervention needed

---

**Status:** 🔴 **CRITICAL - NEEDS IMMEDIATE ACTION**
**Impact:** All SMS reminders are stuck, users not receiving notifications
**Time to Fix:** ~10 minutes total
**Difficulty:** Easy (just configuration, no code changes)
