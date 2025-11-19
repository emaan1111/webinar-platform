# Facebook Access Token Refresh Guide

## Issue
Error: "Ad account owner has NOT grant ads_management or ads_read permission"

This means the Facebook access token has expired or doesn't have the required permissions.

## Why This Happens
Facebook access tokens expire after a period of time (usually 60-90 days for long-lived tokens, or 1-2 hours for short-lived tokens).

## How to Get a New Token

### Option 1: Using Facebook Graph API Explorer (Recommended)

1. **Go to Facebook Graph API Explorer**
   - Visit: https://developers.facebook.com/tools/explorer/

2. **Select Your App**
   - In the top right, select your Facebook App from the dropdown
   - If you don't have an app, create one at https://developers.facebook.com/apps/

3. **Request Required Permissions**
   - Click on "Permissions" tab or "Get Token" dropdown
   - Add these permissions:
     - `ads_management` (required for reading ad insights)
     - `ads_read` (required for reading ad data)
   - Click "Generate Access Token"
   - You may need to log in and authorize these permissions

4. **Get the Token**
   - Copy the access token that appears in the "Access Token" field
   - This is a short-lived token (expires in 1-2 hours)

5. **Convert to Long-Lived Token (Important!)**
   
   **Method A: Using Graph API Explorer**
   - In Graph API Explorer, click the info icon (ℹ️) next to the access token
   - Click "Open in Access Token Tool"
   - Click "Extend Access Token"
   - Copy the new long-lived token (valid for 60 days)

   **Method B: Using curl**
   ```bash
   curl -i -X GET "https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=SHORT_LIVED_TOKEN"
   ```
   
   Replace:
   - `YOUR_APP_ID` - Your Facebook App ID
   - `YOUR_APP_SECRET` - Your Facebook App Secret
   - `SHORT_LIVED_TOKEN` - The token from step 4

6. **Update Your .env File**
   ```bash
   FB_ACCESS_TOKEN="YOUR_NEW_LONG_LIVED_TOKEN"
   ```

7. **Restart Your Application**
   - Stop the dev server (Ctrl+C)
   - Run `npm run dev` again
   - Or if deployed, redeploy with the new environment variable

### Option 2: Using Facebook Business Manager

1. **Go to Business Settings**
   - Visit: https://business.facebook.com/settings/

2. **Navigate to Ad Accounts**
   - Click "Accounts" → "Ad Accounts"
   - Select your ad account

3. **Generate System User Token**
   - Go to "System Users" in Business Settings
   - Create or select a system user
   - Click "Generate New Token"
   - Select your ad account and the required permissions:
     - `ads_management`
     - `ads_read`
   - Copy the token (this doesn't expire unless revoked)

4. **Update Your .env File**
   ```bash
   FB_ACCESS_TOKEN="YOUR_SYSTEM_USER_TOKEN"
   ```

## Verifying Your New Token

### Test the Token
Run this in your terminal to verify the token works:

```bash
curl -G \
  -d "fields=spend,impressions,clicks" \
  -d "time_range={'since':'2025-11-01','until':'2025-11-19'}" \
  -d "time_increment=1" \
  -d "access_token=YOUR_TOKEN_HERE" \
  "https://graph.facebook.com/v22.0/act_280500016006811/insights"
```

Replace `YOUR_TOKEN_HERE` with your new token.

**Expected Response:**
```json
{
  "data": [
    {
      "spend": "123.45",
      "impressions": "1000",
      "clicks": "50",
      "date_start": "2025-11-01",
      "date_stop": "2025-11-01"
    },
    ...
  ]
}
```

**Error Response (Token Invalid):**
```json
{
  "error": {
    "message": "Error validating access token...",
    "type": "OAuthException",
    "code": 190
  }
}
```

### Check Token Info
```bash
curl -G \
  -d "input_token=YOUR_TOKEN_HERE" \
  -d "access_token=YOUR_TOKEN_HERE" \
  "https://graph.facebook.com/debug_token"
```

This will show:
- Token expiration date
- Scopes/permissions
- App ID
- User ID

## Required Permissions

Your token MUST have these permissions:
- ✅ `ads_management` - Allows reading ad insights
- ✅ `ads_read` - Allows reading ad data

Optional but recommended:
- `read_insights` - For more detailed insights
- `business_management` - If using Business Manager

## Troubleshooting

### Error: "Permissions error" or "OAuth error"
- Your token expired or was revoked
- Follow the steps above to get a new token
- Make sure you selected `ads_management` and `ads_read` permissions

### Error: "Invalid OAuth access token"
- Token format is incorrect
- Make sure you copied the entire token (no spaces or line breaks)
- Check that the token is for the correct app

### Error: "Ad account does not exist"
- Check your `FB_AD_ACCOUNT_ID` in `.env`
- Make sure it starts with `act_`
- Verify you have access to this ad account

### Error: "Application request limit reached"
- Facebook has rate limits
- Wait a few minutes and try again
- Consider caching results if making many requests

## Best Practices

### 1. Use Long-Lived Tokens
- Short-lived tokens expire in 1-2 hours
- Long-lived tokens last 60 days
- System user tokens don't expire (recommended for production)

### 2. Monitor Token Expiration
Set up a cron job or scheduled task to check token validity:

```typescript
// Example: Check token validity
const checkFBToken = async () => {
  const token = process.env.FB_ACCESS_TOKEN;
  const response = await fetch(
    `https://graph.facebook.com/debug_token?input_token=${token}&access_token=${token}`
  );
  const data = await response.json();
  
  if (data.data.expires_at) {
    const expiresAt = new Date(data.data.expires_at * 1000);
    const daysUntilExpiry = (expiresAt - Date.now()) / (1000 * 60 * 60 * 24);
    
    if (daysUntilExpiry < 7) {
      console.warn('⚠️  Facebook token expires in', Math.floor(daysUntilExpiry), 'days');
      // Send alert to admin
    }
  }
};
```

### 3. Implement Graceful Degradation
The app currently continues working even if Facebook data fails:
- Shows $0 for ad spend
- Rest of the reports still work
- Error is logged to console

### 4. Use System User Tokens in Production
For production environments:
- Create a System User in Business Manager
- Generate a token that doesn't expire
- Use this instead of personal user tokens

## Quick Fix Checklist

- [ ] Go to https://developers.facebook.com/tools/explorer/
- [ ] Select your app
- [ ] Add `ads_management` and `ads_read` permissions
- [ ] Generate access token
- [ ] Extend to long-lived token (60 days)
- [ ] Copy the long-lived token
- [ ] Update `FB_ACCESS_TOKEN` in `.env` file
- [ ] Restart dev server or redeploy
- [ ] Test the reports page (should show Facebook data)

## Environment Variables

Your `.env` file should have:

```bash
# Facebook Ads Integration
FB_ACCESS_TOKEN="YOUR_LONG_LIVED_TOKEN_HERE"
FB_AD_ACCOUNT_ID="act_280500016006811"
```

## Alternative: Disable Facebook Integration

If you don't need Facebook Ads data right now, the app will work without it:

1. **Remove or comment out the token:**
   ```bash
   # FB_ACCESS_TOKEN=""
   ```

2. **Reports will show:**
   - $0.00 for Ad Spend
   - 0 for impressions/clicks
   - All webinar metrics still work normally

## Support Links

- **Facebook Graph API Explorer**: https://developers.facebook.com/tools/explorer/
- **Access Token Debugger**: https://developers.facebook.com/tools/debug/accesstoken/
- **Marketing API Permissions**: https://developers.facebook.com/docs/marketing-api/get-started/authorization/
- **System Users Guide**: https://developers.facebook.com/docs/marketing-api/system-users/

---

**Current Status**: Token expired or lacks permissions  
**Quick Fix**: Get new token from Graph API Explorer (5 minutes)  
**Long-term Fix**: Set up System User token (10 minutes)
