# Comprehensive Attendee Analytics System

## Overview
A complete real-time tracking and analytics system for webinar attendees, capturing every interaction from registration to conversion.

## 🎯 Features Implemented

### 1. Real-Time Session Tracking
- **Join/Leave Tracking**: Automatically tracks when users enter and exit the webinar
- **Watch Time Monitoring**: Records total seconds watched, updated every 5-10 seconds
- **Video Position Tracking**: Stores last known position in video for drop-off analysis
- **Device & Browser Detection**: Captures device type (mobile/desktop) and browser info
- **Tab Visibility Handling**: Pauses tracking when user switches tabs

#### API Endpoint
```
POST /api/tracking/session
```
Actions: `join`, `update`, `leave`

### 2. Video Watch Events
Tracks critical video playback moments:
- **Play Events**: When user starts watching
- **Pause Events**: When user pauses
- **Seek Events**: When user skips forward/backward
- **Ended Events**: When user watches to completion
- **Left Events**: When user leaves mid-video

#### API Endpoint
```
POST /api/tracking/video
```

### 3. Engagement Tracking
Captures all user interactions:
- **Chat Messages**: Tracks message sending with length and timestamp
- **Reactions**: Records reaction type (heart, clap, thumbs up) and timing
- **Questions**: Logs question submissions
- **Polls**: Tracks poll responses
- **Offer Views**: When offer becomes visible
- **Offer Clicks**: When user clicks CTA button

#### API Endpoint
```
POST /api/tracking/engagement
```

### 4. Page Visit Funnel
Tracks user journey across pages:
- **Registration Page**: Entry, time spent, exit
- **Countdown Page**: Waiting time before webinar
- **Webinar Page**: Live room attendance
- **Thank You Page**: Post-webinar engagement
- **Replay Page**: Recorded content views

Captures:
- Time spent on each page
- Referrer/UTM parameters
- Device and browser info
- Geographic location (country)

#### API Endpoint
```
POST /api/tracking/page
```
Actions: `enter`, `leave`

### 5. Offer Analytics
Complete offer interaction tracking:
- **Saw Offer**: When offer appears on screen
- **Clicked Offer**: When user clicks CTA
- **Converted**: When purchase/signup completes
- **Video Position**: Where in video interaction occurred

#### API Endpoint
```
POST /api/tracking/offer
```
Actions: `view`, `click`, `convert`

---

## 📊 Analytics Dashboard API

### Webinar-Level Analytics
```
GET /api/webinars/{webinarId}/analytics
```

#### Response Metrics

**Overview:**
- Total Registrations
- Total Attended
- Attendance Rate (%)
- No-Shows
- No-Show Rate (%)
- Average Watch Time
- Completion Rate (%)

**Offer Performance:**
- Saw Offer Count
- Clicked Offer Count
- Converted Count
- Offer View Rate (%)
- Offer Click Rate (%)
- Conversion Rate (%)

**Join Timing Analysis:**
- On Time (0-1 min): Count
- Slightly Late (1-5 min): Count
- Late (5+ min): Count

**Drop-Off Analysis:**
- Drop-offs by 2-minute intervals
- Visualizes where viewers leave

**Engagement Metrics:**
- Total Engagements
- Chat Messages Count
- Reactions Count
- Questions Count
- Offer Clicks Count
- Engagement by minute (time-series data)

**Funnel Analysis:**
- Registration Page Visits
- Countdown Page Visits
- Webinar Page Visits
- Thank You Page Visits
- Average time on each page

---

## 👤 Individual Attendee Profiles

### Detailed Profile API
```
GET /api/attendees/{registrationId}/profile
```

#### Response Data

**Registration Info:**
- Name, Email, Phone
- Timezone, Country
- Registration Timestamp

**Webinar Info:**
- Webinar Title
- Slug
- Video Duration

**Metrics:**
- Attended (Yes/No)
- Total Watch Time (seconds)
- Max Video Position Reached
- Watch Percentage (%)
- Engagement Count
- **Engagement Score** (0-100 scale)
- Completed (Watched to End)

**Offer Interactions:**
- Saw Offer
- Clicked Offer
- Converted
- Offer Title

**Journey Timeline:**
Complete chronological history:
1. Registration
2. Page Visits (with time spent)
3. Joined Webinar
4. All Engagements (chat, reactions, questions)
5. Offer Interactions
6. Video Completion
7. Left Webinar

---

## 🎯 Engagement Score Calculation

Scoring algorithm (0-100 points):

| Activity | Points |
|----------|--------|
| Attended Webinar | 20 |
| Watch Time | 0-30 (proportional) |
| Engagements | 5 per engagement (max 25) |
| Saw Offer | 10 |
| Clicked Offer | 10 |
| Completed | 5 |

**Total Possible: 100 points**

---

## 📈 Key Metrics Tracked

### Conversion Funnel
1. **Registration Rate**: Visitors → Registrations
2. **Show-Up Rate**: Registrations → Attended
3. **Engagement Rate**: Attended → Engaged
4. **Offer View Rate**: Attended → Saw Offer
5. **Offer Click Rate**: Saw Offer → Clicked
6. **Conversion Rate**: Clicked → Converted
7. **Completion Rate**: Attended → Watched to End

### Behavioral Insights
- **Join Time Distribution**: When are people joining?
- **Drop-Off Points**: Where do people leave?
- **Peak Engagement Times**: When are viewers most active?
- **Device Preferences**: Mobile vs Desktop usage
- **Geographic Distribution**: Where are attendees from?

### Content Performance
- **Most Engaging Moments**: Highest reaction counts by minute
- **Most Discussed Topics**: Chat activity by video timestamp
- **Optimal Offer Timing**: When do offers get best response?
- **Average Watch Duration**: How long do people stay?

---

## 💾 Database Schema

### Core Tables

**AttendeeSession**
- Tracks individual webinar sessions
- Records join/leave times, watch duration, video position
- Links to registrations and engagements

**VideoWatchEvent**
- Logs play, pause, seek, ended events
- Stores video timestamp for drop-off analysis

**EngagementEvent**
- Captures all interaction types
- Stores event data as JSON for flexibility
- Links to video timestamp

**PageVisit**
- Tracks page-by-page navigation
- Records time spent, referrer, UTM params
- Pre-registration tracking via visitorId cookie

**OfferAnalytics**
- Dedicated offer performance tracking
- Records view, click, conversion with timestamps
- Links to specific offers and registrations

---

## 🔧 Implementation Details

### Tracking Integration
The `WebinarTracker` class handles all tracking automatically:

```typescript
// Initialize in webinar room
const tracker = new WebinarTracker(registrationId, webinarId, scheduleId);

// Start session
await tracker.startSession('mobile');

// Track video events
await tracker.trackVideoEvent('play', videoPosition);

// Track engagements
await tracker.trackEngagement('chat', videoPosition, { messageLength: 50 });

// Track offers
await tracker.trackOffer('click', offerTitle, offerUrl, videoPosition);

// End session (automatic on unmount)
await tracker.endSession();
```

### Auto-Tracking Features
- **Session updates**: Every 10 seconds
- **Watch time**: Calculated continuously
- **Page transitions**: Automatic enter/leave tracking
- **Tab visibility**: Pauses tracking when hidden
- **Cleanup**: Ends session on page unload

---

## 📊 Analytics Use Cases

### For Webinar Hosts
1. **Optimize Content**: See drop-off points, improve those sections
2. **Perfect Timing**: When to show offers based on engagement
3. **Improve Conversions**: Analyze high-converting attendee behaviors
4. **Refine Schedule**: Best times for live webinars based on attendance

### For Marketers
1. **Attribution**: Track UTM parameters through entire funnel
2. **ROI Measurement**: Conversion rates by traffic source
3. **Audience Insights**: Device, location, behavior patterns
4. **A/B Testing**: Compare registration page variants

### For Product Teams
1. **User Experience**: Identify friction points in funnel
2. **Feature Usage**: What features drive engagement?
3. **Retention**: Who stays vs who leaves early?
4. **Personalization**: Segment by behavior for targeted follow-up

---

## 🚀 Future Enhancements

### Planned Features
- [ ] Automated email reports (daily/weekly summaries)
- [ ] Cohort analysis by registration date
- [ ] Predictive engagement scoring
- [ ] Real-time dashboard updates (WebSocket)
- [ ] Export to CSV/PDF reports
- [ ] Integration with CRM systems
- [ ] Heatmaps for video engagement
- [ ] AI-powered insights and recommendations

---

## 📝 Notes

### Data Privacy
- GDPR compliant tracking
- Consent recorded in registration
- PII protected with proper indexes
- Cascade deletes maintain referential integrity

### Performance
- Batch updates reduce API calls
- Indexes on frequently queried fields
- Efficient pagination for large datasets
- Background processing for heavy analytics

### Reliability
- Error handling on all tracking calls
- Graceful degradation if tracking fails
- Retry logic for transient failures
- Session recovery on page refresh

---

## 🎉 Summary

This comprehensive analytics system provides:

✅ **Real-time tracking** of every attendee action  
✅ **Detailed individual profiles** with full journey history  
✅ **Aggregate analytics** for webinar performance  
✅ **Conversion funnel** analysis  
✅ **Engagement scoring** algorithm  
✅ **Drop-off analysis** for content optimization  
✅ **Offer performance** tracking  
✅ **Device and browser** insights  
✅ **Geographic distribution** data  
✅ **Time-based analysis** (when people join, engage, leave)  

All data is automatically collected without requiring any manual effort from attendees or hosts!
