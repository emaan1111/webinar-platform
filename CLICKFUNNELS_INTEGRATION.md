# ClickFunnels 2.0 Integration - Complete Guide

## 🎯 Overview

**Bi-directional integration** between your webinar platform and ClickFunnels 2.0:

1. **Incoming**: Receive webhooks from ClickFunnels → Auto-register users for webinars
2. **Outgoing**: Send registrations to ClickFunnels → Tag contacts as `UM-Webinar-Registered`

## ✅ What's Included

### Incoming Webhooks (ClickFunnels → Your Platform)
- **Webhook Endpoint**: Receives ClickFunnels events
- **Auto Registration**: Automatically creates webinar registrations
- **Contact Sync**: Syncs contact info (name, email, phone)
- **Analytics Tracking**: Tracks registrations in your analytics
- **Error Handling**: Graceful handling of edge cases
- **Duplicate Prevention**: Checks for existing registrations

### Outgoing API (Your Platform → ClickFunnels)
- **Contact Sync**: Sends registrant data to ClickFunnels
- **Auto Tagging**: Tags contacts with `UM-Webinar-Registered`
- **Custom Fields**: Includes webinar details (ID, title, start time)
- **Update Existing**: Updates existing contacts without duplicating
- **Non-Blocking**: Async operation doesn't delay registration
- **Error Resilient**: Failed syncs don't block user registration

## 🚀 Quick Setup

### Prerequisites

You need:
1. ClickFunnels 2.0 account (not Classic)
2. API access enabled in your ClickFunnels account
3. Your webinar platform deployed (or using ngrok for local testing)

### Step 1: Get ClickFunnels API Credentials

1. **Log into ClickFunnels 2.0**
2. Go to **Settings** → **API**
3. Click **Create New API Key**
4. Copy your:
   - **API Key** (starts with `pk_` or `sk_`)
   - **Workspace ID** (find in Settings → General)

### Step 2: Configure Environment Variables

Add to your `.env` file:

```bash
# ClickFunnels 2.0 API Configuration
CLICKFUNNELS_API_KEY=your_api_key_here
CLICKFUNNELS_WORKSPACE_ID=your_workspace_id_here
CLICKFUNNELS_WEBINAR_TAG=UM-Webinar-Registered
# Optional: provide the numeric ID if you already have the tag in ClickFunnels
# CLICKFUNNELS_WEBINAR_TAG_ID=368586
# Optional attendance tag IDs (defaults auto-create by name)
# CLICKFUNNELS_TAG_ATTENDED=368587
# CLICKFUNNELS_TAG_MOSTLY_ATTENDED=368588
# CLICKFUNNELS_TAG_PARTLY_ATTENDED=368589
# CLICKFUNNELS_TAG_MISSED=368590
# CLICKFUNNELS_TAG_REPLAY_ATTENDED=368591
```

**Example:**
```bash
CLICKFUNNELS_API_KEY=pk_1234567890abcdef
CLICKFUNNELS_WORKSPACE_ID=ws_0987654321fedcba
CLICKFUNNELS_WEBINAR_TAG=UM-Webinar-Registered
# CLICKFUNNELS_WEBINAR_TAG_ID=368586
# CLICKFUNNELS_TAG_ATTENDED=368587
# CLICKFUNNELS_TAG_MOSTLY_ATTENDED=368588
# CLICKFUNNELS_TAG_PARTLY_ATTENDED=368589
# CLICKFUNNELS_TAG_MISSED=368590
# CLICKFUNNELS_TAG_REPLAY_ATTENDED=368591
```

If the tag does not already exist, the integration will attempt to create it automatically.

### Step 3: Setup Incoming Webhooks (ClickFunnels → Your Platform)

Your webhook endpoint is:
```
https://yourdomain.com/api/integrations/clickfunnels/webhook
```

Replace `yourdomain.com` with your actual domain.

### Step 4: Configure ClickFunnels Webhook

1. **Log into ClickFunnels 2.0**
2. Go to **Settings** → **Webhooks**
3. Click **Add New Webhook**
4. Configure:
   - **Webhook URL**: `https://yourdomain.com/api/integrations/clickfunnels/webhook`
   - **Event Types**: Select these events:
     - ✅ `contact.created`
     - ✅ `contact.updated`
     - ✅ `order.created` *(required for purchase tracking)*
   - **Status**: Active

### Step 5: Add Custom Fields to Your Funnel Forms

In your ClickFunnels form, add these hidden fields or custom fields:

#### Required Fields
```javascript
// Option 1: Use Webinar ID
webinar_id: "your-webinar-id-here"

// Option 2: Use Webinar Slug (easier)
webinar_slug: "your-webinar-slug"
```

#### Optional Fields
```javascript
schedule_id: "specific-schedule-id"  // Leave empty for auto-selection
marketing_consent: "true"  // If user opts in to marketing
```

### Step 6: Test the Integration

1. Submit a test form in ClickFunnels
2. Check your webinar dashboard
3. Verify the registration was created
4. Check the webhook logs in ClickFunnels

---

## 💰 Track Purchases From ClickFunnels Order Forms

When you enable the `order.created` webhook event, every purchase from your ClickFunnels order forms is captured automatically.

1. **Send the same webhook fields** you use for registrations (`webinar_id` or `webinar_slug`).  
2. **Our webhook** matches the order to the registrant by email and webinar.  
3. **Sales are stored** in the `webinar_sales` table and linked to the registration when possible.  
4. **Attendees Dashboard** now includes `Purchased`, `Purchase Count`, `Last Purchase`, and `Revenue` columns so you can sort/filter/export buyers instantly.

If the email doesn't match an existing registration, the sale is still recorded so you can reconcile it later.

---

## � Outgoing API Integration (Your Platform → ClickFunnels)

### How It Works

**Automatic Contact Syncing:**

When someone registers for a webinar on YOUR platform (not through ClickFunnels), their contact information is automatically sent to ClickFunnels and tagged.

```
User registers on your site
         ↓
Registration saved to database
         ↓
Contact sent to ClickFunnels API (async)
         ↓
Contact created/updated in ClickFunnels
         ↓
Tagged with "UM-Webinar-Registered"
         ↓
Custom fields populated (webinar details)
```

### What Gets Synced

**Contact Information:**
- ✅ Email (required)
- ✅ First Name
- ✅ Last Name
- ✅ Phone (optional)
- ✅ Timezone (optional)
- ✅ Country (optional)

**Tags Applied:**
- 🏷️ `UM-Webinar-Registered` (always)

**Attendance Tags (automatic):**
- `UM-Webinar-Attended` – watched any portion of the live webinar
- `UM-Webinar-MostlyAttended` – stayed through the offer/CTA window (last ~15 min)
- `UM-Webinar-PartlyAttended` – watched at least 40 minutes but left before the CTA
- `UM-Webinar-Missed` – registered but never joined/watched
- `UM-Webinar-ReplayAttended` – watched a replay session

**Custom Fields:**
- `webinar_id` - The webinar ID
- `webinar_title` - The webinar title
- `registered_at` - When they registered
- `scheduled_start_time` - When webinar starts

### Configuration

**Required Environment Variables:**
```bash
CLICKFUNNELS_API_KEY=your_api_key
CLICKFUNNELS_WORKSPACE_ID=your_workspace_id
```

**If NOT configured:**
- Feature is disabled (silent)
- No errors thrown
- Registrations still work normally
- Only logs warning: "⚠️ ClickFunnels API not configured"

### Smart Features

**1. Duplicate Prevention:**
- Checks if contact already exists by email
- Updates existing contact instead of creating duplicate
- Merges tags (doesn't overwrite existing tags)

**2. Non-Blocking:**
- Runs asynchronously (doesn't delay registration)
- Failed CF sync won't block user registration
- User gets immediate confirmation

**3. Error Handling:**
- Gracefully handles API errors
- Logs errors for debugging
- Continues operation if CF is down

### Testing Outgoing Sync

**Test 1: Register a New User**

1. Go to your registration page: `https://yourdomain.com/webinar/{webinar-slug}`
2. Fill out the form and submit
3. Check ClickFunnels → Contacts
4. Verify contact exists with:
   - ✅ Email, name, phone
   - ✅ Tag: `UM-Webinar-Registered`
   - ✅ Custom fields populated

**Test 2: Register Existing Contact**

1. Register with an email that already exists in CF
2. Check ClickFunnels → Contacts → View that contact
3. Verify:
   - ✅ Contact updated (not duplicated)
   - ✅ Tag added to existing tags
   - ✅ Custom fields updated with new webinar info

**Test 3: Check Logs**

In your terminal/logs, you should see:
```
📤 Sending contact to ClickFunnels: user@example.com
✅ Contact sent to ClickFunnels: con_abc123
✅ Webinar registration synced to ClickFunnels: {
  contactId: 'con_abc123',
  email: 'user@example.com',
  tags: ['UM-Webinar-Registered']
}
```

### API Reference

**Function:** `syncWebinarRegistrationToClickFunnels()`

**Location:** `src/lib/clickfunnels.ts`

**Usage:**
```typescript
import { syncWebinarRegistrationToClickFunnels } from '@/lib/clickfunnels'

await syncWebinarRegistrationToClickFunnels({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  timezone: 'America/New_York',
  country: 'US',
  webinarId: 'web_123',
  webinarTitle: 'Marketing Masterclass',
  scheduledStartTime: new Date('2025-11-15T14:00:00Z')
})
```

**Response:**
- Returns `true` if successful
- Returns `false` if failed or not configured
- Never throws errors (always catches)

### Use Cases

**Use Case 1: Track All Registrants**
- Every registration automatically synced to CF
- Build unified contact list
- Run email campaigns in CF
- Segment by webinar attended

**Use Case 2: Multi-Touch Attribution**
- Track registration source
- See full customer journey in CF
- Attribute conversions correctly
- Optimize marketing funnel

**Use Case 3: Automated Follow-Up**
- Tag triggers automation in CF
- Send pre-webinar emails
- Send replay after webinar
- Offer products based on attendance

**Use Case 4: CRM Integration**
- CF syncs to your CRM
- Single source of truth
- Automated data flow
- Reduced manual data entry

---

## 📥 Incoming Webhooks (ClickFunnels → Your Platform)

### Detailed Configuration

### ClickFunnels Form Setup

#### Example HTML (Custom HTML Block)
```html
<script>
  // Add this to your form submission
  document.getElementById('your-form-id').addEventListener('submit', function() {
    // These will be sent as custom fields
    const customFields = {
      webinar_slug: 'marketing-masterclass',
      schedule_id: '', // Optional - leave empty for auto
      marketing_consent: document.getElementById('consent-checkbox').checked ? 'true' : 'false'
    };
    
    // ClickFunnels will include these in the webhook
  });
</script>
```

#### Using ClickFunnels Form Builder
1. Add hidden input fields:
   - Name: `webinar_slug`
   - Value: Your webinar slug
2. Map form fields to contact fields:
   - First Name → `first_name`
   - Last Name → `last_name`
   - Email → `email`
   - Phone → `phone` (optional)

### Webhook Payload Structure

ClickFunnels sends this data:

```json
{
  "id": "evt_123456789",
  "type": "contact.created",
  "contact": {
    "id": "con_987654321",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "time_zone": "America/New_York",
    "country": "US"
  },
  "custom_fields": {
    "webinar_slug": "marketing-masterclass",
    "schedule_id": "sch_123456",
    "marketing_consent": "true"
  },
  "created_at": "2025-11-12T10:00:00Z"
}
```

## 🔧 How It Works

### Complete Integration Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    INCOMING (CF → Platform)                  │
├─────────────────────────────────────────────────────────────┤
│  ClickFunnels Form Submission                               │
│           ↓                                                  │
│     Webhook Triggered                                        │
│           ↓                                                  │
│  Your Webhook Endpoint                                       │
│  (/api/integrations/clickfunnels/webhook)                   │
│           ↓                                                  │
│   Extract Contact Info                                       │
│           ↓                                                  │
│  Find Webinar (by ID or slug)                               │
│           ↓                                                  │
│  Check for Existing Registration                            │
│           ↓                                                  │
│   Create Registration                                        │
│           ↓                                                  │
│  Track in Analytics                                          │
│           ↓                                                  │
│   Return Success                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   OUTGOING (Platform → CF)                   │
├─────────────────────────────────────────────────────────────┤
│  User Registers on Your Site                                │
│           ↓                                                  │
│  Registration Saved to Database                             │
│           ↓                                                  │
│  Async: Send to ClickFunnels API                            │
│           ↓                                                  │
│  Search for Existing Contact by Email                       │
│           ↓                                                  │
│  Create New Contact OR Update Existing                      │
│           ↓                                                  │
│  Apply Tag: "UM-Webinar-Registered"                            │
│           ↓                                                  │
│  Add Custom Fields (webinar details)                        │
│           ↓                                                  │
│  User Receives Confirmation (non-blocking)                  │
└─────────────────────────────────────────────────────────────┘
```

### Flow Diagram (Incoming)
```
ClickFunnels Form Submission
          ↓
    Webhook Triggered
          ↓
Your Webhook Endpoint (/api/integrations/clickfunnels/webhook)
          ↓
  Extract Contact Info
          ↓
    Find Webinar (by ID or slug)
          ↓
  Check for Existing Registration
          ↓
   Create Registration
          ↓
  Track in Analytics
          ↓
   Return Success
```

### Registration Creation Logic

1. **Extract Contact**: Get email, name, phone from webhook
2. **Find Webinar**: Look up by `webinar_id` or `webinar_slug`
3. **Check Duplicates**: Prevent duplicate registrations
4. **Select Schedule**:
   - Use `schedule_id` if provided
   - Otherwise, use first active schedule
   - Falls back to first schedule
5. **Calculate Start Time**:
   - **Specific**: Use schedule's `scheduledAt`
   - **Just-in-Time**: Calculate from registration time + minutes
   - **Recurring**: Use next occurrence
6. **Create Registration**: Save to database
7. **Track Visit**: Log for analytics

## 📊 Supported Event Types

### contact.created ✅
Triggered when a new contact is created in ClickFunnels.

**Use Case**: New user submits form → Auto-register for webinar

### contact.updated ✅
Triggered when contact information is updated.

**Use Case**: User updates info → Check if needs registration

### order.created ✅
Triggered when an order is placed.

**Use Case**: User purchases → Auto-register for bonus webinar

## 🎨 Custom Field Mapping

### Standard ClickFunnels Fields
| ClickFunnels Field | Maps To | Required |
|--------------------|---------|----------|
| `email` | registration.email | ✅ Yes |
| `first_name` | registration.name | Optional |
| `last_name` | registration.name | Optional |
| `phone` | registration.phone | Optional |
| `time_zone` | registration.timezone | Optional |
| `country` | registration.country | Optional |

### Custom Fields (Your Configuration)
| Custom Field | Purpose | Format | Required |
|--------------|---------|--------|----------|
| `webinar_id` | Link to specific webinar | String (ID) | One of these |
| `webinar_slug` | Link to webinar by slug | String (slug) | required |
| `schedule_id` | Specific schedule | String (ID) | Optional |
| `marketing_consent` | Email marketing opt-in | "true" or "false" | Optional |

## 🧪 Testing

### Test Webhook Locally (Development)

1. **Install ngrok** (for local testing):
   ```bash
   ngrok http 3000
   ```

2. **Use ngrok URL** in ClickFunnels:
   ```
   https://your-ngrok-url.ngrok.io/api/integrations/clickfunnels/webhook
   ```

3. **Submit test form** in ClickFunnels

4. **Check logs**:
   ```bash
   # Your terminal should show:
   ClickFunnels Webhook Received: {
     type: 'contact.created',
     contactId: 'con_123',
     email: 'test@example.com'
   }
   Registration created: reg_456
   ```

### Test in Production

1. **Submit real form** on your funnel
2. **Check ClickFunnels** → Webhooks → View Logs
3. **Check your dashboard** → Webinars → Registrations
4. **Verify email** sent to registrant (if configured)

### Test Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success (duplicate/unsupported event) | None needed |
| 201 | Registration created | ✅ Success |
| 400 | Bad request (missing email) | Check form fields |
| 404 | Webinar not found | Check webinar_id/slug |
| 500 | Server error | Check server logs |

## 🔍 Troubleshooting

### Incoming Webhooks

#### Registration Not Created

**Problem**: Form submitted but no registration appears

**Solutions**:
1. Check ClickFunnels webhook logs for errors
2. Verify `webinar_slug` or `webinar_id` is correct
3. Check email format is valid
4. Look for duplicate prevention message in logs

### Webhook Not Triggering

**Problem**: ClickFunnels not sending webhooks

**Solutions**:
1. Verify webhook is **Active** in ClickFunnels
2. Check webhook URL is correct (no typos)
3. Ensure SSL certificate is valid (https required)
4. Test with ClickFunnels' "Send Test Webhook" button

### Wrong Webinar Registration

**Problem**: User registered for wrong webinar

**Solutions**:
1. Double-check `webinar_slug` in form
2. Verify webinar exists and slug matches
3. Check for typos in custom field names

### Missing Contact Information

**Problem**: Registration created but missing phone/name

**Solutions**:
1. Verify form fields are mapped to ClickFunnels contact fields
2. Check field names match exactly
3. Ensure fields are not optional in form

### Outgoing API

#### Contacts Not Appearing in ClickFunnels

**Problem**: Users register but don't show up in ClickFunnels

**Solutions**:
1. Check environment variables are set:
   ```bash
   echo $CLICKFUNNELS_API_KEY
   echo $CLICKFUNNELS_WORKSPACE_ID
   ```
2. Verify API key is valid (not expired)
3. Check workspace ID matches your CF account
4. Look for log message: "⚠️ ClickFunnels API not configured"
5. Check server logs for API errors

#### Contact Created But Not Tagged

**Problem**: Contact exists but missing `UM-Webinar-Registered` tag

**Solutions**:
1. Check if tags are enabled in your CF workspace
2. Verify tag name is exactly `UM-Webinar-Registered` (case-sensitive)
3. Manually test the API with Postman/curl
4. Check CF API rate limits

#### API Rate Limiting

**Problem**: High-volume registrations hitting CF rate limits

**Solutions**:
1. Implement queue system for API calls
2. Batch contact updates
3. Contact ClickFunnels support for higher limits
4. Cache contact lookups to reduce API calls

#### Duplicate Contacts

**Problem**: Same person appearing multiple times in CF

**Solutions**:
1. Verify email normalization (lowercase)
2. Check contact search is working
3. Review CF duplicate detection settings
4. Clean up duplicates in CF manually

---

## 🔐 Security

### API Key Security

**Best Practices**:
1. ✅ Never commit API keys to git
2. ✅ Use environment variables only
3. ✅ Rotate keys periodically
4. ✅ Use separate keys for dev/staging/production
5. ✅ Restrict API key permissions in CF

### Webhook Security

**Recommended Enhancements**:

### Multiple Webinars Per Funnel

Use different forms or conditional logic:

```javascript
// Example: Based on user selection
const webinarSlug = userSelection === 'advanced' 
  ? 'advanced-marketing' 
  : 'beginner-marketing';

// Pass to ClickFunnels as custom field
```

### Schedule Selection

Let users choose their preferred time:

```html
<select name="schedule_id">
  <option value="sch_123">Monday 2PM EST</option>
  <option value="sch_456">Wednesday 7PM EST</option>
  <option value="sch_789">Friday 10AM EST</option>
</select>
```

### Conditional Registration

Only register if certain conditions met:

```javascript
// In ClickFunnels
if (userPurchased || userOptedIn) {
  // Include webinar_slug in webhook
  customFields.webinar_slug = 'premium-training';
}
```

## 🔐 Security

### Webhook Verification (Optional Enhancement)

For added security, verify webhooks are from ClickFunnels:

```typescript
// Add to webhook route.ts
const signature = request.headers.get('x-clickfunnels-signature');
// Verify signature matches your webhook secret
```

**Data Privacy**:
1. ✅ Only sync necessary contact data
2. ✅ Respect GDPR/privacy settings
3. ✅ Don't sync if marketingConsent is false
4. ✅ Provide opt-out mechanism
5. ✅ Log all data transfers

---

## � Advanced Features

### Check Webhook Status

```bash
# GET request to verify webhook is active
curl https://yourdomain.com/api/integrations/clickfunnels/webhook
```

Response:
```json
{
  "message": "ClickFunnels 2.0 Webhook Endpoint",
  "status": "active",
  "supported_events": [
    "contact.created",
    "contact.updated",
    "order.created"
  ]
}
```

### Analytics

Track integration performance in your dashboard:

**Incoming (CF → Platform):**
- Total registrations from ClickFunnels
- Conversion rate by funnel
- Most popular webinars from funnels
- Registration timing patterns

**Outgoing (Platform → CF):**
- Sync success rate
- Failed sync attempts
- API response times
- Contact creation vs. updates ratio

**Monitoring Queries:**

```bash
# Check recent CF syncs in logs
grep "ClickFunnels" /var/log/yourapp.log | tail -50

# Count successful syncs today
grep "✅ Contact sent to ClickFunnels" /var/log/yourapp.log | grep "$(date +%Y-%m-%d)" | wc -l

# Find failed syncs
grep "❌ Failed to send contact to ClickFunnels" /var/log/yourapp.log
```

## 🎯 Use Cases

### Use Case 1: Lead Magnet Funnel
```
User downloads free guide
    ↓
ClickFunnels form with email
    ↓
Auto-registered for intro webinar
    ↓
Email sent with webinar link
```

### Use Case 2: Product Launch
```
User opts in for launch
    ↓
ClickFunnels registration
    ↓
Auto-registered for live demo
    ↓
Receives countdown email
```

### Use Case 3: Multi-Step Funnel
```
Step 1: Quiz/Survey
Step 2: Result page with registration
    ↓
ClickFunnels webhook
    ↓
Registered for relevant webinar based on quiz results
```

## 📝 API Reference

### POST /api/integrations/clickfunnels/webhook

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "id": "evt_123",
  "type": "contact.created",
  "contact": {
    "id": "con_456",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "time_zone": "America/New_York",
    "country": "US"
  },
  "custom_fields": {
    "webinar_slug": "marketing-masterclass",
    "schedule_id": "sch_789",
    "marketing_consent": "true"
  },
  "created_at": "2025-11-12T10:00:00Z"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "message": "Registration created successfully",
  "registration": {
    "id": "reg_123",
    "name": "John Doe",
    "email": "user@example.com",
    "webinarId": "web_456",
    "webinarTitle": "Marketing Masterclass",
    "scheduleId": "sch_789",
    "scheduledStartTime": "2025-11-15T14:00:00Z"
  }
}
```

**Error Response** (404):
```json
{
  "error": "Webinar not found",
  "webinarId": null,
  "webinarSlug": "marketing-masterclass"
}
```

## 🚀 Next Steps

1. **Set up API credentials** in .env file
2. **Configure webhook** in ClickFunnels (for incoming)
3. **Add custom fields** to your forms (for incoming)
4. **Test registration** from your site (for outgoing)
5. **Verify contacts** appear in ClickFunnels
6. **Monitor logs** for sync status
7. **Configure email notifications** (if not already done)
8. **Build automations** in ClickFunnels using the tag

## 📚 Additional Resources

- [ClickFunnels 2.0 API Documentation](https://apidocs.myclickfunnels.com/)
- [Webhook Best Practices](https://docs.clickfunnels.com/docs/webhooks)
- [Contact API Reference](https://apidocs.myclickfunnels.com/#tag/Contact)
- Your Webinar Platform Documentation

---

## 📋 Implementation Checklist

### Environment Setup
- [ ] Add `CLICKFUNNELS_API_KEY` to .env
- [ ] Add `CLICKFUNNELS_WORKSPACE_ID` to .env
- [ ] Restart application server
- [ ] Verify environment variables loaded

### Incoming Webhooks (CF → Platform)
- [ ] Create webhook in ClickFunnels
- [ ] Test webhook with CF test tool
- [ ] Add custom fields to CF forms
- [ ] Submit test registration
- [ ] Verify registration created in platform

### Outgoing API (Platform → CF)
- [ ] Register test user on your platform
- [ ] Check ClickFunnels for new contact
- [ ] Verify `UM-Webinar-Registered` tag applied
- [ ] Confirm custom fields populated
- [ ] Test with existing CF contact

### Monitoring & Maintenance
- [ ] Set up log monitoring
- [ ] Create dashboard for sync metrics
- [ ] Test error handling (disable CF temporarily)
- [ ] Document any custom configurations
- [ ] Train team on troubleshooting

---

**Status**: ✅ Live and Ready
**Version**: 2.0 (Bi-directional)
**Last Updated**: November 12, 2025

**Features**:
- ✅ Incoming webhooks (CF → Platform)
- ✅ Outgoing API sync (Platform → CF)
- ✅ Auto-tagging with `UM-Webinar-Registered`
- ✅ Duplicate prevention
- ✅ Error handling
- ✅ Custom fields
- ✅ Non-blocking async operations

Happy Funneling! 🎉
