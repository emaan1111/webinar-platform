# Just In Time 15-Minute Rounding

## Overview
All "Just In Time" webinar scheduling now rounds to the nearest 15-minute interval for cleaner, more professional time displays.

## Examples
- **Before**: 9:07, 9:09, 9:23, 9:38
- **After**: 9:15, 9:15, 9:30, 9:45

## Implementation

### New Utility Function
Created `roundToNearest15Minutes()` in `src/lib/webinarSchedule.ts`:
```typescript
export function roundToNearest15Minutes(date: Date): Date {
  const rounded = new Date(date)
  const minutes = rounded.getMinutes()
  const remainder = minutes % 15
  
  // Round up to next 15-minute mark
  if (remainder > 0) {
    rounded.setMinutes(minutes + (15 - remainder))
  }
  
  // Reset seconds and milliseconds
  rounded.setSeconds(0, 0)
  
  return rounded
}
```

### Updated Files

1. **`src/lib/webinarSchedule.ts`**
   - Added `roundToNearest15Minutes()` utility function
   - Updated `calculateScheduleDateTime()` to round Just In Time calculations
   - Always rounds up to next 15-minute mark

2. **`src/app/w/[slug]/page-client.tsx`** (4 locations updated)
   - Line ~527: Schedule display formatting
   - Line ~696: Registration submission time calculation
   - Line ~1027: Schedule dropdown slot generation (first template)
   - Line ~1758: Schedule dropdown slot generation (second template)

3. **`src/app/api/integrations/clickfunnels/webhook/route.ts`**
   - Line ~145: ClickFunnels webhook registration time calculation
   - Ensures CF registrations also get rounded times

## How It Works

When a webinar is set to "Just In Time" with X minutes delay:

1. **Old Behavior**:
   - User registers at 9:07 PM with 15 min delay
   - Scheduled for: 9:22 PM (exact calculation)

2. **New Behavior**:
   - User registers at 9:07 PM with 15 min delay
   - Raw calculation: 9:22 PM
   - Rounded to: 9:30 PM (next 15-minute mark)

## Benefits

✅ **Professional appearance**: Clean time slots like 8:15, 8:30, 8:45, 9:00
✅ **User-friendly**: Easier to remember and recognize
✅ **Calendar-friendly**: Aligns with standard calendar intervals
✅ **Reduces confusion**: No odd times like 9:09 or 9:23

## Testing

To test the feature:

1. Create a webinar with "Just In Time" schedule (e.g., 15 minutes)
2. Register at various times
3. Check scheduled time always ends in :00, :15, :30, or :45

## Deployment Status

- ✅ Code committed locally (commit d2d816f)
- ⏳ Push to GitHub pending (network issue - retry with `git push origin main`)
- ⏳ Railway will auto-deploy once pushed

## Notes

- Rounding **always rounds up**, never down
- If already on a 15-minute mark (e.g., 9:15), time remains unchanged
- Applies to all Just In Time schedules system-wide
- ClickFunnels webhook registrations also use rounded times
