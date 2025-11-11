# Where to Find Analytics & A/B Testing Results

## 📊 Analytics Dashboard

### Location: `/dashboard/analytics`

Access this page by:
1. Log in to your dashboard
2. Click **"Analytics"** in the sidebar navigation
3. URL: `http://localhost:3002/dashboard/analytics`

### What You Can See:

#### 1. **Overview Metrics (Top Cards)**
- Total Registrations
- Conversion Rate (Views → Registrations)
- Total Attendees
- Attendance Rate

#### 2. **Offer Performance**
- Saw Offer (how many attendees saw the offer)
- Clicked Offer (click-through rate)
- Converted (conversion rate)

#### 3. **Registration Pages Performance** ⭐
This is the **main section** for registration page stats!

**Table shows:**
- **Registration Page** - Name of each registration page/template
- **Variant** - If A/B testing is enabled, shows "Variant A" or "Variant B"
- **Total Views** - Total number of page views
- **Unique Views** - Number of unique visitors
- **Avg Time (sec)** - Average time spent on the page

**Example:**
```
Registration Page         | Variant    | Total Views | Unique Views | Avg Time
-------------------------|------------|-------------|--------------|----------
Urgency Template         | Variant A  | 245         | 189          | 45s
Default Template         | Variant B  | 238         | 182          | 52s
Islamic Template         |            | 124         | 98           | 38s
```

#### 4. **Engagement Timeline**
- Area chart showing when people joined
- Shows engagement over time

#### 5. **Reaction & Chat Activity**
- Bar charts showing when reactions/chat peaked
- Total reactions and messages

#### 6. **Funnel Visualization**
- Registration Page Visits
- Countdown Page Visits
- Webinar Page Visits
- Thank You Page Visits

### Filtering Options:

**By Webinar:**
- Select "All Webinars" to see aggregate data
- OR select specific webinars to filter

**By Time Frame:**
- All Time
- Last 7 Days
- Last 30 Days
- Last 90 Days

---

## 🧪 A/B Testing Results

### API Endpoint: `/api/ab-test/results/[webinarId]`

### Access Methods:

#### Option 1: Using Browser/Postman
```
GET http://localhost:3002/api/ab-test/results/YOUR_WEBINAR_ID
```

**Response includes:**
```json
{
  "success": true,
  "results": {
    "overall": {
      "totalVisitors": 245,
      "totalConversions": 89,
      "conversionRate": 36.3
    },
    "variantA": {
      "visitors": 124,
      "conversions": 48,
      "conversionRate": 38.7,
      "confidenceInterval": [29.8, 47.6]
    },
    "variantB": {
      "visitors": 121,
      "conversions": 41,
      "conversionRate": 33.9,
      "confidenceInterval": [25.4, 42.4]
    },
    "analysis": {
      "winner": "A",
      "improvement": 14.2,
      "pValue": 0.042,
      "isSignificant": true,
      "confidence": "95%"
    },
    "elements": {
      "registration": {...},
      "schedule": {...},
      "offer": {...},
      "video": {...}
    }
  }
}
```

#### Option 2: From Code
```typescript
const response = await fetch(`/api/ab-test/results/${webinarId}`);
const data = await response.json();
console.log(data.results);
```

---

## 📈 Detailed A/B Test Metrics

### What's Tracked:

#### 1. **Registration Pages A/B Test**
- Views for Variant A vs Variant B
- Conversion rates (registrations/views)
- Statistical significance
- Winner determination

#### 2. **Schedule Options A/B Test**
- Which schedule options were shown
- Click-through rates
- Conversion rates

#### 3. **Offer A/B Test**
- Different offer variations
- View rates
- Click rates
- Conversion rates

#### 4. **Video A/B Test**
- Different video IDs tested
- Engagement metrics
- Completion rates

### Understanding the Results:

#### **Conversion Rate**
```
Conversion Rate = (Conversions / Views) × 100
```

#### **Statistical Significance**
- **p-value < 0.05** = 95% confident the difference is real
- **p-value < 0.01** = 99% confident
- **p-value > 0.05** = Not enough data or no significant difference

#### **Winner Determination**
The system automatically determines the winner based on:
1. Higher conversion rate
2. Statistical significance (p-value < 0.05)
3. Sufficient sample size (usually 100+ visitors per variant)

#### **Improvement Percentage**
```
Improvement = ((Winner CR - Loser CR) / Loser CR) × 100
```
Example: If Variant A = 38.7% and Variant B = 33.9%
Improvement = ((38.7 - 33.9) / 33.9) × 100 = 14.2%

---

## 🎯 Quick Access Guide

### To See Registration Page Stats:
1. Go to `/dashboard/analytics`
2. Scroll to **"Registration Pages Performance"** section
3. View the table with all registration page metrics

### To See A/B Test Results for a Specific Webinar:
1. Get the webinar ID from the URL or database
2. Visit: `/api/ab-test/results/[WEBINAR_ID]`
3. Or use the API endpoint in your code

### To Export Analytics:
1. Go to `/dashboard/analytics`
2. Click **"Export Report"** button (top right)
3. Downloads PDF or CSV with all metrics

---

## 🔧 API Endpoints Reference

### Analytics Endpoints:
```
GET /api/webinars/:id/analytics              - Single webinar analytics
GET /api/analytics/aggregate                  - All webinars aggregate
GET /api/tracking/page                        - Track page visits
GET /api/tracking/engagement                  - Track engagement events
```

### A/B Testing Endpoints:
```
GET  /api/ab-test/results/:webinarId          - Get test results
POST /api/ab-test/track-conversion           - Track conversion
POST /api/ab-test/reset                       - Reset test data (careful!)
```

---

## 📊 Understanding Registration Page Analytics

### Page Tracking System:

When someone visits a registration page:
1. **Page Visit Tracked** - Records `pageId` and `variantGroup`
2. **Time Tracking** - Measures time spent on page
3. **Conversion Tracking** - Links to registration when user signs up

### Data Flow:
```
Registration Page Visit
  ↓
Store: pageId, variantGroup, timestamp
  ↓
User Registers
  ↓
Link: registration → pageId
  ↓
Calculate Metrics:
  - Total views
  - Unique views
  - Conversion rate
  - Avg time on page
```

### Example Query:
To see raw data in the database:
```sql
SELECT 
  pageId,
  variantGroup,
  COUNT(*) as total_views,
  COUNT(DISTINCT visitorId) as unique_views,
  AVG(timeOnPage) as avg_time
FROM page_visits
WHERE pageType = 'registration'
  AND webinarId = 'YOUR_WEBINAR_ID'
GROUP BY pageId, variantGroup;
```

---

## 🎨 Visualization Components

The analytics dashboard uses these charts:

1. **Line Charts** - Engagement over time
2. **Bar Charts** - Reaction/chat activity by minute
3. **Area Charts** - Join/leave patterns
4. **Pie Charts** - Join timing distribution
5. **Tables** - Registration page performance
6. **Cards** - Key metrics overview

All built with **Recharts** library for responsive, interactive charts.

---

## 💡 Tips & Best Practices

### For Accurate Analytics:
1. ✅ Wait for at least **100 visitors** per variant for reliable A/B test results
2. ✅ Run tests for **at least 7 days** to account for weekly patterns
3. ✅ Don't change variants mid-test (it invalidates results)
4. ✅ Use the **Reset A/B Test** feature only when starting fresh

### For Better Insights:
1. 📊 Compare registration page performance across different templates
2. 🔍 Look for patterns in time-on-page vs conversion rate
3. 📈 Monitor unique views vs total views (high ratio = good traffic quality)
4. ⏱️ Optimal time on page is usually 30-90 seconds for registration

### Common Questions:

**Q: Why don't I see A/B test results?**
A: You need to:
- Enable A/B testing in webinar settings
- Have multiple variants configured
- Have at least some traffic to the variants

**Q: How do I know which registration page is performing best?**
A: Look at the "Registration Pages Performance" table and compare:
- Conversion Rate (not just views!)
- Average time on page
- Statistical significance if A/B testing

**Q: Can I export the data?**
A: Yes! Use the "Export Report" button on the analytics dashboard.

---

## 🚀 Next Steps

1. **Review Current Performance**
   - Go to `/dashboard/analytics`
   - Check registration page stats
   - Identify top performers

2. **Set Up A/B Tests**
   - Go to webinar edit page
   - Enable A/B testing
   - Configure variants

3. **Monitor Results**
   - Check analytics regularly
   - Wait for statistical significance
   - Implement winners

4. **Optimize**
   - Use winning variants
   - Test new variations
   - Continuously improve

---

## 📞 Need Help?

If you can't find specific metrics:
1. Check the Analytics Dashboard first
2. Try the A/B Test Results API
3. Query the database directly using Prisma Studio
4. Check the browser console for tracking logs

Happy analyzing! 📊✨
