# Webinar Reports System - Complete Documentation

## Overview
The Reports system provides comprehensive analytics combining Facebook Ads performance with webinar metrics, allowing you to track ROI and performance across your entire funnel.

## Features

### 📊 Metrics Tracked

#### Facebook Ads Metrics (from Facebook Ads API)
- **Ad Spend**: Total amount spent on Facebook ads
- **Impressions**: How many times your ads were shown
- **Clicks**: Number of clicks on your ads
- **CTR**: Click-through rate (%)

#### Webinar Funnel Metrics (from database)
- **Visitors**: Unique visitors to registration page
- **Registrations**: Number of people who registered
- **Live Attendees**: People who attended the live webinar
- **Engaged Users**: Attendees who watched for X+ minutes (configurable)
- **Sales**: Number of purchases made

#### Calculated Percentages
- **% Registrations**: (Registrations / Visitors) × 100
- **% Attendance**: (Live Attendees / Registrations) × 100
- **% Engaged / Visitor**: (Engaged / Visitors) × 100
- **% Engaged / Registered**: (Engaged / Registrations) × 100
- **% Engagement Live Webinar**: (Engaged / Live Attendees) × 100
- **Cost per Reg**: Ad Spend / Registrations

## Usage

### Accessing Reports
Navigate to **Dashboard → Reports** in the main navigation menu.

### Date Range Selection
1. Use the date picker to select "From" and "To" dates
2. Quick filters available:
   - Today
   - Last 7 Days
   - Last 30 Days
3. Default: Last 30 days

### Engagement Threshold
1. Click "Settings" button
2. Adjust engagement threshold (in minutes)
3. Default: 30 minutes
4. Quick presets: 15m, 30m, 45m, 60m

This determines how long someone must watch to be considered "engaged".

### Exporting Data
Click "Export CSV" to download all report data in CSV format for external analysis.

## API Endpoints

### GET /api/reports
Fetches comprehensive report data for a date range.

**Query Parameters:**
- `from` (required): Start date (YYYY-MM-DD)
- `to` (required): End date (YYYY-MM-DD)
- `engagementMinutes` (optional): Engagement threshold in minutes (default: 30)

**Example:**
```bash
GET /api/reports?from=2025-11-01&to=2025-11-18&engagementMinutes=30
```

**Response:**
```json
{
  "success": true,
  "reports": [
    {
      "date": "2025-11-18",
      "fbResults": {
        "spend": 200.19,
        "impressions": 18827,
        "clicks": 1130,
        "ctr": 6.00
      },
      "visitors": 500,
      "registrations": 150,
      "liveAttendees": 100,
      "engaged": 75,
      "sales": 25,
      "registrationRate": 30.0,
      "attendanceRate": 66.67,
      "engagedPerVisitor": 15.0,
      "engagedPerRegistered": 50.0,
      "engagementRate": 75.0,
      "costPerReg": 1.33
    }
  ],
  "dateRange": { "from": "2025-11-01", "to": "2025-11-18" },
  "engagementMinutes": 30,
  "timestamp": "2025-11-18T10:00:00.000Z"
}
```

## Data Sources

### Facebook Ads Data
- **Source**: Facebook Marketing API v22.0
- **Endpoint**: `/${adAccountId}/insights`
- **Breakdown**: Daily (`time_increment=1`)
- **Fields**: spend, impressions, clicks, ctr
- **Authentication**: FB_ACCESS_TOKEN from .env

### Visitor Data
- **Source**: PageVisit table in database
- **Criteria**: page = 'registration'
- **Count**: Unique visitorId per day

### Registration Data
- **Source**: Registration table
- **Date field**: registeredAt
- **Includes**: All registrations for the date

### Attendance Data
- **Source**: Registration.attended field
- **Criteria**: attended = true

### Engagement Data
- **Source**: AttendeeSession table
- **Calculation**: Sum of session.duration per registration
- **Criteria**: Total watch time >= engagement threshold AND attended = true

### Sales Data
- **Source**: WebinarSale table
- **Count**: Number of sales records per registration

## Database Schema

### Key Tables Used

**PageVisit** - Tracks visitor sessions
```prisma
model PageVisit {
  id        String   @id
  visitorId String   // UUID cookie
  page      String   // "registration", "countdown", etc.
  visitedAt DateTime
}
```

**Registration** - Core registration data
```prisma
model Registration {
  id           String   @id
  registeredAt DateTime
  attended     Boolean
  sessions     AttendeeSession[]
  sales        WebinarSale[]
}
```

**AttendeeSession** - Tracks watch time
```prisma
model AttendeeSession {
  id             String   @id
  registrationId String
  duration       Int      // seconds watched
  startedAt      DateTime
  endedAt        DateTime
}
```

**WebinarSale** - Tracks purchases
```prisma
model WebinarSale {
  id             String   @id
  registrationId String
  amount         Decimal
  purchasedAt    DateTime
}
```

## Configuration

### Environment Variables
```env
# Facebook Ads API (required for FB metrics)
FB_ACCESS_TOKEN=your_token_here
FB_AD_ACCOUNT_ID=act_280500016006811

# Database (required for webinar metrics)
DATABASE_URL=your_database_url
```

### Engagement Threshold
Can be configured per report query or set a default in the UI. Common thresholds:
- **15 minutes**: Light engagement
- **30 minutes**: Standard engagement (default)
- **45 minutes**: Moderate engagement
- **60 minutes**: High engagement

## UI Components

### Summary Cards
Display totals across date range:
- Total Ad Spend
- Total Registrations
- Average Cost/Reg
- Total Sales

### Date Range Filter
- Date pickers for custom ranges
- Quick filter buttons
- Default to last 30 days

### Settings Panel
- Engagement threshold configuration
- Quick preset buttons (15m, 30m, 45m, 60m)
- Collapsible panel

### Reports Table
- Scrollable horizontal layout
- Sticky date column
- Color-coded percentage cells:
  - Green: >= 50%
  - Yellow: 25-49%
  - Red: < 25%
- Totals/averages row at bottom

### Export Functionality
- CSV download
- Includes all columns
- Filename: `webinar-reports-{from}-to-{to}.csv`

## Performance Considerations

### Query Optimization
- Uses date indexes on tables
- Distinct visitor counts
- Session aggregation per registration
- One day at a time iteration

### Facebook API Rate Limits
- Daily insights: ~200 requests/hour
- Uses `time_increment=1` for daily breakdown
- Single request covers entire date range

### Caching Recommendations
- Cache FB data for 1 hour (rarely changes)
- Cache webinar metrics for 5 minutes
- Use Redis or Next.js cache

## Future Enhancements

### Planned Features
1. **Historical Trend Charts**: Line graphs showing metrics over time
2. **Campaign Breakdown**: Group by campaign/ad set
3. **Cohort Analysis**: Track user behavior by registration date
4. **Email Reports**: Scheduled email delivery of reports
5. **Goals & Benchmarks**: Set targets and track progress
6. **ROI Calculator**: Automated profit calculations
7. **Comparative Analysis**: Compare periods (week over week, etc.)
8. **Real-time Dashboard**: Live updating metrics

### Database Additions Needed
```prisma
// Store historical daily snapshots for faster queries
model DailyReportSnapshot {
  id              String   @id
  date            DateTime @unique
  spend           Decimal
  visitors        Int
  registrations   Int
  liveAttendees   Int
  engaged         Int
  sales           Int
  // ... all calculated metrics
  createdAt       DateTime @default(now())
}
```

## Troubleshooting

### No Data Showing
1. Check date range is valid
2. Verify FB_ACCESS_TOKEN is set and valid
3. Ensure PageVisit tracking is implemented
4. Check for registrations in date range

### Incorrect Visitor Counts
- Verify PageVisit records are being created
- Check visitorId cookie is set
- Ensure page='registration' filter is correct

### Engagement Metrics Zero
- Confirm AttendeeSession records exist
- Check duration field is populated
- Verify attended=true for registrations
- Adjust engagement threshold lower

### Facebook API Errors
- Error 190: Token expired → regenerate in Business Manager
- Error 200: Permissions → ensure ads_read permission
- Error 2635: API version → using v22.0 (latest)

## Files Created

### UI Components
- `/src/app/dashboard/reports/page.tsx` - Main reports page
- Updated `/src/components/dashboard/DashboardLayout.tsx` - Added navigation

### API Routes
- `/src/app/api/reports/route.ts` - Reports data endpoint
- `/src/app/api/ads/metrics/route.ts` - Facebook Ads metrics
- `/src/app/api/ads/sync/route.ts` - Manual sync endpoint

### Documentation
- `WEBINAR_REPORTS_COMPLETE.md` - This file

## Testing

### Manual Testing Checklist
- [ ] Access /dashboard/reports
- [ ] Change date range
- [ ] Adjust engagement threshold
- [ ] View summary cards
- [ ] Scroll report table
- [ ] Export CSV
- [ ] Verify calculations
- [ ] Test with no data
- [ ] Test Facebook API integration

### Sample Test Data
```sql
-- Insert test registrations
INSERT INTO registrations (id, webinarId, name, email, registeredAt, attended)
VALUES 
  ('test1', 'webinar1', 'Test User 1', 'test1@example.com', '2025-11-18 10:00:00', true),
  ('test2', 'webinar1', 'Test User 2', 'test2@example.com', '2025-11-18 11:00:00', true);

-- Insert test sessions
INSERT INTO attendee_sessions (id, registrationId, duration, startedAt, endedAt)
VALUES
  ('session1', 'test1', 1800, '2025-11-18 14:00:00', '2025-11-18 14:30:00'),
  ('session2', 'test2', 3600, '2025-11-18 14:00:00', '2025-11-18 15:00:00');
```

## Support

For issues or questions:
1. Check error logs in browser console
2. Verify API responses in Network tab
3. Check server logs for Prisma queries
4. Review Facebook Business Manager for API errors

---

**Status**: ✅ Complete and Ready to Use
**Version**: 1.0.0
**Last Updated**: November 18, 2025
