# Visual Step-by-Step: Extend Facebook Token to 60 Days

## 🎯 Goal
Convert your 1-2 hour token into a 60-day long-lived token

## ⏱️ Time Required
2-3 minutes

---

## Step 1: Go to Graph API Explorer

**URL**: https://developers.facebook.com/tools/explorer/

**What you'll see:**
```
┌────────────────────────────────────────────────────┐
│  Facebook Graph API Explorer                       │
├────────────────────────────────────────────────────┤
│  [Your App ▼]                      [User or Page]  │
│                                                     │
│  GET v22.0/ me?fields=id,name        [Submit]     │
│                                                     │
│  Access Token: [EAATpflUelZBYBP...] [ℹ️]          │
│                                                     │
│  Response:                                          │
│  {...}                                             │
└────────────────────────────────────────────────────┘
```

**Action**: 
- Select YOUR app from the dropdown (top right)

---

## Step 2: Add Permissions

**Action:**
1. Click **"Permissions"** tab (below the GET field)
2. Search for and check these boxes:
   - ☑️ `ads_management`
   - ☑️ `ads_read`

**What you'll see:**
```
┌────────────────────────────────────────────────────┐
│  Permissions                                        │
├────────────────────────────────────────────────────┤
│  Search permissions...              [Add ▼]        │
│                                                     │
│  ☑️ ads_management                                 │
│  ☑️ ads_read                                       │
│  ☐ public_profile                                  │
│  ☐ email                                           │
│  ...                                               │
└────────────────────────────────────────────────────┘
```

---

## Step 3: Generate Short-Lived Token

**Action:**
- Click **"Generate Access Token"** button

**What happens:**
1. A popup will ask you to log in (if not already)
2. Facebook will ask: "Allow [Your App] to access your ads?"
3. Click **"Continue"** or **"OK"**

**Result:**
```
Access Token: [EAATpflUelZBYBPwahZAWVGC2n2U6Rpl...] [ℹ️]
                                                      ↑
                                              Click this!
```

A new token appears in the "Access Token" field. This is SHORT-LIVED (expires in 1-2 hours).

---

## Step 4: Click the Info Icon ℹ️

**Action:**
- Click the **ℹ️ icon** (information icon) next to your access token

**What you'll see:**
```
┌──────────────────────────────────────┐
│  Access Token Info                   │
├──────────────────────────────────────┤
│  App ID: 123456789012345             │
│  Type: User                          │
│  Expires: in about an hour           │  ← Short-lived!
│  Valid: Yes                          │
│  Scopes: ads_management, ads_read    │
│                                      │
│  [Open in Access Token Tool]  [OK]  │  ← Click this!
└──────────────────────────────────────┘
```

**Action:**
- Click **"Open in Access Token Tool"** button

---

## Step 5: Access Token Debugger

**What you'll see:**
```
┌────────────────────────────────────────────────────┐
│  Access Token Debugger                             │
├────────────────────────────────────────────────────┤
│  Access Token:                                      │
│  [EAATpflUelZBYBPwahZAWVGC2n2U6Rpl...]  [Debug]   │
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │  Metadata                                     │ │
│  │  App ID: 123456789012345                     │ │
│  │  Type: USER                                  │ │
│  │  Issued: 11/19/2025 10:00 AM                │ │
│  │  Expires: 11/19/2025 12:00 PM   ← 2 hours!  │ │
│  │  Valid: Yes                                  │ │
│  │  User: Your Name (ID: 123...)               │ │
│  │                                              │ │
│  │  Scopes:                                     │ │
│  │  • ads_management                           │ │
│  │  • ads_read                                 │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  [Extend Access Token]  ← CLICK THIS!              │
└────────────────────────────────────────────────────┘
```

**Important**: You can also go directly here:
- URL: https://developers.facebook.com/tools/debug/accesstoken/
- Paste your token
- Click "Debug"

---

## Step 6: Extend the Token

**Action:**
- Scroll down to the bottom
- Click **"Extend Access Token"** button

**What happens:**
1. A new section appears below
2. Shows: "Extended Access Token"
3. A NEW, LONGER token appears

**What you'll see:**
```
┌────────────────────────────────────────────────────┐
│  Extended Access Token                             │
├────────────────────────────────────────────────────┤
│  Access Token:                                      │
│  [EAATpflUelZBYBO7wkWVGC9n8U7RqmKDERTfr...]       │
│  ↑                                                  │
│  This is your NEW 60-day token!                    │
│                                                     │
│  Metadata:                                          │
│  Expires: 01/18/2026 10:00 AM  ← 60 days!         │
│  Valid: Yes                                        │
└────────────────────────────────────────────────────┘
```

**Action:**
- **Copy this NEW token** (the entire string)
- This is your LONG-LIVED token (valid for 60 days)

---

## Step 7: Update Your .env File

**Open your .env file** in your project:
```
/Volumes/WD/CODE/Webinar Play 2/.env
```

**Find this line:**
```bash
FB_ACCESS_TOKEN="EAATpflUelZBYBPwahZAWVGC2n2U6RplQJCRSfrLnTBPvKkCE4lyB8xaxVKEXkwmZBE990hxKHAdwDYzLn1mW55Dh5sFWWVLFm09UydVfuIzUdnCIgOwYEuzCnp0W6jlPryJwdBT0XnritVncL80tFHWk4VQAN4dJkudbcZCwst5hRwZB53iLmv94pfQcLy4ZAeeNTLhRia"
```

**Replace with your NEW token:**
```bash
FB_ACCESS_TOKEN="YOUR_NEW_LONG_LIVED_TOKEN_HERE"
```

**Save the file** (Cmd+S or Ctrl+S)

---

## Step 8: Restart Your Application

**Terminal:**
```bash
# Stop the dev server
# Press Ctrl+C

# Start it again
npm run dev
```

**Wait for:**
```
✓ Ready in 2.3s
- Local: http://localhost:3000
```

---

## Step 9: Verify It Works

### Option A: Check the Reports Page
1. Open your browser
2. Go to: http://localhost:3000/dashboard/reports
3. Select a date range (e.g., Last 30 Days)

**Expected:**
- ✅ Facebook Ads data loads (spend, impressions, clicks)
- ✅ No yellow warning banner
- ✅ Console shows: "✅ Facebook returned X days of data"

### Option B: Check Console Logs
Look at your terminal for:
```
✅ Facebook returned 23 historical days
✅ Facebook returned 8 recent days
  - 2025-11-12: $214.12
  - 2025-11-13: $205.44
  - 2025-11-14: $207.31
  ...
```

### Option C: Test with curl
```bash
curl -G \
  -d "fields=spend" \
  -d "time_range={'since':'2025-11-01','until':'2025-11-19'}" \
  -d "access_token=YOUR_NEW_TOKEN" \
  "https://graph.facebook.com/v22.0/act_280500016006811/insights"
```

**Expected response:**
```json
{
  "data": [
    {
      "spend": "123.45",
      "date_start": "2025-11-01",
      "date_stop": "2025-11-01"
    },
    ...
  ]
}
```

---

## 🎉 Done!

Your token is now valid for **60 days** instead of 1-2 hours!

### What Changed:
- ❌ Before: Token expires in 1-2 hours
- ✅ After: Token expires in 60 days

### Set a Reminder:
Add to your calendar: **"Refresh Facebook Token"** - 50 days from today

---

## Quick Troubleshooting

### ❌ "Extend Access Token" button is disabled/greyed out
**Reason**: Your token might already be long-lived  
**Solution**: Check the expiration date. If it says "in about 2 months", you're good!

### ❌ Still seeing permission error
**Solution**: 
1. Make sure you copied the EXTENDED token (the new one at the bottom)
2. Make sure you saved the .env file
3. Make sure you restarted the dev server
4. Check for typos in the token

### ❌ Token not working at all
**Solution**:
1. Go back to Step 1
2. Generate a completely NEW token
3. Make sure to select `ads_management` and `ads_read` permissions
4. Extend it
5. Update .env with the extended token

---

## Visual Summary

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  1️⃣  Graph API Explorer                            │
│      ↓                                              │
│  2️⃣  Add Permissions (ads_management, ads_read)    │
│      ↓                                              │
│  3️⃣  Generate Access Token                         │
│      ↓                                              │
│  4️⃣  Click ℹ️ Icon                                  │
│      ↓                                              │
│  5️⃣  Open in Access Token Tool                     │
│      ↓                                              │
│  6️⃣  Click "Extend Access Token"                   │
│      ↓                                              │
│  7️⃣  Copy NEW long-lived token                     │
│      ↓                                              │
│  8️⃣  Update .env file                              │
│      ↓                                              │
│  9️⃣  Restart app (Ctrl+C, npm run dev)             │
│      ↓                                              │
│  ✅  Check Reports page - should work!              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

**Total Time**: 2-3 minutes  
**Result**: Facebook data working for 60 days! 🎊
