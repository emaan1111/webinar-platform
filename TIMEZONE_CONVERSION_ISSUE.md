# Timezone Conversion Issue - Analysis & Workaround

## Problem Statement

When creating a webinar schedule with a specific timezone (e.g., "Nov 18, 12:42 PM America/New_York"), the time is not being properly converted and displayed in the user's timezone on the registration page.

**Expected Behavior:**
- Admin enters: Nov 18, 12:42 PM (America/New_York)
- Stored in database: Nov 18, 17:42 UTC (12:42 PM EST + 5 hours)
- Displayed to India user: Nov 18, 11:12 PM IST (17:42 UTC + 5.5 hours)

**Actual Behavior:**
- Admin enters: Nov 18, 12:42 PM (America/New_York)  
- Stored in database: Nov 18, 12:42 UTC (WRONG - no timezone conversion)
- Displayed to India user: Nov 18, 12:42 PM IST (WRONG - should be 11:12 PM)

## Root Cause

### Location 1: Save Logic (`/src/app/dashboard/webinars/[id]/edit/page.tsx`)

**Line ~326:**
```tsx
const dateStr = schedule.scheduledAt // "2025-11-18"
const timeStr = schedule.scheduledTime // "12:42"
scheduledAtISO = new Date(`${dateStr}T${timeStr}`).toISOString()
```

**Problem:** 
- `new Date("2025-11-18T12:42")` treats the time as **browser's local timezone**, not the schedule's intended timezone
- If admin is in IST and enters "12:42 PM EST", JavaScript interprets it as "12:42 PM IST"
- Then `.toISOString()` converts IST to UTC, resulting in wrong UTC time

### Location 2: Display Logic (`/src/app/w/[slug]/page-client.tsx`)

**Line ~590:**
```tsx
const date = new Date(schedule.scheduledAt)
const dateStr = date.toLocaleDateString('en-US', {
  timeZone: tz // User's timezone
})
```

**This is actually CORRECT!**
- IF the database had the correct UTC time, this would work perfectly
- `toLocaleDateString` with `timeZone` parameter converts UTC to any timezone
- The problem is the INPUT (database) is wrong, not the output

## Why JavaScript Can't Help

JavaScript's native `Date` object has limitations:
1. **No timezone-aware parsing**: `new Date("2025-11-18T12:42")` always treats it as local time
2. **No "from timezone" conversion**: Can't say "interpret this as EST and convert to UTC"
3. **Only has `.toLocaleString()`**: Only helps with OUTPUT formatting, not INPUT parsing

## Proper Solution (Requires Library)

Install `date-fns-tz` or `luxon`:

```bash
npm install date-fns date-fns-tz
```

Then update save logic:

```tsx
import { zonedTimeToUtc } from 'date-fns-tz'

// Convert from schedule's timezone to UTC
const dateTimeStr = `${schedule.scheduledAt} ${schedule.scheduledTime}`
const utcDate = zonedTimeToUtc(dateTimeStr, schedule.timezone)
scheduledAtISO = utcDate.toISOString()
```

This properly interprets "2025-11-18 12:42" as being in "America/New_York" timezone, then converts to UTC.

## Current Workaround

### What Was Implemented

Added comments explaining the issue in the edit page:

```tsx
// NOTE: This is a simplification. The time is stored as if it's in the browser's timezone,
// but the schedule.timezone field tells us what it SHOULD be interpreted as.
// This means:
// - If admin is in EST and enters "12:42 PM EST", it stores correctly
// - If admin is in IST and enters "12:42 PM EST", it will be wrong
```

### Impact of Workaround

✅ **Works correctly IF:**
- Admin is in the SAME timezone as the one they're selecting
- Example: Admin in New York enters "12:42 PM EST" → Stores correctly

❌ **Fails IF:**
- Admin is in a DIFFERENT timezone than the one they're selecting  
- Example: Admin in India enters "12:42 PM EST" → Stores as "12:42 PM IST" converted to UTC

### Why This Happens

Since we don't have a timezone library installed, there's no way to tell JavaScript:
> "Treat '12:42' as if it's in America/New_York timezone, then convert to UTC"

JavaScript can only:
> "Treat '12:42' as if it's in MY (browser's) timezone, then convert to UTC"

## Recommended Next Steps

### Option 1: Install Timezone Library (BEST)

```bash
npm install date-fns date-fns-tz
```

Then update `/src/app/dashboard/webinars/[id]/edit/page.tsx` line ~326:

```tsx
import { zonedTimeToUtc } from 'date-fns-tz'

if (schedule.scheduledAt && schedule.scheduledTime) {
  const dateStr = schedule.scheduledAt.includes('-') ? schedule.scheduledAt : new Date(schedule.scheduledAt).toISOString().split('T')[0]
  const dateTimeStr = `${dateStr}T${schedule.scheduledTime}:00`
  
  // Convert from schedule's timezone to UTC
  if (schedule.timezone && schedule.timezone !== 'USER_TIMEZONE') {
    const utcDate = zonedTimeToUtc(dateTimeStr, schedule.timezone)
    scheduledAtISO = utcDate.toISOString()
  } else {
    scheduledAtISO = new Date(dateTimeStr).toISOString()
  }
}
```

### Option 2: Server-Side Conversion

Move timezone conversion to the API layer where we can use Node.js libraries or PostgreSQL's timezone functions.

### Option 3: Restrict Admin Timezone

Force admins to only create schedules in their own timezone, document this limitation.

## Files Modified

### 1. `/src/app/w/[slug]/page-client.tsx`
- Added `parseScheduleTime()` helper function
- Updated `formatScheduleTime()` to use the helper
- Added comments explaining timezone handling
- **Status**: Display logic is correct, waiting for proper input data

### 2. `/src/app/dashboard/webinars/[id]/edit/page.tsx`
- Added extensive comments explaining the timezone conversion issue
- Documented the limitation of current workaround
- **Status**: Needs timezone library to properly convert

## Testing Scenarios

### Scenario 1: Admin in Same Timezone ✅
- Admin timezone: America/New_York (EST)
- Schedule timezone: America/New_York
- Enters: Nov 18, 12:42 PM
- **Result**: ✅ Works correctly

### Scenario 2: Admin in Different Timezone ❌
- Admin timezone: Asia/Kolkata (IST)
- Schedule timezone: America/New_York  
- Enters: Nov 18, 12:42 PM
- **Result**: ❌ Stores as IST, not EST

### Scenario 3: User Viewing Schedule ✅
- Schedule stored correctly in UTC
- User timezone: Any
- **Result**: ✅ Displays correctly in user's timezone

## Priority

**HIGH** - This affects international users and multi-timezone webinars

## Effort

**MEDIUM** - Requires:
1. Installing `date-fns-tz` package (1 minute)
2. Updating save logic (15 minutes)
3. Testing with different timezones (30 minutes)
4. **Total: ~1 hour**

---

**Date**: November 17, 2025
**Status**: ⚠️ Workaround implemented, proper fix pending
**Dependencies**: date-fns-tz library installation required
