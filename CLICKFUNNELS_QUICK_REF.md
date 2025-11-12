# ClickFunnels Integration Quick Reference

## 🔑 Environment Variables

```bash
CLICKFUNNELS_API_KEY=pk_your_api_key_here
CLICKFUNNELS_WORKSPACE_ID=ws_your_workspace_id
CLICKFUNNELS_WEBINAR_TAG=UM-Webinar-Registered
# CLICKFUNNELS_WEBINAR_TAG_ID=368586
# CLICKFUNNELS_TAG_ATTENDED=368587
# CLICKFUNNELS_TAG_MOSTLY_ATTENDED=368588
# CLICKFUNNELS_TAG_PARTLY_ATTENDED=368589
# CLICKFUNNELS_TAG_MISSED=368590
# CLICKFUNNELS_TAG_REPLAY_ATTENDED=368591
```

## 📍 Endpoints

### Webhook (Incoming)
```
POST https://yourdomain.com/api/integrations/clickfunnels/webhook
```

### Your Registration (Outgoing triggers API call)
```
POST https://yourdomain.com/api/webinars/{id}/register
```

## 🏷️ Tags Applied

- `UM-Webinar-Registered` → when a user registers (immediate)
- `UM-Webinar-Attended` → watched any part of the webinar
- `UM-Webinar-MostlyAttended` → stayed until the offer/CTA segment
- `UM-Webinar-PartlyAttended` → watched ≥ 40 minutes but left before CTA
- `UM-Webinar-Missed` → never joined/watched
- `UM-Webinar-ReplayAttended` → watched a replay session

## 📊 Custom Fields Sent to ClickFunnels

```json
{
  "webinar_id": "web_abc123",
  "webinar_title": "Marketing Masterclass",
  "registered_at": "2025-11-12T10:00:00Z",
  "scheduled_start_time": "2025-11-15T14:00:00Z"
}
```

## 📋 Required Form Fields (Incoming)

For ClickFunnels forms, add these custom fields:

```javascript
webinar_slug: "your-webinar-slug"  // Required
schedule_id: "sch_123"              // Optional
marketing_consent: "true"           // Optional
```

## ✅ How to Test

### Test Outgoing (Platform → CF)

1. Register on your site: `https://yourdomain.com/webinar/{slug}`
2. Check ClickFunnels → Contacts
3. Look for the email with tag `UM-Webinar-Registered` (and, after attending, the proper attendance tag)

### Test Incoming (CF → Platform)

1. Submit ClickFunnels form with `webinar_slug`
2. Check your dashboard → Webinars → Registrations
3. Verify registration created

## 🐛 Quick Debugging

### Check if CF is configured:
```bash
# In your terminal/logs, look for:
"⚠️ ClickFunnels API not configured"  # Not set up
"📤 Sending contact to ClickFunnels"  # Working!
```

### Check logs for errors:
```bash
grep "ClickFunnels" logs/*.log
grep "❌" logs/*.log | grep ClickFunnels
```

### Verify environment variables:
```bash
printenv | grep CLICKFUNNELS
```

## 🔄 What Happens When

### User Registers on Your Site:
1. Registration saved to database ✅
2. Contact sent to ClickFunnels API (async) ✅
3. Tagged with `UM-Webinar-Registered` ✅
4. Custom fields populated ✅

### User Submits ClickFunnels Form:
1. CF sends webhook to your endpoint ✅
2. Your system creates registration ✅
3. Contact already in CF (no duplicate) ✅

## 📞 Support

- **ClickFunnels API Docs**: https://apidocs.myclickfunnels.com/
- **Webhook Guide**: https://docs.clickfunnels.com/docs/webhooks
- **Contact API**: https://apidocs.myclickfunnels.com/#tag/Contact

---

**Version**: 2.0
**Updated**: November 12, 2025
