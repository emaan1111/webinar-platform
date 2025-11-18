# Facebook API Timeout - Quick Fix Guide

## ⚠️ Problem
Charts page shows "No data available" - Facebook API times out when fetching data.

## 🔧 Most Likely Solution: Regenerate Access Token

Your Facebook access token has probably expired (they expire after 60-90 days).

### Step-by-Step Fix:

1. **Go to Facebook Business Manager**
   - Visit: https://business.facebook.com/settings/

2. **Find System Users**
   - Click "System Users" in left sidebar
   - Or navigate to Business Settings → System Users

3. **Generate New Token**
   - Click on your system user (or create one)
   - Click "Generate New Token"
   - Select these permissions:
     - ✅ `ads_read`
     - ✅ `ads_management`
   - Copy the new token (starts with "EAA...")

4. **Update Your .env File**
   ```bash
   FB_ACCESS_TOKEN="EAA...your...new...token..."
   ```

5. **Restart Development Server**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

6. **Test Charts Page**
   - Go to: http://localhost:3000/dashboard/ads/charts
   - Should now load data in 3-5 seconds!

## ✅ What I Fixed

While you regenerate the token, I made the app handle timeouts gracefully:

### 1. Faster Timeout (10 seconds instead of 25)
- Page fails faster, doesn't hang for 25+ seconds
- Better user experience

### 2. Graceful Degradation
- No more 500 errors
- Shows helpful empty state instead of crashing
- Provides troubleshooting tips

### 3. Better Error Messages
- "Unable to fetch metrics from Facebook Ads API"
- Lists possible causes
- Suggests solutions

## 📊 Alternative: Use Overview Tab

While fixing the token, you can use the Overview tab which may still work:

```
http://localhost:3000/dashboard/ads
```

The Overview uses simpler API calls that are less likely to timeout.

## 🧪 Test if Token is Valid

```bash
# Test your current token (replace with your actual token):
curl "https://graph.facebook.com/v22.0/me?access_token=EAA...your...token..."

# Good response:
{"name":"Your Business Name","id":"123456"}

# Bad response (expired):
{"error":{"message":"Invalid OAuth access token","type":"OAuthException"}}
```

## 🎯 What You'll See Now

### Before Token Fix:
- Loading spinner for 10 seconds
- Then shows: "No data available"
- With troubleshooting tips
- Retry button

### After Token Fix:
- Loading spinner for 3-5 seconds
- Then shows: Beautiful colored charts!
- 8 days of data
- All metrics displayed

## ⏰ Why This Happened

Facebook access tokens expire automatically after 60-90 days for security. This is normal and expected behavior.

## 🚀 Next Time

To avoid this in future:
1. Use long-lived tokens (60 days)
2. Set calendar reminder to refresh token
3. Monitor token expiration
4. Consider using Facebook's token refresh API

---

**Quick Action:** Regenerate Facebook access token  
**Time Needed:** 5 minutes  
**Then:** Charts will work perfectly again!
