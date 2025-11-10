# Attendee Analytics - Quick Start Guide

## 🚀 Getting Started

The analytics system is fully integrated and automatically tracks all attendee behavior. No setup required!

## 📊 Viewing Analytics

### 1. Webinar-Level Analytics

Get comprehensive analytics for any webinar:

```bash
GET /api/webinars/{webinarId}/analytics
```

**Example:**
```javascript
const response = await fetch('/api/webinars/clx123abc/analytics');
const data = await response.json();

console.log(data.analytics.overview);
// {
//   totalRegistrations: 150,
//   totalAttended: 98,
//   attendanceRate: 65.3,
//   noShows: 52,
//   noShowRate: 34.7,
//   avgWatchTime: 1847,  // seconds
//   completionRate: 42.9
// }
```

### 2. Individual Attendee Profile

Get detailed journey for a specific attendee:

```bash
GET /api/attendees/{registrationId}/profile
```

**Example:**
```javascript
const response = await fetch('/api/attendees/reg_abc123/profile');
const data = await response.json();

console.log(data.profile.metrics);
// {
//   attended: true,
//   totalWatchTime: 2145,
//   maxVideoPosition: 2250,
//   watchPercentage: 83.3,
//   engagementCount: 12,
//   engagementScore: 78,
//   completed: false
// }

// Full journey timeline
console.log(data.profile.journey);
// [
//   { type: 'registration', timestamp: '2025-01-01T10:00:00Z', ... },
//   { type: 'page_visit', timestamp: '2025-01-01T14:00:00Z', ... },
//   { type: 'joined', timestamp: '2025-01-01T14:05:00Z', ... },
//   { type: 'engagement', timestamp: '2025-01-01T14:15:00Z', ... },
//   ...
// ]
```

## 🎯 Key Metrics Explained

### Attendance Rate
```
(Total Attended / Total Registrations) × 100
```
Shows what percentage of registrants actually showed up.

### Completion Rate
```
(Watched to End / Total Attended) × 100
```
Shows what percentage stayed until the video ended.

### Offer View Rate
```
(Saw Offer / Total Attended) × 100
```
Shows how many attendees saw the offer.

### Offer Click Rate
```
(Clicked Offer / Saw Offer) × 100
```
Shows conversion from seeing offer to clicking.

### Conversion Rate
```
(Converted / Clicked Offer) × 100
```
Shows final conversion from click to purchase.

### Engagement Score (0-100)
- Attended: 20 points
- Watch Time: 0-30 points (proportional)
- Engagements: 5 points each (max 25)
- Saw Offer: 10 points
- Clicked Offer: 10 points
- Completed: 5 points

## 📈 Common Use Cases

### 1. Identify High-Value Attendees

Find attendees with engagement score > 70:

```typescript
// In your analytics dashboard
const highValueAttendees = registrations
  .filter(reg => calculateEngagementScore(reg) > 70)
  .map(reg => ({
    email: reg.email,
    score: calculateEngagementScore(reg),
    converted: reg.offerAnalytics?.converted
  }));
```

### 2. Find Drop-Off Points

Analyze where people leave:

```typescript
const response = await fetch('/api/webinars/clx123/analytics');
const { dropOff } = response.data.analytics;

// dropOff.byMinute = [
//   { minute: 0, count: 2 },
//   { minute: 2, count: 5 },
//   { minute: 10, count: 15 },  // Major drop-off at 10 minutes
//   ...
// ]
```

### 3. Analyze Join Timing

See when people are joining:

```typescript
const { joinTiming } = analyticsData;

console.log(`On time: ${joinTiming.onTime}`);
console.log(`1-5 min late: ${joinTiming.earlyLate}`);
console.log(`5+ min late: ${joinTiming.late}`);
```

### 4. Track Engagement Over Time

See when viewers are most active:

```typescript
const { engagement } = analyticsData;

// engagement.byMinute = [
//   { minute: 0, chat: 5, reactions: 12 },
//   { minute: 1, chat: 8, reactions: 15 },
//   { minute: 15, chat: 20, reactions: 45 },  // Peak engagement
//   ...
// ]
```

### 5. Funnel Analysis

Track the complete funnel:

```typescript
const { funnel } = analyticsData;

console.log(`Registration Page: ${funnel.registrationPageVisits} visitors`);
console.log(`Countdown Page: ${funnel.countdownPageVisits} visitors`);
console.log(`Webinar Page: ${funnel.webinarPageVisits} attendees`);
console.log(`Thank You Page: ${funnel.thankYouPageVisits} visitors`);

// Conversion rates
const showUpRate = (funnel.webinarPageVisits / funnel.registrationPageVisits) * 100;
console.log(`Show-up rate: ${showUpRate}%`);
```

## 🎨 Building an Analytics Dashboard

### Example React Component

```tsx
'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie } from 'recharts';

export function WebinarAnalytics({ webinarId }: { webinarId: string }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/webinars/${webinarId}/analytics`)
      .then(res => res.json())
      .then(data => {
        setAnalytics(data.analytics);
        setLoading(false);
      });
  }, [webinarId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="analytics-dashboard">
      {/* Overview Cards */}
      <div className="metrics-grid">
        <MetricCard 
          title="Total Registrations" 
          value={analytics.overview.totalRegistrations}
          icon="users"
        />
        <MetricCard 
          title="Attendance Rate" 
          value={`${analytics.overview.attendanceRate}%`}
          icon="chart-line"
        />
        <MetricCard 
          title="Avg Watch Time" 
          value={formatTime(analytics.overview.avgWatchTime)}
          icon="clock"
        />
        <MetricCard 
          title="Completion Rate" 
          value={`${analytics.overview.completionRate}%`}
          icon="check-circle"
        />
      </div>

      {/* Engagement Chart */}
      <div className="chart-container">
        <h3>Engagement Over Time</h3>
        <LineChart width={800} height={300} data={analytics.engagement.byMinute}>
          <Line type="monotone" dataKey="chat" stroke="#8884d8" name="Chat" />
          <Line type="monotone" dataKey="reactions" stroke="#82ca9d" name="Reactions" />
        </LineChart>
      </div>

      {/* Drop-off Chart */}
      <div className="chart-container">
        <h3>Drop-off Points</h3>
        <BarChart width={800} height={300} data={analytics.dropOff.byMinute}>
          <Bar dataKey="count" fill="#ff6b6b" />
        </BarChart>
      </div>

      {/* Join Timing */}
      <div className="chart-container">
        <h3>Join Timing Distribution</h3>
        <PieChart width={400} height={300}>
          <Pie
            data={analytics.joinTiming.distribution}
            dataKey="count"
            nameKey="label"
            fill="#8884d8"
            label
          />
        </PieChart>
      </div>

      {/* Offer Performance */}
      <div className="metrics-grid">
        <MetricCard 
          title="Saw Offer" 
          value={`${analytics.offers.offerViewRate}%`}
          icon="eye"
        />
        <MetricCard 
          title="Clicked Offer" 
          value={`${analytics.offers.offerClickRate}%`}
          icon="mouse-pointer"
        />
        <MetricCard 
          title="Converted" 
          value={`${analytics.offers.conversionRate}%`}
          icon="shopping-cart"
        />
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon }) {
  return (
    <div className="metric-card">
      <i className={`fas fa-${icon}`} />
      <h4>{title}</h4>
      <p className="metric-value">{value}</p>
    </div>
  );
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
```

## 🔍 Advanced Queries

### Find Non-Converters Who Engaged Heavily

```typescript
// Get all attendees
const registrations = await prisma.registration.findMany({
  where: { webinarId },
  include: { sessions: true }
});

const highEngagementNonConverters = registrations
  .filter(reg => {
    const engaged = reg.sessions.reduce((sum, s) => sum + s.engagements.length, 0) > 10;
    const notConverted = !reg.offerAnalytics?.converted;
    return engaged && notConverted;
  })
  .map(reg => ({
    email: reg.email,
    engagements: reg.sessions.reduce((sum, s) => sum + s.engagements.length, 0)
  }));

// These are warm leads - send follow-up!
```

### Calculate Average Time to Conversion

```typescript
const converters = await prisma.offerAnalytics.findMany({
  where: { 
    webinarId,
    converted: true
  }
});

const avgTimeToConversion = converters.reduce((sum, conv) => {
  const time = conv.convertedAt.getTime() - conv.sawOfferAt.getTime();
  return sum + time;
}, 0) / converters.length / 1000; // Convert to seconds

console.log(`Average time to conversion: ${avgTimeToConversion} seconds`);
```

## 🎯 Optimization Tips

### 1. Reduce Drop-offs
- Identify the minute with highest drop-offs
- Review content at that timestamp
- Make it more engaging or concise

### 2. Improve Offer Timing
- Check `analytics.offers.offerViewRate`
- If low, show offer earlier
- If high but low click rate, improve offer copy

### 3. Increase Completion Rate
- Look at where people stop watching
- Consider shortening or adding more engagement

### 4. Follow Up with Segments

**High Engagement, No Purchase:**
```typescript
// These people are interested - send discount code
const segment = attendees.filter(a => 
  a.engagementScore > 70 && !a.converted
);
```

**Low Engagement, Attended:**
```typescript
// These people might need more info - send FAQ
const segment = attendees.filter(a => 
  a.attended && a.engagementScore < 30
);
```

**Clicked Offer, Didn't Convert:**
```typescript
// These people are hot leads - personal follow-up
const segment = attendees.filter(a => 
  a.clickedOffer && !a.converted
);
```

## 🚨 Troubleshooting

### No data showing?

1. **Check Prisma Client**: Run `npx prisma generate`
2. **Check Database**: Run `npx prisma db push`
3. **Check Tracking**: Open browser console, look for `[Analytics]` logs
4. **Check API**: Test endpoints directly in browser or Postman

### Tracking not working?

1. **Viewer ID**: Must be set (registration.id)
2. **Webinar ID**: Must be valid
3. **Browser**: Check console for errors
4. **Network**: Check Network tab for failed requests

### Performance issues?

1. **Add Indexes**: Already added on key fields
2. **Paginate**: Use LIMIT/OFFSET for large datasets
3. **Cache**: Consider Redis for frequently accessed analytics
4. **Background Jobs**: Move heavy calculations to queue

## 📚 Next Steps

1. **Customize Dashboard**: Build your own analytics UI
2. **Export Reports**: Add CSV/PDF export functionality
3. **Email Reports**: Schedule automated reports
4. **A/B Testing**: Compare different webinar variants
5. **Predictive Analytics**: ML models for conversion prediction

## 🎉 You're Ready!

The analytics system is live and tracking everything automatically. Just access the APIs and build your dashboards!

For questions or issues, check the logs and ensure:
- ✅ Prisma client is generated
- ✅ Database is migrated
- ✅ Tracking calls are successful (check browser console)
- ✅ API endpoints return data

Happy analyzing! 📊✨
