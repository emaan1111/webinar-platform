# Attendee Profile View - Complete Feature Documentation

## Overview
Comprehensive individual attendee profile page with detailed engagement analytics, timeline visualization, and complete activity history.

## Feature Complete ✅
- **API Endpoint**: `/api/attendees/[id]` - Returns complete profile data
- **Profile Page**: `/dashboard/attendees/[id]` - Full analytics dashboard
- **Navigation**: Click "View" icon (Eye) in attendees table

## What You Can See

### 1. **Basic Information Card**
- Name, Email, Phone
- Webinar Title
- Registration Date
- Country & Timezone
- Attendance Status (✓ Attended / ✗ Missed)

### 2. **Engagement Overview (4 Metrics)**
- **Total Watch Time**: Hours:Minutes:Seconds format
- **Engagement Score**: 0-100 percentage
- **Total Engagements**: Count of all interactions
- **Session Count**: Number of viewing sessions

### 3. **Engagement Timeline Graph**
Interactive timeline showing minute-by-minute activity:
- **🎥 Watch Activity**: Blue segments showing active viewing
- **💬 Chat Messages**: Yellow markers
- **❤️ Reactions**: Red markers  
- **🎯 CTA Clicks**: Green markers
- **X-Axis**: Minutes since webinar start (0-120)
- **Hover**: Shows exact time and activity type

### 4. **Activity Breakdown Tabs**

#### Chat Messages Tab
- Timestamp of each message
- Full message content
- Status badge (Approved/Pending/Rejected)
- AI-generated indicator (if applicable)
- Chronological order

#### Reactions Tab
- Reaction type (👍 like, ❤️ love, 👏 clap, etc.)
- Timestamp of reaction
- Video position when reacted
- Chronological order

#### CTA Clicks Tab
- Offer/Button name
- Click timestamp
- Video position when clicked
- Link to offer details
- Chronological order

#### Watch Sessions Tab
For each viewing session:
- Session number
- Joined timestamp (with timezone)
- Left timestamp (with timezone)
- Duration (e.g., "45 mins")
- Device type (Desktop/Mobile)
- Browser name
- Operating System

#### Referrals Tab (if applicable)
- Referred person's name & email
- Webinar they registered for
- Registration date
- Attendance status (✓ Yes / ✗ No)
- Purchase status (✓ Yes / ✗ No)
- Total referred count

### 5. **Purchase History**
(If attendee made purchases)
- Product/Offer name
- Amount paid
- Purchase timestamp
- Payment status
- Transaction details

## Technical Implementation

### API Response Structure
```typescript
{
  profile: {
    id, name, email, phone, country, timezone,
    registeredAt, attended, webinarTitle, status,
    totalWatchTime, engagementScore, totalEngagements, sessionCount
  },
  timeline: [
    { type: 'watch', minute: 5, duration: 120 },
    { type: 'chat', minute: 12, message: '...' },
    { type: 'reaction', minute: 15, emoji: '❤️' },
    { type: 'cta', minute: 20, offerName: '...' }
  ],
  sessions: [ {...joinedAt, leftAt, device, browser...} ],
  chatMessages: [ {...createdAt, message, status...} ],
  reactions: [ {...createdAt, emoji, position...} ],
  ctaClicks: [ {...clickedAt, offerName, position...} ],
  referrals: [ {...name, email, attended, purchased...} ],
  purchases: [ {...amount, createdAt, productName...} ]
}
```

### Component Files
1. **API**: `src/app/api/attendees/[id]/route.ts` (320+ lines)
2. **Page**: `src/app/dashboard/attendees/[id]/page.tsx` (850+ lines)
3. **Navigation**: Updated `src/app/dashboard/attendees/page.tsx`

### Key Features
- **Real-time Data**: Fetches fresh data from database
- **Responsive Design**: Mobile-friendly layout
- **Interactive Timeline**: Hover for details, visual engagement map
- **Timezone Support**: All timestamps show in attendee's timezone
- **Status Badges**: Color-coded indicators for quick scanning
- **Tab Navigation**: Organized activity sections
- **Back Button**: Easy navigation to attendees list

## Usage Examples

### Scenario 1: Post-Webinar Follow-up
1. Go to Attendees dashboard
2. Click View icon for specific attendee
3. Check engagement timeline - Did they watch key sections?
4. Review chat messages - Any questions or concerns?
5. Check CTA clicks - Interested in offers?
6. Tailor follow-up email based on engagement

### Scenario 2: Referral Program Management
1. Open profile of known referrer
2. Go to Referrals tab
3. See complete list of people they referred
4. Check attendance/purchase conversion rates
5. Reward top referrers

### Scenario 3: Technical Support
1. User reports "I couldn't watch"
2. Open their profile
3. Check Watch Sessions tab
4. See device/browser used, connection issues
5. Provide specific troubleshooting

## Column Migration Fix ✅

### Problem
Existing saved custom views in localStorage didn't include new columns like `scheduledAt` when they were added to the codebase.

### Solution
Added automatic migration logic that:
1. Loads saved views from localStorage
2. Compares with latest `defaultColumns`
3. Adds any missing columns to saved views
4. Preserves existing column settings
5. Saves migrated views back to localStorage

### Benefits
- New columns automatically appear in all existing custom views
- No manual reset required
- Backward compatible with old saved views
- Future-proof for any new columns added

## Deployment Status
- ✅ Code committed to GitHub (main branch)
- ⏳ Deploying to Railway production
- 🌐 Will be live at: https://emaanpowerclasses.com

## Next Steps
1. Test profile view with real attendee data
2. Verify engagement timeline displays correctly
3. Check all tabs load proper data
4. Confirm timezone formatting works
5. Test on mobile devices

## Related Features
- Attendees Dashboard (main list view)
- Referral Analytics System
- Chat Moderation Tools
- A/B Testing Metrics
- Purchase Tracking
