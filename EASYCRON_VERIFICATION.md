# EasyCron Configuration Verification

## ✅ Your EasyCron Setup Should Look Like This

### Basic Settings
```
Job Name: Webinar SMS & Email Reminders (or similar)
URL: https://webinar-platform-production.up.railway.app/api/cron/process-reminders
HTTP Method: POST
Cron Expression: */5 * * * *
Status: Enabled ✓
```

### HTTP Headers (CRITICAL)
```
Header Name: Authorization
Header Value: Bearer F1viPR8MgoVQzDVnK/vy1bqeH35qQB/xFa0azaiiHEI=
```

**Note:** Make sure there's a space after "Bearer" and before the token!

### Expected Response
When the job runs successfully, you should see:
```json
{
  "success": true,
  "reminderStats": {
    "processed": X,
    "sent": Y,
    "failed": 0,
    "skipped": Z
  },
  "clickFunnelsTagStats": {
    "processed": X,
    "applied": Y,
    "failed": 0
  },
  "timestamp": "2025-11-20T..."
}
```

---

## 🔍 How to Verify It's Working

### 1. Check EasyCron Dashboard
1. Log in to EasyCron: https://www.easycron.com/user/login
2. Go to your cron job list
3. Check the execution history

**What to look for:**
- ✅ Status: "Enabled" (green)
- ✅ Last Execution: Should show recent time (within last 5 minutes)
- ✅ Next Execution: Should show next run time
- ✅ Response Code: 200 (success)
- ✅ Response Body: Should show JSON with "success": true

### 2. Check Execution Log
Click on your cron job → View "Execution Log"

**Good signs:**
- ✅ HTTP Status: 200
- ✅ Response contains: `"success":true`
- ✅ Runs every 5 minutes
- ✅ No errors

**Bad signs:**
- ❌ HTTP Status: 401 (Authorization header wrong)
- ❌ HTTP Status: 500 (Server error)
- ❌ Response: `{"error":"Unauthorized"}`
- ❌ Job disabled or paused

### 3. Test Manual Trigger
In EasyCron, click "Test Run" or "Run Now"

**Expected:**
- Takes 1-5 seconds to complete
- Shows 200 response code
- Response body shows success and stats

---

## 🧪 Test Right Now

Since you have 3 SMS scheduled for tomorrow (10:45 AM, 10:55 AM, 10:59 AM), your cron job should be running but showing zero reminders processed because none are due yet.

**Current Expected Behavior:**
```json
{
  "success": true,
  "reminderStats": {
    "processed": 0,  ← No reminders due yet
    "sent": 0,
    "failed": 0,
    "skipped": 0
  },
  "clickFunnelsTagStats": {
    "processed": 0,
    "applied": 0,
    "failed": 0
  }
}
```

**Tomorrow at 10:45 AM, it should show:**
```json
{
  "success": true,
  "reminderStats": {
    "processed": 1,  ← Picked up 1 reminder
    "sent": 1,       ← Successfully sent SMS
    "failed": 0,
    "skipped": 0
  }
}
```

---

## 🚨 Common Issues & Fixes

### Issue 1: Authorization Error (401)
**Symptom:** Response shows `{"error":"Unauthorized"}`

**Fix:**
1. Go to your cron job settings
2. Click "HTTP Headers" section
3. Verify header is exactly:
   - Name: `Authorization`
   - Value: `Bearer F1viPR8MgoVQzDVnK/vy1bqeH35qQB/xFa0azaiiHEI=`
4. Make sure there's a SPACE between "Bearer" and the token
5. Save and test again

### Issue 2: Job Not Running
**Symptom:** Last execution time is hours/days old

**Fix:**
1. Check if job is "Enabled" (not paused)
2. Verify cron expression: `*/5 * * * *`
3. Check if you hit your EasyCron free tier limit (usually 200-250 executions/day is OK)
4. Try clicking "Enable" to restart it

### Issue 3: Wrong HTTP Method
**Symptom:** Error 404 or 405

**Fix:**
1. Ensure HTTP Method is set to **POST** (not GET)
2. Save and test

### Issue 4: SSL/Certificate Error
**Symptom:** Error about SSL certificate

**Fix:**
1. Verify URL starts with `https://` (not `http://`)
2. Check Railway deployment is actually running
3. Try accessing URL in browser first

---

## 📊 What Should Be Happening Now

### Current Status (Nov 20, 2025 - 3:53 AM IST)
- ✅ EasyCron should be running every 5 minutes
- ✅ Each run should return success with 0 processed (no reminders due yet)
- ✅ 3 SMS waiting for tomorrow morning (10:45, 10:55, 10:59 AM)

### Expected Timeline

**10:45 AM IST:**
- EasyCron runs at 10:45:00 (or within 5 min)
- Picks up first SMS reminder (15 min before webinar)
- Sends SMS to +61 423092939
- Updates status to SENT

**10:55 AM IST:**
- EasyCron runs
- Picks up second SMS reminder (5 min before)
- Sends SMS to same number
- Updates status to SENT

**10:59 AM IST:**
- EasyCron runs
- Picks up third SMS reminder (1 min before)
- Sends SMS
- Updates status to SENT

**Result:**
- User receives 3 SMS reminders at correct times
- All reminders marked as SENT in database
- ClickSend logs show 3 SMS sent

---

## 🔍 How to Check if EasyCron is Actually Calling Your API

### Method 1: Check Railway Logs
```bash
railway logs --tail 50
```

Look for these messages every 5 minutes:
```
🔔 Cron job: Processing pending reminders + ClickFunnels tags...
📬 Processing 0 pending reminders...
```

If you DON'T see these messages, EasyCron is not hitting your endpoint.

### Method 2: Check Request Count
In Railway dashboard:
1. Go to your service
2. Check "Metrics" tab
3. Look at request count - should spike every 5 minutes

### Method 3: Manual Test
Run this command and compare with EasyCron response:
```bash
curl -X POST https://webinar-platform-production.up.railway.app/api/cron/process-reminders \
  -H "Authorization: Bearer F1viPR8MgoVQzDVnK/vy1bqeH35qQB/xFa0azaiiHEI=" \
  -H "Content-Type: application/json"
```

Should get same response as EasyCron shows.

---

## 📋 Quick Checklist

### EasyCron Settings
- [ ] Job is **Enabled** (not paused)
- [ ] URL is correct: `https://webinar-platform-production.up.railway.app/api/cron/process-reminders`
- [ ] HTTP Method is **POST**
- [ ] Cron Expression is `*/5 * * * *`
- [ ] Authorization header is set correctly
- [ ] Last execution shows within last 5-10 minutes
- [ ] Response code is 200
- [ ] Response body shows `"success":true`

### Railway Settings
- [ ] ClickSend variables are set (CLICK_SEND_USERNAME, CLICK_SEND_API_KEY, CLICK_SEND_FROM)
- [ ] CRON_SECRET is set
- [ ] Service is deployed and running
- [ ] No errors in logs

### Database Status
- [ ] 3 SMS reminders with status PENDING
- [ ] All scheduled for tomorrow morning
- [ ] All have valid phone numbers
- [ ] All have SMS body content

---

## ✅ Everything Should Be Working If...

1. **EasyCron shows:**
   - Green "Enabled" status
   - Last run within 5 minutes
   - Response code 200
   - Response contains `"success":true`

2. **Railway logs show (every 5 minutes):**
   - "Cron job: Processing pending reminders..."
   - No errors about authorization

3. **Database shows:**
   - 3 PENDING SMS for tomorrow
   - No FAILED reminders
   - Environment variables all set

**If all above are true:** System is working perfectly! SMS will send tomorrow morning automatically. 🎉

---

## 🆘 Need Help?

If something's not working:
1. Screenshot your EasyCron execution log
2. Copy the latest Railway logs: `railway logs --tail 20`
3. Share the error message you're seeing

I can help debug! 🚀

---

**Last Updated:** Nov 20, 2025 3:53 AM IST
**Next SMS Scheduled:** Nov 20, 2025 10:45 AM IST (6 hours 52 minutes from now)
