# Facebook Conversions API Integration

## Overview
Your webinar platform now sends every registration to Facebook's Conversions API for accurate tracking and conversion optimization. This is a **server-side** integration that's more reliable than browser-based pixels.

## ✅ What's Been Implemented

### 1. Facebook SDK Installed
- Package: `facebook-nodejs-business-sdk`
- Purpose: Send server-side events to Facebook

### 2. Facebook Utility Library
**File**: `src/lib/facebook.ts`

Features:
- ✅ Automatic PII hashing (email, phone, name) for privacy compliance
- ✅ Extracts Facebook cookies (_fbc, _fbp) for better attribution
- ✅ Sends IP address and user agent for improved matching
- ✅ Support for test events (for development/testing)
- ✅ Custom event support for future tracking needs

### 3. Registration Endpoint Integration
**File**: `src/app/api/webinars/[id]/register/route.ts`

Every registration now automatically:
- ✅ Sends a `CompleteRegistration` event to Facebook
- ✅ Includes user data (email, name, phone) - hashed for privacy
- ✅ Includes webinar information (ID, title, registration ID)
- ✅ Captures IP address, user agent, and Facebook cookies
- ✅ Non-blocking (won't fail registration if Facebook API is down)

### 4. Environment Variables
**File**: `.env`

Added configuration:
```env
FB_PIXEL_ID="your-facebook-pixel-id"
FB_ACCESS_TOKEN="your-facebook-access-token"
FB_TEST_EVENT_CODE="" # Optional: For testing
```

## 🔧 Setup Instructions

### Step 1: Get Your Facebook Pixel ID
1. Go to [Facebook Events Manager](https://business.facebook.com/events_manager2)
2. Select your pixel (or create a new one)
3. Copy your **Pixel ID** (it's a number like `123456789012345`)

### Step 2: Generate Conversions API Access Token
1. In Events Manager, select your pixel
2. Click **Settings** in the left sidebar
3. Scroll down to **Conversions API**
4. Click **Generate Access Token**
5. Copy the token (starts with `EAA...`)

### Step 3: Update Your .env File
Replace the placeholder values in `.env`:
```env
FB_PIXEL_ID="YOUR_ACTUAL_PIXEL_ID"
FB_ACCESS_TOKEN="YOUR_ACTUAL_ACCESS_TOKEN"
```

### Step 4: (Optional) Set Up Test Events
For testing/development:
1. In Events Manager > Settings > Conversions API
2. Find **Test Events** section
3. Copy the test event code
4. Add to `.env`:
```env
FB_TEST_EVENT_CODE="TEST12345"
```

When this is set, events will appear in the "Test Events" tab instead of live data.

### Step 5: Restart Your Server
```bash
npm run dev
```

## 📊 What Gets Tracked

### Event Name
`CompleteRegistration` - Facebook's standard event for completed registrations

### User Data (Hashed)
- Email address
- First name
- Last name
- Phone number
- IP address
- User agent (browser)
- Facebook click ID (_fbc cookie)
- Facebook browser ID (_fbp cookie)

### Custom Data
- Webinar ID
- Webinar title
- Registration ID
- Currency: USD
- Value: 0 (you can customize this)

## 🧪 Testing

### 1. Test Event Code Method (Recommended)
Set `FB_TEST_EVENT_CODE` in your `.env` file, then:
1. Make a test registration on your site
2. Go to Events Manager > Test Events tab
3. You should see your test event appear within a few seconds

### 2. Live Events Method
Without test event code:
1. Make a registration
2. Go to Events Manager > Test Events
3. Wait 20 minutes for data to process
4. Check "Overview" tab for the `CompleteRegistration` event

### 3. Check Logs
Look for these console messages:
```
✅ Facebook Conversions API event sent successfully
   Event ID: evt_xxx
   Events received: 1
   FBTRACE ID: xxx
```

Or if not configured:
```
⚠️ Facebook Conversions API not configured. Skipping event.
```

## 🔍 Verification

### In Facebook Events Manager:
1. Go to **Overview** tab
2. Look for **Conversions API** section
3. You should see events coming through
4. Event name: `CompleteRegistration`

### Event Quality Score:
- Check "Event Match Quality" in Events Manager
- Higher score = better tracking
- Our implementation includes:
  - Email (hashed) ✅
  - Phone (hashed) ✅
  - First/Last name (hashed) ✅
  - IP address ✅
  - User agent ✅
  - Facebook cookies (_fbc, _fbp) ✅

## 🎯 Benefits

### 1. Better Ad Performance
- Facebook can optimize ads for registrations
- More accurate attribution
- Better audience targeting

### 2. iOS 14.5+ Tracking
- Works despite App Tracking Transparency restrictions
- Server-side = not affected by browser blockers

### 3. Improved Match Rates
- Multiple data points improve user matching
- Hashed PII for privacy compliance

### 4. Custom Audiences
- Create audiences of registrants
- Build lookalike audiences
- Retargeting capabilities

## 🚀 Advanced Features

### Send Custom Events
You can track other events like attendance, purchases, etc.:

```typescript
import { sendFacebookCustomEvent } from '@/lib/facebook'

// Example: Track webinar attendance
await sendFacebookCustomEvent('WebinarAttended', {
  email: 'user@example.com',
  name: 'John Doe',
  webinarId: 'webinar-123',
  webinarTitle: 'Amazing Webinar',
  value: 0,
  currency: 'USD'
})
```

### Add Conversion Value
Track the value of registrations:

```typescript
// In register route.ts, update the value:
sendFacebookRegistration({
  // ... existing fields
  value: 47, // e.g., average customer value
  currency: 'USD'
})
```

## 📝 Data Privacy & GDPR

### Automatic PII Hashing
All personal data is hashed using SHA-256 before sending:
- Emails are lowercased and trimmed before hashing
- Phone numbers are normalized (remove spaces, dashes)
- Names are split and hashed separately

### What Facebook Receives
- ✅ Hashed email: `5d41402abc4b...`
- ✅ Hashed phone: `e3b0c44298fc...`
- ❌ NOT raw email or phone

### GDPR Compliance
- Hashing provides pseudonymization
- Users who don't consent won't have data sent (implement consent check if needed)
- Facebook acts as a data processor

## 🐛 Troubleshooting

### No Events Showing Up
1. **Check configuration**: Verify `FB_PIXEL_ID` and `FB_ACCESS_TOKEN` are set
2. **Check logs**: Look for error messages in console
3. **Verify access token**: Make sure it hasn't expired
4. **Check pixel status**: Ensure pixel is active in Events Manager

### Error: Invalid Access Token
- Access token may have expired
- Regenerate in Events Manager > Settings > Conversions API

### Low Event Match Quality
- Make sure Facebook cookies are being captured
- Verify IP address is being sent correctly
- Check that user data is complete (email, name, phone)

### Events Not Attributed to Ads
- Ensure `_fbc` cookie is present (from Facebook ad clicks)
- Cookie must be passed within 7 days of click
- User must click ad and register on same browser

## 📚 Resources

- [Facebook Conversions API Documentation](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [Events Manager](https://business.facebook.com/events_manager2)
- [Test Events](https://developers.facebook.com/docs/marketing-api/conversions-api/using-the-api#test-events)
- [Data Processing Options](https://developers.facebook.com/docs/marketing-apis/data-processing-options)

## 🔐 Security Notes

1. **Never commit real tokens**: The `.env` file is gitignored
2. **Rotate tokens regularly**: Generate new access tokens periodically
3. **Monitor usage**: Check Events Manager for unusual activity
4. **Use test events**: Always test with test event code first

## ✨ Next Steps

### Optional Enhancements:
1. **Add client-side pixel**: Complement server events with browser tracking
2. **Track more events**: Add attendance, replay views, purchases
3. **Set up deduplication**: Use event IDs to prevent duplicate events
4. **Custom conversions**: Create custom conversions in Events Manager
5. **Audience building**: Create custom audiences from registrants

### Recommended:
- Monitor event quality score weekly
- Set up Facebook ad campaigns optimized for `CompleteRegistration`
- Create lookalike audiences from registrants
- Build retargeting campaigns for non-converters

---

## Status: ✅ READY TO USE

Facebook Conversions API integration is complete and ready for production use. Just add your credentials to `.env` and restart the server!
