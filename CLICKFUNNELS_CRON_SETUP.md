# ClickFunnels Tagging with External Cron Job

## Quick Setup (5 minutes)

The ClickFunnels tagging system automatically applies tags when reminders are sent. To make it work, you need a cron job to check for pending tags every few minutes.

---

## Option 1: EasyCron (Recommended - Free)

### Step 1: Get Your Cron URL
Your cron endpoint is:
```
https://your-railway-app.up.railway.app/api/cron/process-reminders
```

Replace `your-railway-app.up.railway.app` with your actual Railway domain.

### Step 2: Get Your CRON_SECRET
1. Open your `.env` file
2. Find or add this line:
```env
CRON_SECRET=your-random-secret-here-make-it-long-and-secure
```
3. Copy the value after `CRON_SECRET=`

### Step 3: Set Up EasyCron
1. Go to **https://www.easycron.com**
2. Sign up for FREE account (no credit card needed)
3. Click **"Create New Cron Job"**
4. Fill in:
   - **URL**: `https://your-railway-app.up.railway.app/api/cron/process-reminders`
   - **Cron Expression**: `*/10 * * * *` (every 10 minutes)
   - **HTTP Method**: `POST`
   - **HTTP Headers**: Click "Add Header"
     - Header Name: `Authorization`
     - Header Value: `Bearer YOUR_CRON_SECRET_HERE`
   - **Name**: `ClickFunnels Reminder Tags`
5. Click **"Create"**
6. Test it by clicking **"Test Run"**

### What It Does:
✅ Every 10 minutes, checks for pending reminder tags  
✅ Applies ClickFunnels tags when reminders are due  
✅ Retries failed tags automatically  
✅ Logs everything for debugging  

---

## Option 2: Cron-Job.org (Also Free)

1. Go to **https://cron-job.org**
2. Sign up for FREE account
3. Click **"Create cronjob"**
4. Fill in:
   - **Title**: `ClickFunnels Tags`
   - **URL**: `https://your-railway-app.up.railway.app/api/cron/process-reminders`
   - **Schedule**: Every 10 minutes
   - **Request method**: `POST`
   - **HTTP Headers**:
     - Add header: `Authorization: Bearer YOUR_CRON_SECRET_HERE`
5. Save and Enable

---

## Option 3: Uptime Robot (Ping Service)

⚠️ **Note**: Uptime Robot uses GET requests, so we need to modify the endpoint slightly.

### Step 1: Create GET endpoint
The endpoint `/api/cron/process-reminders` already supports GET for health checks. We'll use the POST endpoint with authentication.

### Step 2: Set Up Uptime Robot
1. Go to **https://uptimerobot.com**
2. Sign up for FREE account
3. Click **"Add New Monitor"**
4. Fill in:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: `ClickFunnels Tags`
   - **URL**: `https://your-railway-app.up.railway.app/api/cron/process-reminders?secret=YOUR_CRON_SECRET`
   - **Monitoring Interval**: 10 minutes
5. Save

**Alternative**: Use a URL shortener or webhook service to convert GET to POST.

---

## Verification

### Test Your Setup:

1. **Manual Test** (in terminal):
```bash
curl -X POST https://your-railway-app.up.railway.app/api/cron/process-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

2. **Check Response**:
You should see something like:
```json
{
  "success": true,
  "reminderStats": {
    "processed": 0,
    "sent": 0,
    "failed": 0,
    "skipped": 0
  },
  "clickFunnelsTagStats": {
    "processed": 2,
    "applied": 2,
    "failed": 0
  },
  "timestamp": "2025-11-14T..."
}
```

3. **Check Railway Logs**:
```bash
railway logs
```
Look for:
```
🔔 Cron job: Processing pending reminders + ClickFunnels tags...
✅ ClickFunnels tag applied for registration...
```

---

## How It Works

### When Someone Registers:
1. ✅ **Immediate Tag** - Applied based on registration time:
   - Registered 24+ hours before → `24HRREMINDER`
   - Registered 2-24 hours before → `2HRREMINDER`
   - Registered 1-2 hours before → `1HRREMINDER`
   - Registered 15min-1hr before → `15MINREMINDER`
   - Registered <15 min before → `WESTARTED`

2. ✅ **Scheduled Reminder Tags** - Applied when each reminder is sent:
   - 24 hours before → Applies your configured tag
   - 2 hours before → Applies your configured tag
   - etc.

### Cron Job Runs Every 10 Minutes:
1. Checks database for pending tags
2. Applies tags to ClickFunnels contacts
3. Marks them as complete
4. Retries failed tags (up to 5 times)

---

## Required Environment Variables

Make sure these are set in Railway:

```env
# ClickFunnels API
CLICKFUNNELS_API_KEY=your_api_key
CLICKFUNNELS_WORKSPACE_ID=your_workspace_id

# Cron Security
CRON_SECRET=your-random-secret-here

# Optional: Tag IDs (auto-detected if not set)
CLICKFUNNELS_TAG_24HRREMINDER=123456
CLICKFUNNELS_TAG_2HRREMINDER=123457
CLICKFUNNELS_TAG_1HRREMINDER=123458
CLICKFUNNELS_TAG_15MINREMINDER=123459
CLICKFUNNELS_TAG_WESTARTED=123460
```

---

## Testing the System

### 1. Create a Test Registration
```bash
# Register for a webinar that starts in 25 hours
# Tag "24HRREMINDER" should be applied immediately
```

### 2. Check ClickFunnels
- Go to ClickFunnels → Contacts
- Search for the test email
- Verify the tag was applied

### 3. Monitor Cron Job
- Check your cron service dashboard
- Verify it's running every 10 minutes
- Check for successful responses (200 OK)

### 4. Check Railway Logs
```bash
railway logs
```
Look for:
```
✅ ClickFunnels tag "24HRREMINDER" applied for test@example.com
⏳ Scheduled ClickFunnels tag application: 2HRREMINDER (in 23 hours)
```

---

## Troubleshooting

### Tags Not Being Applied?

1. **Check ClickFunnels API**:
```bash
node test-clickfunnels-tags.js
```
This will show all available tags and their IDs.

2. **Check Cron Job is Running**:
- Login to EasyCron/Cron-Job.org
- View execution history
- Check for errors

3. **Check Railway Logs**:
```bash
railway logs --tail
```
Look for error messages.

4. **Verify CRON_SECRET**:
- Make sure it matches in `.env` and cron service
- No extra spaces or quotes

5. **Test Endpoint Manually**:
```bash
curl -X POST https://your-app.railway.app/api/cron/process-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -v
```

### Common Issues:

❌ **401 Unauthorized** - CRON_SECRET doesn't match  
❌ **404 Not Found** - Wrong URL or app not deployed  
❌ **500 Server Error** - Check Railway logs for details  
❌ **Tags not found** - Run `node scripts/ensure-clickfunnels-reminder-tags.js`  

---

## Best Practices

1. ✅ **Run cron every 10 minutes** (not more frequent)
2. ✅ **Monitor cron job execution** in your service dashboard
3. ✅ **Check Railway logs** occasionally for errors
4. ✅ **Test with real registrations** before going live
5. ✅ **Keep CRON_SECRET secure** (don't share it)

---

## Quick Start Checklist

- [ ] Add `CRON_SECRET` to Railway environment variables
- [ ] Deploy your app to Railway
- [ ] Copy your Railway app URL
- [ ] Sign up for EasyCron.com (free)
- [ ] Create cron job with POST method and Authorization header
- [ ] Test with manual curl command
- [ ] Create test registration to verify tags work
- [ ] Check ClickFunnels for applied tags
- [ ] Done! 🎉

---

## Need Help?

1. Check Railway logs: `railway logs`
2. Run tag test: `node test-clickfunnels-tags.js`
3. Check cron execution history in your cron service
4. Review `CLICKFUNNELS_REMINDER_TAGGING_GUIDE.md` for more details
