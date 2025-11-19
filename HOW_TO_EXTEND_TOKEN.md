# How to Extend Facebook Token to Long-Lived (60 Days)

## Method 1: Using Facebook Access Token Tool (EASIEST - Recommended!)

### Step 1: Get Short-Lived Token
1. Go to **Facebook Graph API Explorer**: https://developers.facebook.com/tools/explorer/
2. Select your app from dropdown (top right)
3. Click **"Permissions"** tab
4. Add these permissions:
   - ✅ `ads_management`
   - ✅ `ads_read`
5. Click **"Generate Access Token"** button
6. Copy the token that appears (this is a SHORT-LIVED token - expires in 1-2 hours)

### Step 2: Extend to Long-Lived Token
1. Click the **info icon (ℹ️)** next to your access token in Graph API Explorer
2. A popup will appear
3. Click **"Open in Access Token Tool"**
4. You'll be taken to: https://developers.facebook.com/tools/debug/accesstoken/
5. Your token should already be loaded
6. Click the **"Extend Access Token"** button at the bottom
7. A new **LONG-LIVED TOKEN** will appear (valid for 60 days!)
8. **Copy this new token** - this is your 60-day token

### Step 3: Update Your .env File
```bash
FB_ACCESS_TOKEN="YOUR_NEW_LONG_LIVED_TOKEN_HERE"
```

### Step 4: Restart Your App
```bash
# Stop the dev server (Ctrl+C)
npm run dev
```

---

## Method 2: Using Command Line (For Advanced Users)

### Requirements
You need:
- Your short-lived access token (from Graph API Explorer)
- Your App ID (from Facebook App Dashboard)
- Your App Secret (from Facebook App Dashboard → Settings → Basic)

### Command
```bash
curl -i -X GET "https://graph.facebook.com/v22.0/oauth/access_token?\
grant_type=fb_exchange_token&\
client_id=YOUR_APP_ID&\
client_secret=YOUR_APP_SECRET&\
fb_exchange_token=YOUR_SHORT_LIVED_TOKEN"
```

**Replace:**
- `YOUR_APP_ID` - Your Facebook App ID (e.g., 123456789012345)
- `YOUR_APP_SECRET` - Your Facebook App Secret (from Settings → Basic)
- `YOUR_SHORT_LIVED_TOKEN` - The token you got from Graph API Explorer

**Example:**
```bash
curl -i -X GET "https://graph.facebook.com/v22.0/oauth/access_token?\
grant_type=fb_exchange_token&\
client_id=123456789012345&\
client_secret=abcdef1234567890abcdef1234567890&\
fb_exchange_token=EAATpflUelZBYBPwahZAWVGC2n2U6RplQJCRSfrLnTBPvKkCE4ly"
```

**Response:**
```json
{
  "access_token": "YOUR_NEW_LONG_LIVED_TOKEN_HERE",
  "token_type": "bearer",
  "expires_in": 5183944
}
```

The `expires_in` is in seconds. 5183944 seconds = ~60 days.

Copy the `access_token` value and update your .env file.

---

## Method 3: Using Graph API Explorer (Alternative)

### Step 1: Get to Access Token Tool Directly
1. Go to: https://developers.facebook.com/tools/debug/accesstoken/
2. Paste your SHORT-LIVED token (from Graph API Explorer)
3. Click **"Debug"**

### Step 2: Extend Token
1. Scroll down to the bottom
2. Click **"Extend Access Token"** button
3. Copy the new LONG-LIVED token that appears

### Step 3: Update .env
```bash
FB_ACCESS_TOKEN="YOUR_NEW_LONG_LIVED_TOKEN_HERE"
```

---

## How to Verify Your Token is Long-Lived

### Check Token Expiration
1. Go to: https://developers.facebook.com/tools/debug/accesstoken/
2. Paste your token
3. Click "Debug"
4. Look for **"Expires"** field
   - ❌ Short-lived: "Expires: in about an hour"
   - ✅ Long-lived: "Expires: in about 2 months" or shows a date 60 days away

### Using Command Line
```bash
curl -G \
  -d "input_token=YOUR_TOKEN_HERE" \
  -d "access_token=YOUR_TOKEN_HERE" \
  "https://graph.facebook.com/debug_token"
```

**Response:**
```json
{
  "data": {
    "app_id": "123456789012345",
    "type": "USER",
    "expires_at": 1740000000,  // Unix timestamp
    "is_valid": true,
    "scopes": ["ads_management", "ads_read"]
  }
}
```

Convert `expires_at` to human date:
```bash
date -r 1740000000
# Should show a date ~60 days from now
```

---

## Common Issues & Solutions

### ❌ "Extend Access Token" button is greyed out
**Solution**: Your token might already be long-lived, or you need to use Method 2 (command line)

### ❌ Error: "Error validating client secret"
**Solution**: Double-check your App Secret in Facebook App Dashboard → Settings → Basic

### ❌ Token still expires quickly
**Solution**: Make sure you're copying the EXTENDED token, not the original short-lived one

### ❌ "Invalid OAuth access token"
**Solution**: 
1. Generate a fresh token from Graph API Explorer
2. Make sure you selected the correct app
3. Make sure permissions are granted

---

## Quick Reference

### Where to Find Your App Info
1. **App ID**: Facebook App Dashboard → Dashboard (top of page)
2. **App Secret**: Facebook App Dashboard → Settings → Basic → Show (next to App Secret)

### Token Lifespans
- **Short-lived**: 1-2 hours (from Graph API Explorer)
- **Long-lived**: 60 days (after extending)
- **System User**: Never expires (Business Manager only)

### Visual Guide
```
┌─────────────────────────────────────────────────┐
│  1. Graph API Explorer                          │
│     ↓ Generate Token (short-lived: 1-2 hours)  │
├─────────────────────────────────────────────────┤
│  2. Click Info Icon (ℹ️)                        │
│     ↓ Open in Access Token Tool                │
├─────────────────────────────────────────────────┤
│  3. Access Token Tool                           │
│     ↓ Click "Extend Access Token"              │
├─────────────────────────────────────────────────┤
│  4. Copy New Token (long-lived: 60 days)       │
│     ↓ Update .env file                         │
├─────────────────────────────────────────────────┤
│  5. Restart App                                 │
│     ✅ Facebook data working!                   │
└─────────────────────────────────────────────────┘
```

---

## Test Your New Token

After updating your .env file, test it:

```bash
curl -G \
  -d "fields=spend,impressions,clicks" \
  -d "time_range={'since':'2025-11-01','until':'2025-11-19'}" \
  -d "time_increment=1" \
  -d "access_token=YOUR_NEW_TOKEN" \
  "https://graph.facebook.com/v22.0/act_280500016006811/insights"
```

**Expected**: Should return Facebook Ads data with spend, impressions, clicks

**If it works**: 
- ✅ Update your .env file
- ✅ Restart your app
- ✅ Check Reports page - Facebook data should load
- ✅ Warning banner should disappear

---

## Pro Tip: Set Calendar Reminder

Long-lived tokens expire in 60 days. Set a reminder for 50 days from now to refresh your token before it expires!

**Add to calendar**: "Refresh Facebook Access Token" - 50 days from today

---

## Summary

**Fastest Method**: 
1. Graph API Explorer → Generate Token
2. Click ℹ️ → Open in Access Token Tool  
3. Click "Extend Access Token"
4. Copy new token → Update .env → Restart

**Time**: 2 minutes  
**Result**: Token valid for 60 days instead of 1-2 hours
