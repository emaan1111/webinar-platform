# Just-In-Time Rounding Feature Fix

## Issue
The `roundJITTo15Minutes` option was not taking effect even though it was:
- ✅ Stored in the database
- ✅ Editable in the webinar form
- ✅ Used in the client-side logic

## Root Cause
The server-side page component (`/src/app/w/[slug]/page.tsx`) was fetching `roundJITTo15Minutes` from the database but **not passing it** to the client component in the `webinarData` object.

### Before (Line 187-200)
```typescript
const webinarData = {
  id: webinar.id,
  slug: webinar.slug,
  title: webinar.title,
  description: webinar.description,
  duration: webinar.duration,
  schedules: filteredSchedules,
  maxSchedulesToShow: webinar.maxSchedulesToShow,
  videoUrl,
  vimeoVideoId,
  offer: activeOffer,
  enableABTesting: webinar.enableABTesting,
  testGroup,
};
```

### After (Fixed)
```typescript
const webinarData = {
  id: webinar.id,
  slug: webinar.slug,
  title: webinar.title,
  description: webinar.description,
  duration: webinar.duration,
  schedules: filteredSchedules,
  maxSchedulesToShow: webinar.maxSchedulesToShow,
  roundJITTo15Minutes: webinar.roundJITTo15Minutes, // ✅ NOW PASSED TO CLIENT
  videoUrl,
  vimeoVideoId,
  offer: activeOffer,
  enableABTesting: webinar.enableABTesting,
  testGroup,
};
```

## How It Works

### 1. Database Schema
```prisma
model Webinar {
  // ...
  roundJITTo15Minutes    Boolean @default(true) // Round Just-In-Time schedules to nearest 15-minute interval
}
```

### 2. Admin UI (Edit Webinar)
Location: `/src/app/dashboard/webinars/[id]/edit/page.tsx`

```tsx
<label className="flex items-center space-x-2">
  <input
    type="checkbox"
    name="roundJITTo15Minutes"
    checked={formData.roundJITTo15Minutes}
    onChange={handleInputChange}
  />
  <span className="text-sm text-gray-700">
    Round Just-In-Time schedules to nearest 15 minutes
  </span>
</label>
```

### 3. Client-Side Logic
Location: `/src/app/w/[slug]/page-client.tsx`

The client component uses this setting in multiple places:

#### A. Schedule Display (Lines 1324-1331)
```typescript
// Calculate JIT time: current time + minutes from registration
const jitTime = new Date()
jitTime.setMinutes(jitTime.getMinutes() + (schedule.minutesFromReg || 5))
const shouldRound = webinar.roundJITTo15Minutes !== false; 
const finalJitTime = shouldRound ? roundToNearest15Minutes(jitTime) : jitTime
```

#### B. Countdown Display (Lines 773-779)
```typescript
if (schedule.scheduleType === 'justInTime') {
  const now = new Date()
  const futureTime = new Date(now.getTime() + (schedule.minutesFromReg || 5) * 60000)
  
  const shouldRound = webinar?.roundJITTo15Minutes !== false // Default to true
  const finalTime = shouldRound ? roundToNearest15Minutes(futureTime) : futureTime
```

#### C. Registration Submission (Lines 991-997)
```typescript
} else if (selectedSchedule!.scheduleType === 'justInTime') {
  // Just-in-time - calculate from now and optionally round to nearest 15 minutes
  const now = new Date()
  const calculatedTime = new Date(now.getTime() + (selectedSchedule!.minutesFromReg || 5) * 60000)
  const shouldRound = webinar?.roundJITTo15Minutes !== false // Default to true
  registrationData.scheduledStartTime = shouldRound
    ? roundToNearest15Minutes(calculatedTime).toISOString()
    : calculatedTime.toISOString()
```

### 4. Rounding Function
Location: `/src/lib/webinarSchedule.ts`

```typescript
export function roundToNearest15Minutes(date: Date): Date {
  const ms = date.getTime()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()
  const milliseconds = date.getMilliseconds()
  
  // Round up to next 15-minute mark
  const roundedMinutes = Math.ceil(minutes / 15) * 15
  
  const result = new Date(ms)
  result.setMinutes(roundedMinutes)
  result.setSeconds(0)
  result.setMilliseconds(0)
  
  return result
}
```

## Testing

### Test Case 1: Rounding Enabled (Default)
1. Create/edit webinar
2. Enable "Round Just-In-Time schedules to nearest 15 minutes" ✅
3. Add JIT schedule (e.g., "5 minutes from registration")
4. Current time: 2:07 PM
5. **Expected**: Next available time shown as 2:15 PM (rounded up)
6. **Result**: ✅ Working correctly

### Test Case 2: Rounding Disabled
1. Create/edit webinar
2. Disable "Round Just-In-Time schedules to nearest 15 minutes" ❌
3. Add JIT schedule (e.g., "5 minutes from registration")
4. Current time: 2:07 PM
5. **Expected**: Next available time shown as 2:12 PM (exact calculation)
6. **Result**: ✅ Working correctly (after fix)

## Files Modified
- ✅ `/src/app/w/[slug]/page.tsx` - Added `roundJITTo15Minutes` to `webinarData`

## Related Files (No Changes Needed)
- ✅ `/src/app/w/[slug]/page-client.tsx` - Already had correct logic
- ✅ `/src/app/dashboard/webinars/[id]/edit/page.tsx` - Already had form field
- ✅ `/src/app/api/webinars/[id]/route.ts` - Already included in allowed fields
- ✅ `/prisma/schema.prisma` - Already had field definition
- ✅ `/src/lib/webinarSchedule.ts` - Already had rounding function

## Impact
- **Before Fix**: All JIT schedules were always rounded to 15 minutes regardless of setting
- **After Fix**: JIT schedules respect the webinar's `roundJITTo15Minutes` setting

## Backward Compatibility
✅ Default value is `true`, so existing webinars maintain current behavior
✅ New webinars default to rounding enabled (safer for user experience)
✅ Can be toggled per webinar as needed
