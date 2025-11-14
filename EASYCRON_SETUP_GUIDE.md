# EasyCron Setup Guide for ClickFunnels Reminder Tagging

## 🎯 What This Does
Automatically tags contacts in ClickFunnels based on webinar reminder timings (24HR, 2HR, 1HR, 15MIN, WESTARTED).

## 📋 Prerequisites
- ✅ Railway app deployed: `https://webinar-platform-production.up.railway.app`
- ✅ CRON_SECRET set in Railway: `F1viPR8MgoVQzDVnK/vy1bqeH35qQB/xFa0azaiiHEI=`
- ✅ All ClickFunnels environment variables configured

---

## 🚀 Step-by-Step Setup

### Step 1: Create EasyCron Account
1. Go to **https://www.easycron.com/**
2. Click **"Sign Up Free"**
3. Create account with your email (no credit card required for free tier)
4. Verify your email address

### Step 2: Add New Cron Job
1. After logging in, click **"+ Cron Job"** or **"Add Cron Job"**
2. Fill in the following details:

---

## ⚙️ Cron Job Configuration

### Basic Settings:

**Cron Job Name:**
```
Webinar ClickFunnels Reminder Tags
```

**URL:**
```
https://webinar-platform-production.up.railway.app/api/cron/process-reminders
```

**Request Method:**
```
POST
```

**Cron Expression:**
```
*/10 * * * *
```
This means: Run every 10 minutes

**Time Zone:**
```
Select your timezone (e.g., America/New_York, Europe/London, etc.)
```

---

### Advanced Settings:

#### HTTP Headers:
Click **"Add HTTP Header"** and add these TWO headers:

**Header 1:**
- Name: `Authorization`
- Value: `Bearer F1viPR8MgoVQzDVnK/vy1bqeH35qQB/xFa0azaiiHEI=`

**Header 2:**
- Name: `Content-Type`
- Value: `application/json`

#### Other Settings:
- **Timeout**: 30 seconds (default is fine)
- **Retry on failure**: Enable (optional)
- **Send notification on failure**: Enable (optional - enter your email)

---

### Step 3: Test the Cron Job

1. Before enabling, click **"Test"** button
2. You should see a response like:
```json
{
  "success": true,
  "processed": 0,
  "sent": 0,
  "tagged": 0,
  "errors": []
}
```
3. If you see `"success": true`, you're good to go!

### Step 4: Enable the Cron Job

1. Click **"Save"** or **"Create"**
2. Toggle the job to **"Enabled"**
3. The cron job will now run every 10 minutes automatically

---

## 🧪 Testing Manually (Optional)

You can test the endpoint manually from your terminal:

```bash
curl -X POST https://webinar-platform-production.up.railway.app/api/cron/process-reminders \
  -H "Authorization: Bearer F1viPR8MgoVQzDVnK/vy1bqeH35qQB/xFa0azaiiHEI=" \
  -H "Content-Type: application/json"
```

Expected response when there are no pending reminders:
```json
{
  "success": true,
  "processed": 0,
  "sent": 0,
  "tagged": 0,
  "errors": []
}
```

---

## 📊 Monitoring

### Check Cron Job History:
1. Go to EasyCron dashboard
2. Click on your cron job name
3. View execution history with:
   - Execution times
   - Response codes
   - Response body
   - Any errors

### Check Railway Logs:
1. Go to Railway dashboard
2. Click on your service
3. Go to "Deployments" → "Logs"
4. Filter by "process-reminders" to see cron execution logs

---

## 🏷️ How Tags Are Applied

The cron job checks for registrations and applies tags based on timing:

| Tag Name | When Applied | ClickFunnels Tag ID |
|----------|-------------|---------------------|
| **24HRREMINDER** | 24 hours before webinar | 372416 |
| **2HRREMINDER** | 2 hours before webinar | 372417 |
| **1HRREMINDER** | 1 hour before webinar | 372418 |
| **15MINREMINDER** | 15 minutes before webinar | 372436 |
| **WESTARTED** | When webinar starts | 372437 |

### Additional Tags (Applied on Registration):
| Tag Name | When Applied | ClickFunnels Tag ID |
|----------|-------------|---------------------|
| **REGISTERED** | On registration | 368586 |
| **ATTENDED** | After attending 80%+ | 368587 |
| **MOSTLY_ATTENDED** | After attending 60-79% | 368588 |
| **PARTLY_ATTENDED** | After attending 30-59% | 368589 |
| **MISSED** | Attended < 30% | 368590 |
| **REPLAY_ATTENDED** | Watched replay | 368591 |

---

## 🔧 Troubleshooting

### Problem: Getting 401 Unauthorized
**Solution:** Check that the Authorization header includes "Bearer " before the token

### Problem: Getting timeout errors
**Solution:** Increase timeout to 60 seconds in EasyCron settings

### Problem: Tags not appearing in ClickFunnels
**Solution:** 
1. Check Railway logs for errors
2. Verify ClickFunnels API key is valid
3. Verify tag IDs match your ClickFunnels tags
4. Check if contact exists in ClickFunnels

### Problem: Too many executions
**Solution:** Adjust cron expression:
- Every 15 minutes: `*/15 * * * *`
- Every 30 minutes: `*/30 * * * *`
- Every hour: `0 * * * *`

---

## 💰 Free Tier Limits

EasyCron Free Plan includes:
- ✅ Unlimited cron jobs
- ✅ 1-minute execution interval minimum
- ✅ HTTP/HTTPS support
- ✅ Email notifications
- ✅ Execution history

**No credit card required!**

---

## ✅ Verification Checklist

- [ ] EasyCron account created
- [ ] Cron job added with correct URL
- [ ] Authorization header configured with Bearer token
- [ ] Content-Type header set to application/json
- [ ] Cron expression set to `*/10 * * * *`
- [ ] Test executed successfully
- [ ] Cron job enabled
- [ ] First execution completed successfully
- [ ] Railway logs show cron execution
- [ ] Tags appearing in ClickFunnels (when applicable)

---

## 📚 Additional Resources

- **EasyCron Documentation**: https://www.easycron.com/document
- **Railway Documentation**: https://docs.railway.app
- **ClickFunnels API**: https://developers.myclickfunnels.com/

---

## 🆘 Need Help?

If you encounter issues:
1. Check Railway logs first
2. Check EasyCron execution history
3. Test the endpoint manually with curl
4. Verify all environment variables are set correctly in Railway

---

**Last Updated:** November 14, 2025
**Railway URL:** https://webinar-platform-production.up.railway.app
**Cron Endpoint:** /api/cron/process-reminders
