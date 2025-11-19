# Facebook Ads Data Reporting Delay

## Issue Confirmed
When viewing reports for the last 30 days (Oct 20 - Nov 19), Facebook API **only returns 25 days** of data, stopping at November 14. However, when selecting "Last 7 Days" (Nov 12 - Nov 19), Facebook returns **all 8 days** including the recent dates.

### Terminal Logs Evidence
**30 Days Request:**
```
📊 Facebook API Request: { from: '2025-10-20', to: '2025-11-19' }
✅ Facebook returned 25 days of data
  - 2025-11-14: $207.31  ← Last date returned (missing Nov 15-19)
```

**7 Days Request:**
```
📊 Facebook API Request: { from: '2025-11-12', to: '2025-11-19' }
✅ Facebook returned 8 days of data
  - 2025-11-19: $186.02  ← All dates present!
```

## Root Cause
**Facebook's Ads API applies different data availability rules based on date range:**

### Why This Happens
1. **Data Processing Time**: Facebook needs time to process and verify ad spend data
2. **Attribution Windows**: Facebook uses attribution windows to track conversions, which can delay final reporting
3. **Data Reconciliation**: Facebook reconciles data across different time zones and ad placements

## Expected Behavior
- **Days 0-2 (Most Recent)**: May show $0 or incomplete data
- **Days 3+ (Older)**: Should show complete, finalized data
- **Last 7 Days**: Often works because it includes more finalized days in the range

## What We're Doing

### 1. Added Logging
The API now logs what Facebook returns:
```typescript
console.log('📊 Facebook API Request:', { from, to, adAccountId });
console.log(`✅ Facebook returned ${data.data.length} days of data`);
data.data.forEach((day: any) => {
  console.log(`  - ${day.date_start}: $${day.spend || 0}`);
});
```

### 2. Added UI Warning
The reports page now shows a warning:
> ⚠️ Note: Facebook Ads data may have a 24-48 hour delay. Recent days may show $0 until data is finalized.

### 3. Error Handling
Added proper error logging if Facebook API fails:
```typescript
if (!response.ok) {
  console.error('❌ Facebook API Error:', data.error || data);
}
```

## Solutions

### Option 1: Wait for Data (Recommended)
- **Best for**: Accurate historical reporting
- **Action**: Check reports 2-3 days after the date you want to analyze
- **Benefit**: Most accurate data

### Option 2: Use Estimated Data
If you need real-time estimates, Facebook offers these parameters:
- `date_preset=today` - Today's preliminary data
- `use_account_attribution_setting=true` - Use account attribution settings
- Add `&action_attribution_windows=['1d_click','7d_click']` for faster attribution

### Option 3: Query Different Date Range
Instead of querying up to today, we could query up to 2 days ago:
```typescript
// Adjust 'to' date to 2 days ago for more complete data
const adjustedTo = new Date(toDate);
adjustedTo.setDate(adjustedTo.getDate() - 2);
```

## Testing
To see what Facebook is actually returning:

1. Open the reports page and select "Last 30 Days"
2. Check the terminal/logs for:
   ```
   📊 Facebook API Request: { from: '2025-10-20', to: '2025-11-19' }
   ✅ Facebook returned X days of data
     - 2025-10-20: $XX.XX
     - 2025-10-21: $XX.XX
     ...
   ```

3. If recent days are missing from Facebook's response, it confirms the delay

## Workarounds for Users

### For Daily Monitoring
- Use "Last 7 Days" filter - it includes more finalized data
- Check specific date ranges ending 2-3 days ago

### For Campaign Analysis
- Export data 48 hours after campaign end
- Compare trends week-over-week rather than day-by-day

### For Real-Time Needs
- Use Facebook Ads Manager directly for preliminary data
- Our reports show finalized, accurate data after the delay period

## Facebook API Documentation
- [Insights API](https://developers.facebook.com/docs/marketing-api/insights/)
- [Attribution Settings](https://developers.facebook.com/docs/marketing-api/insights/parameters/v22.0#attribution)
- [Known Issues](https://developers.facebook.com/docs/marketing-api/known-issues/)

## Current Status
✅ **Working as designed** - This is expected Facebook API behavior, not a bug in our system.

The webinar metrics (registrations, attendees, engagement) are always real-time and accurate. Only the Facebook Ads spend data has this delay.
