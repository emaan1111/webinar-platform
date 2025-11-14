# Railway Cron Job Setup for Reminder System

## Overview
Your reminder system needs a cron job to automatically process pending reminders and ClickFunnels tags. This guide shows you how to set it up on Railway.

## Option 1: Railway Cron Jobs (Recommended)

Railway has built-in cron job support. Here's how to set it up:

### Step 1: Add Cron Configuration to railway.toml

Create a `railway.toml` file in your project root:

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm run start"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

# Cron job to process reminders every 5 minutes
[[cron]]
schedule = "*/5 * * * *"
command = "curl -X POST -H 'Authorization: Bearer $CRON_SECRET' $RAILWAY_PUBLIC_DOMAIN/api/cron/process-reminders"
```

### Step 2: Set Environment Variables in Railway

Go to your Railway project settings and add:

```bash
CRON_SECRET=your_random_secret_key_here
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

### Step 3: Deploy

Push your changes to GitHub, and Railway will automatically deploy with the cron job configured.

---

## Option 2: External Cron Service (Alternative)

If Railway's cron doesn't work, use a free external service:

### Services to Use:
1. **Cron-job.org** (Free, reliable)
   - URL: https://cron-job.org
   - Setup time: 2 minutes

2. **EasyCron** (Free tier available)
   - URL: https://www.easycron.com

3. **Render Cron Jobs** (If you're on Render)

### Setup with Cron-job.org:

1. **Sign up** at https://cron-job.org/en/signup/

2. **Create a new cron job:**
   - **Title:** "Webinar Reminder Processor"
   - **URL:** `https://your-app.railway.app/api/cron/process-reminders`
   - **Schedule:** Every 5 minutes (`*/5 * * * *`)
   - **Request Method:** POST
   - **Headers:**
     ```
     Authorization: Bearer YOUR_CRON_SECRET
     ```

3. **Save and Enable**

---

## Option 3: GitHub Actions (Free, Simple)

Create `.github/workflows/process-reminders.yml`:

```yaml
name: Process Reminders

on:
  schedule:
    # Run every 5 minutes
    - cron: '*/5 * * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  process-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Process Reminders
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-app.railway.app/api/cron/process-reminders
```

Then add `CRON_SECRET` to your GitHub repository secrets.

---

## Testing Your Cron Job

### Test Manually:

```bash
# Replace with your actual values
curl -X POST \
  -H "Authorization: Bearer your_cron_secret" \
  https://your-app.railway.app/api/cron/process-reminders
```

Expected response:
```json
{
  "success": true,
  "reminderStats": {
    "processed": 5,
    "sent": 4,
    "failed": 1,
    "skipped": 0
  },
  "clickFunnelsTagStats": {
    "processed": 3,
    "applied": 3,
    "failed": 0
  },
  "timestamp": "2025-11-14T10:30:00.000Z"
}
```

### Health Check:

```bash
curl https://your-app.railway.app/api/cron/process-reminders
```

---

## Monitoring Cron Jobs

### View Logs in Railway:

1. Go to your Railway project
2. Click on your service
3. Go to **Deployments** → **Logs**
4. Filter for `🔔 Cron job:` to see reminder processing logs

### What to Look For:

✅ **Good logs:**
```
🔔 Cron job: Processing pending reminders + ClickFunnels tags...
📬 Processing 5 pending reminders...
✅ Email sent successfully via Microsoft Graph API
✅ ClickFunnels tag applied successfully
✅ Reminder processing complete
```

❌ **Problem logs:**
```
❌ Cron job error: [error details]
❌ Failed to send email
❌ Failed to apply ClickFunnels tag
```

---

## Environment Variables Checklist

Make sure these are set in Railway:

```bash
# Required for cron job security
CRON_SECRET=your_random_secret

# Required for email sending
MICROSOFT_CLIENT_ID=your_client_id
MICROSOFT_CLIENT_SECRET=your_client_secret
MICROSOFT_TENANT_ID=your_tenant_id
EMAIL_ADDRESS=support@yourdomain.com

# Required for ClickFunnels tags
CLICKFUNNELS_API_KEY=your_api_key
CLICKFUNNELS_WORKSPACE_ID=your_workspace_id
CLICKFUNNELS_TAG_24HRREMINDER=tag_id
CLICKFUNNELS_TAG_2HRREMINDER=tag_id
CLICKFUNNELS_TAG_1HRREMINDER=tag_id
CLICKFUNNELS_TAG_15MINREMINDER=tag_id
CLICKFUNNELS_TAG_WESTARTED=tag_id

# Database (should already be set)
DATABASE_URL=your_railway_postgres_url
```

---

## Cron Schedule Examples

```bash
*/5 * * * *    # Every 5 minutes (recommended for reminders)
*/10 * * * *   # Every 10 minutes
*/15 * * * *   # Every 15 minutes
0 * * * *      # Every hour at minute 0
0 */2 * * *    # Every 2 hours
```

---

## Troubleshooting

### Cron job not running?

1. **Check Railway logs** for errors
2. **Verify CRON_SECRET** matches in both Railway and cron service
3. **Test endpoint manually** with curl
4. **Check Railway app URL** is correct

### Reminders not sending?

1. **Check Microsoft Graph API credentials**
2. **Verify EMAIL_ADDRESS is correct**
3. **Test email sending manually** in Railway logs
4. **Check reminder templates** are active

### ClickFunnels tags not applying?

1. **Verify CLICKFUNNELS_API_KEY** is valid
2. **Check tag IDs** with `node test-clickfunnels-tags.js`
3. **Verify contact exists** in ClickFunnels
4. **Check tag names** match exactly

---

## Quick Start (Railway + Cron-job.org)

**5-Minute Setup:**

1. **Generate secret:**
   ```bash
   openssl rand -base64 32
   ```

2. **Add to Railway:**
   - Go to Railway → Your Service → Variables
   - Add: `CRON_SECRET=your_generated_secret`

3. **Sign up at cron-job.org:**
   - https://cron-job.org/en/signup/

4. **Create cron job:**
   - URL: `https://your-app.railway.app/api/cron/process-reminders`
   - Schedule: `*/5 * * * *`
   - Method: POST
   - Header: `Authorization: Bearer your_generated_secret`

5. **Test:**
   ```bash
   curl -X POST \
     -H "Authorization: Bearer your_generated_secret" \
     https://your-app.railway.app/api/cron/process-reminders
   ```

✅ **Done!** Your reminders will now process automatically every 5 minutes.

---

## Next Steps

After setting up the cron job:

1. ✅ Create reminder templates in your dashboard
2. ✅ Register for a test webinar
3. ✅ Watch Railway logs to see reminders being scheduled
4. ✅ Wait for scheduled time and verify emails are sent
5. ✅ Check ClickFunnels for applied tags

---

## Support

If you have issues:
- Check Railway logs for detailed error messages
- Test the endpoint manually with curl
- Verify all environment variables are set correctly
- Review the logs for `🔔 Cron job:` entries
