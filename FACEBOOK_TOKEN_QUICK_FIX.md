# Facebook Token Error - Quick Fix ⚡

## The Error You're Seeing
```
Ad account owner has NOT grant ads_management or ads_read permission
```

## Why It Happened
Facebook access tokens expire after 60-90 days. Your token expired and needs to be refreshed.

## Quick Fix (5 minutes)

### Step 1: Get New Token
1. Go to: https://developers.facebook.com/tools/explorer/
2. Select your app from the dropdown (top right)
3. Click "Permissions" tab
4. Add these permissions:
   - ✅ `ads_management`
   - ✅ `ads_read`
5. Click "Generate Access Token"
6. Click the info icon (ℹ️) next to the token
7. Click "Open in Access Token Tool"
8. Click "Extend Access Token" (makes it last 60 days)
9. Copy the new long-lived token

### Step 2: Update .env File
Open your `.env` file and update:
```bash
FB_ACCESS_TOKEN="PASTE_YOUR_NEW_TOKEN_HERE"
```

### Step 3: Restart
- **Local Development**: Stop server (Ctrl+C), run `npm run dev`
- **Production**: Redeploy or restart your server

### Step 4: Verify
- Go to Reports page
- You should see Facebook Ads data now
- Warning banner should disappear

## What Happens If You Don't Fix It?
The app still works! You'll just see:
- ✅ All webinar metrics (registrations, attendees, sales, etc.)
- ❌ Facebook Ads data shows $0 (no spend, impressions, clicks)
- ⚠️ Yellow warning banner explaining the issue

## Need More Help?
See `FACEBOOK_TOKEN_REFRESH_GUIDE.md` for:
- Detailed step-by-step instructions with screenshots
- How to test your token
- How to get a token that never expires (System User)
- Troubleshooting common issues

## Quick Test
Test if your new token works:
```bash
curl -G \
  -d "fields=spend" \
  -d "time_range={'since':'2025-11-01','until':'2025-11-19'}" \
  -d "access_token=YOUR_NEW_TOKEN" \
  "https://graph.facebook.com/v22.0/act_280500016006811/insights"
```

If it returns data with `"spend": "123.45"`, your token works! 🎉

---

**Time to Fix**: 5 minutes  
**Difficulty**: Easy  
**Impact**: Restores Facebook Ads data in reports
