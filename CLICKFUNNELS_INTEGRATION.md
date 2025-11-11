# ClickFunnels 2.0 Integration - Complete Guide

## 🎯 Overview

Integrate your webinar platform with ClickFunnels 2.0 to automatically register users when they submit forms on your funnels.

## ✅ What's Included

- **Webhook Endpoint**: Receives ClickFunnels events
- **Auto Registration**: Automatically creates webinar registrations
- **Contact Sync**: Syncs contact info (name, email, phone)
- **Analytics Tracking**: Tracks registrations in your analytics
- **Error Handling**: Graceful handling of edge cases
- **Duplicate Prevention**: Checks for existing registrations

## 🚀 Quick Setup

### Step 1: Get Your Webhook URL

Your webhook endpoint is:
```
https://yourdomain.com/api/integrations/clickfunnels/webhook
```

Replace `yourdomain.com` with your actual domain.

### Step 2: Configure ClickFunnels Webhook

1. **Log into ClickFunnels 2.0**
2. Go to **Settings** → **Webhooks**
3. Click **Add New Webhook**
4. Configure:
   - **Webhook URL**: `https://yourdomain.com/api/integrations/clickfunnels/webhook`
   - **Event Types**: Select these events:
     - ✅ `contact.created`
     - ✅ `contact.updated`
     - ✅ `order.created` (optional)
   - **Status**: Active

### Step 3: Add Custom Fields to Your Funnel Forms

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

### Step 4: Test the Integration

1. Submit a test form in ClickFunnels
2. Check your webinar dashboard
3. Verify the registration was created
4. Check the webhook logs in ClickFunnels

## 📋 Detailed Configuration

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

### Flow Diagram
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

### Registration Not Created

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

## 📱 Advanced Features

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

### Best Practices

1. ✅ Always use HTTPS for webhook endpoint
2. ✅ Validate email format before creating registration
3. ✅ Check for duplicates to prevent multiple registrations
4. ✅ Log all webhook events for debugging
5. ✅ Handle errors gracefully
6. ✅ Return proper HTTP status codes

## 📊 Monitoring

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

Track webhook performance in your dashboard:
- Total registrations from ClickFunnels
- Conversion rate by funnel
- Most popular webinars from funnels
- Registration timing patterns

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

1. **Set up webhook** in ClickFunnels
2. **Add custom fields** to your forms
3. **Test with sample submission**
4. **Monitor registrations** in dashboard
5. **Configure email notifications** (if not already done)

## 📚 Additional Resources

- [ClickFunnels 2.0 API Documentation](https://apidocs.myclickfunnels.com/)
- [Webhook Best Practices](https://docs.clickfunnels.com/docs/webhooks)
- Your Webinar Platform Documentation

---

**Status**: ✅ Live and Ready
**Version**: 1.0
**Last Updated**: November 12, 2025

Happy Funneling! 🎉
