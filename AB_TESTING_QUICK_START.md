# A/B Testing Quick Start Guide

## Registration Page A/B Testing is Live! 🎉

The registration page now supports A/B testing for templates, schedules, offers, and videos. Here's how to use it:

## Quick Test (Manual Database Setup)

### 1. Create Two Templates

```sql
-- Create Template A
INSERT INTO templates (id, name, description, "htmlCode", "isSystem", "createdAt", "updatedAt")
VALUES (
  'template-a-id',
  'Template A - Purple Theme',
  'Variant A with purple colors',
  '<html><!-- Your Template A HTML here --></html>',
  false,
  NOW(),
  NOW()
);

-- Create Template B
INSERT INTO templates (id, name, description, "htmlCode", "isSystem", "createdAt", "updatedAt")
VALUES (
  'template-b-id',
  'Template B - Green Theme',
  'Variant B with green colors',
  '<html><!-- Your Template B HTML here --></html>',
  false,
  NOW(),
  NOW()
);
```

### 2. Enable A/B Testing on a Webinar

```sql
-- Get your webinar ID first
SELECT id, slug, title FROM webinars;

-- Enable A/B testing
UPDATE webinars 
SET 
  "enableABTesting" = true,
  "trafficSplitPercent" = 50,  -- 50/50 split
  "testRegistrationPage" = true,
  "regTemplateAId" = 'template-a-id',
  "regTemplateBId" = 'template-b-id'
WHERE slug = 'your-webinar-slug';
```

### 3. Visit the Registration Page

```
http://localhost:3003/w/your-webinar-slug
```

**What happens:**
- You'll be assigned to Group A or B
- A cookie is set: `webinar_test_group_{webinarId}`
- You'll see either Template A or Template B
- Page view is tracked in `ab_test_metrics` table

### 4. Test Different Browsers

Open the registration page in:
- Chrome (Incognito)
- Firefox (Private)
- Safari (Private)

Each browser will be assigned independently (50% chance of A, 50% chance of B).

### 5. Check Tracking Data

```sql
-- View page views
SELECT 
  "testGroup",
  element,
  "variantShown",
  converted,
  device,
  "pageView"
FROM ab_test_metrics 
WHERE "webinarId" = 'your-webinar-id' 
ORDER BY "pageView" DESC;

-- View distribution
SELECT 
  "testGroup",
  COUNT(*) as visitors
FROM ab_test_metrics
WHERE "webinarId" = 'your-webinar-id'
GROUP BY "testGroup";
```

### 6. Complete a Registration

Fill out the form and register. Then check:

```sql
-- View conversions
SELECT 
  "testGroup",
  COUNT(*) as total_views,
  SUM(CASE WHEN converted THEN 1 ELSE 0 END) as conversions,
  ROUND(
    100.0 * SUM(CASE WHEN converted THEN 1 ELSE 0 END) / COUNT(*), 
    2
  ) as conversion_rate
FROM ab_test_metrics
WHERE "webinarId" = 'your-webinar-id'
GROUP BY "testGroup";
```

## Test Schedule A/B Testing

```sql
-- Get schedule IDs
SELECT id, "scheduleType", "scheduledAt" 
FROM webinar_schedules 
WHERE "webinarId" = 'your-webinar-id';

-- Enable schedule testing
UPDATE webinars 
SET 
  "testSchedule" = true,
  "scheduleAIds" = 'schedule-1-id,schedule-2-id',  -- Comma-separated
  "scheduleBIds" = 'schedule-3-id,schedule-4-id'
WHERE id = 'your-webinar-id';
```

Now visitors in Group A will only see schedules 1 and 2, while Group B sees schedules 3 and 4.

## Test Offer A/B Testing

```sql
-- Get offer IDs
SELECT id, title, price 
FROM offers 
WHERE "webinarId" = 'your-webinar-id';

-- Enable offer testing
UPDATE webinars 
SET 
  "testOffer" = true,
  "offerAId" = 'offer-1-id',
  "offerBId" = 'offer-2-id'
WHERE id = 'your-webinar-id';
```

## Test Video A/B Testing

```sql
-- Enable video testing
UPDATE webinars 
SET 
  "testVideo" = true,
  "videoAId" = '123456789',  -- Vimeo ID
  "videoBId" = 'https://youtube.com/watch?v=...'  -- Or full URL
WHERE id = 'your-webinar-id';
```

## Clear Test Data

```sql
-- Remove all A/B test metrics for a webinar
DELETE FROM ab_test_metrics 
WHERE "webinarId" = 'your-webinar-id';
```

## Disable A/B Testing

```sql
UPDATE webinars 
SET 
  "enableABTesting" = false,
  "testRegistrationPage" = false,
  "testSchedule" = false,
  "testOffer" = false,
  "testVideo" = false
WHERE id = 'your-webinar-id';
```

## Troubleshooting

### Issue: Always seeing the same variant
**Solution:** Clear cookies or test in incognito mode.

```javascript
// In browser console
document.cookie.split(";").forEach(function(c) { 
  if (c.includes('webinar_')) {
    document.cookie = c.replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  }
});
```

### Issue: Tracking not working
**Solution:** Check browser console and server logs.

```bash
# Server logs
npm run dev

# Check database
psql -U aribafarheen -d webinar_db
SELECT COUNT(*) FROM ab_test_metrics;
```

### Issue: Template not rendering
**Solution:** Check template has valid HTML and is assigned correctly.

```sql
SELECT id, name FROM templates WHERE id IN (
  SELECT "regTemplateAId" FROM webinars WHERE id = 'your-webinar-id'
  UNION
  SELECT "regTemplateBId" FROM webinars WHERE id = 'your-webinar-id'
);
```

## Next Steps

Once you've tested manually, you'll want to:

1. **Build Admin UI** - Configure tests without SQL
2. **Build Results Dashboard** - View test results visually
3. **Add Statistical Significance** - Determine clear winners

See `AB_TESTING_PROGRESS.md` for implementation roadmap.

## API Endpoints Available

### Track Conversion (POST)
```
POST /api/ab-test/track-conversion
Content-Type: application/json

{
  "webinarId": "webinar-id",
  "registrationId": "registration-id"
}
```

### Register (POST) - Now tracks test group
```
POST /api/webinars/{id}/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "scheduleId": "schedule-id",
  "timezone": "America/New_York",
  "privacyConsent": true,
  // ... other fields
}

Response includes:
{
  "registrationId": "...",  // For conversion tracking
  "registration": { ... }
}
```

## Database Schema Reference

### ABTestMetric Table
```sql
CREATE TABLE "ab_test_metrics" (
  id TEXT PRIMARY KEY,
  "webinarId" TEXT NOT NULL,
  "visitorId" TEXT NOT NULL,
  "testGroup" TEXT NOT NULL,  -- 'A' or 'B'
  element TEXT NOT NULL,      -- 'registration', 'schedule', 'offer', 'video'
  "variantShown" TEXT NOT NULL,
  "pageView" TIMESTAMP NOT NULL DEFAULT NOW(),
  converted BOOLEAN NOT NULL DEFAULT FALSE,
  "registrationId" TEXT,
  "timeOnPage" INTEGER,
  clicks INTEGER NOT NULL DEFAULT 0,
  country TEXT,
  referrer TEXT,
  device TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Registration Table (with test group)
```sql
-- Added field
testGroup TEXT  -- 'A', 'B', or NULL (if not testing)
```

## Sample Queries

### Get conversion funnel
```sql
SELECT 
  element,
  "testGroup",
  COUNT(DISTINCT "visitorId") as unique_visitors,
  COUNT(*) as page_views,
  SUM(CASE WHEN converted THEN 1 ELSE 0 END) as conversions
FROM ab_test_metrics
WHERE "webinarId" = 'your-webinar-id'
GROUP BY element, "testGroup"
ORDER BY element, "testGroup";
```

### Get device breakdown
```sql
SELECT 
  device,
  "testGroup",
  COUNT(*) as count,
  SUM(CASE WHEN converted THEN 1 ELSE 0 END) as conversions
FROM ab_test_metrics
WHERE "webinarId" = 'your-webinar-id'
GROUP BY device, "testGroup"
ORDER BY count DESC;
```

### Get time-based metrics
```sql
SELECT 
  DATE("pageView") as date,
  "testGroup",
  COUNT(*) as views,
  SUM(CASE WHEN converted THEN 1 ELSE 0 END) as conversions
FROM ab_test_metrics
WHERE "webinarId" = 'your-webinar-id'
GROUP BY DATE("pageView"), "testGroup"
ORDER BY date DESC;
```

---

**Documentation:**
- Full architecture: `AB_TESTING_ARCHITECTURE.md`
- Implementation details: `REGISTRATION_AB_TESTING_COMPLETE.md`
- Progress tracker: `AB_TESTING_PROGRESS.md`
- User experience: `AB_TESTING_USER_EXPERIENCE.md`
