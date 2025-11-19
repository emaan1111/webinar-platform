# Reports Enhancement Summary

## Changes Made

### 1. API Route (`/src/app/api/reports/route.ts`)

**Engagement Tracking - COMPLETE ✅**
- Separate tracking for `engagedLive`, `engagedReplay`, `engagedTotal`
- Engagement based on watch time threshold (default 30 minutes)
- Works for both live and replay sessions

**Sales Tracking - COMPLETE ✅**
- Separate tracking for `salesLive`, `salesReplay`, `salesTotal`
- Sales attributed based on whether user attended live or watched replay

**Percentage Calculations - COMPLETE ✅**
```typescript
// Attendance rates
- attendanceRate (total)
- liveAttendanceRate
- replayAttendanceRate

// Engagement rates
- engagedPerVisitor (total, live, replay)
- engagedPerRegistered (total, live, replay)
- engagementRate (total, live, replay)
```

### 2. Frontend Updates Needed

**ReportData Type - COMPLETE ✅**
Updated to include all new fields:
- engagedTotal, engagedLive, engagedReplay
- salesTotal, salesLive, salesReplay
- All percentage variations

**Issues Found:**
The frontend file `/src/app/dashboard/reports/page.tsx` got corrupted during edits around line 627-664.

### 3. Required Frontend Fixes

#### A. Fix Corrupted Section
Around line 627-664, there's duplicate/broken code that needs to be cleaned up.

#### B. Update Table Headers
Need columns for:
1. Engaged (Total)
2. Engaged (Live)
3. Engaged (Replay)
4. Sales (Total)
5. Sales (Live)
6. Sales (Replay)
7. % Eng/Visitor variations
8. % Eng/Reg variations
9. % Attendance variations

#### C. Column Selector Feature - IN PROGRESS
Added state for column selection:
```typescript
const [showColumnSelector, setShowColumnSelector] = useState(false)
const [selectedColumns, setSelectedColumns] = useState<string[]>([...])
```

Defined available columns by group:
- Basic (Date, Visitors, Registrations)
- Facebook (Spend, Impressions, Clicks, CTR, CPM, CPC)
- Attendance (Total, Live, Replay + rates)
- Engagement (Total, Live, Replay + all rate variations)
- Sales (Total, Live, Replay)
- Costs (per Reg, per Attendee, per Sale)
- Revenue (Revenue, Profit, ROI)

### 4. Column Selector UI - TODO

Need to add:
1. Button to toggle column selector modal
2. Modal/dropdown with grouped checkboxes
3. Select/deselect all functionality
4. Save custom views (localStorage)
5. Dynamic table rendering based on selected columns

### 5. Facebook API Split Request - COMPLETE ✅

For date ranges > 7 days:
- Makes 2 requests (historical + recent 7 days)
- Ensures complete data for all dates
- Solves missing recent dates issue

## Current Status

### ✅ Completed
1. API tracking for engagement (total, live, replay)
2. API tracking for sales (total, live, replay)
3. API percentage calculations for all variations
4. Facebook API split request logic
5. ReportData type definition with all fields
6. Column selector state and configuration

### ⚠️ Issues
1. Frontend file corrupted around line 627-664
2. Table needs complete rebuild with new columns
3. Column selector UI not yet implemented

### 📋 Next Steps

1. **Fix Corrupted File** - Clean up duplicate code sections
2. **Rebuild Table Structure** - Add all new columns
3. **Implement Column Selector UI** - Modal with checkboxes
4. **Add Render Logic** - Dynamically show/hide columns
5. **Test All Calculations** - Verify engagement/sales split correctly

## Answer to Your Questions

### Q: How are you calculating sales?
**A:** Sales are counted from `reg.sales.length` for each registration. They're split into:
- `salesLive`: If user `attended` (live webinar)
- `salesReplay`: If user has sessions but didn't attend live
- `salesTotal`: Sum of both

### Q: Does engagement include both replay and live?
**A:** Yes! Engagement is calculated based on watch time:
- If `watchTimeMinutes >= engagementMinutes` (default 30), user is engaged
- Tracks separately: `engagedLive`, `engagedReplay`, `engagedTotal`

### Q: Can we have separate cols for engagement (total, live, replay)?
**A:** Yes! API already provides:
- `engagedTotal`, `engagedLive`, `engagedReplay`
- Frontend needs table rebuild to show these columns

### Q: Same with % Attend and other percentages?
**A:** Yes! API calculates:
- `attendanceRate`, `liveAttendanceRate`, `replayAttendanceRate`
- `engagedPerVisitor` (total, live, replay variations)
- `engagedPerRegistered` (total, live, replay variations)
- `engagementRate` (total, live, replay variations)

### Q: Replay sales (sales of someone who watched replay)?
**A:** Yes! `salesReplay` specifically tracks sales from users who:
- Did NOT attend live (`reg.attended === false`)
- BUT have replay sessions (`reg.sessions.length > 0`)
- AND made purchases (`reg.sales.length > 0`)

## File Locations

### Modified Files
- ✅ `/src/app/api/reports/route.ts` - Complete with all calculations
- ⚠️ `/src/app/dashboard/reports/page.tsx` - Needs repair and completion

### Documentation
- `FACEBOOK_ADS_FIX_COMPLETE.md` - Facebook API split request
- `ATTENDANCE_COLUMNS_UPDATE.md` - Attendance tracking
- This file - Engagement/Sales enhancement

## Recovery Plan

Since the frontend file is corrupted, recommend:

1. **Option A:** Restore from git, re-apply changes carefully
2. **Option B:** I'll provide complete working sections to replace
3. **Option C:** Manual fix of corrupted sections line-by-line

Which approach would you prefer?
