# Recurring Schedule Multiple Time Slots Implementation

**Date**: October 31, 2025  
**Updated**: November 2, 2025 - Added day selection for weekly/monthly schedules

---

## ✅ NEW: Day Selection Added (Nov 2, 2025)

### Issue Fixed
Users can now select:
- **Weekly schedules**: Specific day of week (Sunday-Saturday)
- **Monthly schedules**: Specific day of month (1-31)

### Changes
- Added day of week selector for weekly recurring schedules
- Added day of month selector for monthly recurring schedules
- Dynamic show/hide based on interval selection
- Updated `addSchedule` function to save day selections in `recurringPattern`

### Pattern Structure
```json
// Weekly
{
  "interval": "weekly",
  "time": "14:00",
  "daysOfWeek": [1]  // Monday
}

// Monthly
{
  "interval": "monthly",
  "time": "14:00",
  "dayOfMonth": 15  // 15th of month
}
```

**File Modified**: `src/app/dashboard/webinars/[id]/edit/page.tsx`

---

## Overview

For recurring schedules, instead of showing a single entry like "Invalid Date" or a generic pattern, the dropdown now shows **multiple upcoming time slots** based on the webinar's "Schedules to Show" setting - just like evergreen webinars!

## What Changed

### Before
```
Schedule Dropdown:
- Friday, Oct 31, 11:05 PM GMT+5:30 • 60 min (Recurring)
OR
- Invalid Date • 60 min
```

### After
```
Schedule Dropdown:
- Monday, Nov 4, 2:00 PM EST • 60 min
- Monday, Nov 11, 2:00 PM EST • 60 min
- Monday, Nov 18, 2:00 PM EST • 60 min
- Monday, Nov 25, 2:00 PM EST • 60 min
- Monday, Dec 2, 2:00 PM EST • 60 min
```

## Features

### 1. Multiple Time Slots Generated ✅
- **Daily Recurring**: Shows next 5 (or maxSchedulesToShow) consecutive days
- **Weekly Recurring**: Shows next 5 occurrences on specified days
- Each slot shows exact date and time in user's timezone

### 2. Respects "Max Schedules to Show" Setting ✅
- Uses `webinar.maxSchedulesToShow` (default: 5)
- Generates that many upcoming time slots
- Each slot is selectable independently

### 3. Dynamic Time Calculation ✅
- **Daily Pattern**: 
  - Finds next occurrence of specified time
  - Skips if today's time has passed
  - Generates consecutive days
  
- **Weekly Pattern**:
  - Finds next occurrence of each specified day of week
  - Calculates exact date for each slot
  - Looks ahead up to 8 weeks to find enough slots

### 4. Timezone-Aware Display ✅
- All times shown in user's selected timezone
- Times update when timezone dropdown changes
- Shows timezone abbreviation (EST, PST, GMT, etc.)

### 5. Works on All Pages ✅
- Default registration modal
- Custom template modals
- Consistent behavior everywhere

## Technical Implementation

### New Interface Addition
```typescript
interface Webinar {
  id: string
  title: string
  description: string
  duration: number
  schedules: Schedule[]
  maxSchedulesToShow?: number  // NEW!
  videoUrl?: string | null
  vimeoVideoId?: string | null
  offer?: any
  enableABTesting?: boolean
  testGroup?: 'A' | 'B' | null
}
```

### New Function: `generateRecurringSlots()`
```typescript
const generateRecurringSlots = (schedule: Schedule, count: number = 5) => {
  const slots: { id: string; time: Date; baseScheduleId: string }[] = []
  const pattern = JSON.parse(schedule.recurringPattern || '{}')
  
  // For daily patterns
  if (pattern.interval === 'daily') {
    // Generate next N days at specified time
    for (let i = 0; i < count; i++) {
      const slotDate = new Date()
      slotDate.setDate(now.getDate() + i)
      slotDate.setHours(hours, minutes, 0, 0)
      
      if (slotDate > now) {
        slots.push({
          id: `${schedule.id}-slot-${i}`,
          time: slotDate,
          baseScheduleId: schedule.id
        })
      }
    }
  }
  
  // For weekly patterns
  else if (pattern.interval === 'weekly') {
    // Find next N occurrences on specified days of week
    // ... (iterates through weeks to find matching days)
  }
  
  return slots
}
```

### Updated Schedule Dropdown
```typescript
<select id="schedule-custom" value={selectedSchedule?.id || ''}>
  <option value="">Choose your preferred time...</option>
  {webinar.schedules.map((schedule) => {
    if (schedule.scheduleType === 'recurring') {
      // Generate multiple slots for recurring schedules
      const maxSlots = webinar.maxSchedulesToShow || 5
      const slots = generateRecurringSlots(schedule, maxSlots)
      return slots.map((slot) => (
        <option key={slot.id} value={slot.id}>
          {formatScheduleTime(schedule, slot.time)} • {webinar.duration} min
        </option>
      ))
    } else {
      // Just-in-time and specific schedules show once
      return (
        <option key={schedule.id} value={schedule.id}>
          {formatScheduleTime(schedule)} • {webinar.duration} min
        </option>
      )
    }
  })}
</select>
```

### Updated Registration Handler
```typescript
const handleRegister = async () => {
  let scheduleId = selectedSchedule!.id
  let selectedDateTime = selectedSchedule!.scheduledAt
  
  // Check if this is a generated slot (contains "-slot-")
  if (scheduleId.includes('-slot-') && webinar) {
    const baseScheduleId = scheduleId.split('-slot-')[0]
    const baseSchedule = webinar.schedules.find(s => s.id === baseScheduleId)
    
    if (baseSchedule && baseSchedule.scheduleType === 'recurring') {
      // Find the slot to get the exact datetime
      const slots = generateRecurringSlots(baseSchedule, webinar.maxSchedulesToShow || 5)
      const selectedSlot = slots.find(s => s.id === scheduleId)
      
      if (selectedSlot) {
        scheduleId = baseScheduleId
        selectedDateTime = selectedSlot.time.toISOString()
      }
    }
  }
  
  // Send to API with exact datetime
  await fetch(`/api/webinars/${webinar.id}/register`, {
    method: 'POST',
    body: JSON.stringify({
      scheduleId: scheduleId,              // Base schedule ID
      selectedDateTime: selectedDateTime,  // Exact selected time
      // ... other fields
    })
  })
}
```

## Examples

### Daily Recurring Schedule
**Setup**: Daily at 14:00 UTC

**Dropdown Shows**:
```
Today (if time hasn't passed):
- Thursday, Oct 31, 2:00 PM EST • 60 min

Or starting from tomorrow:
- Friday, Nov 1, 2:00 PM EST • 60 min
- Saturday, Nov 2, 2:00 PM EST • 60 min
- Sunday, Nov 3, 2:00 PM EST • 60 min
- Monday, Nov 4, 2:00 PM EST • 60 min
- Tuesday, Nov 5, 2:00 PM EST • 60 min
```

### Weekly Recurring Schedule
**Setup**: Every Monday at 14:00 UTC

**Dropdown Shows**:
```
- Monday, Nov 4, 2:00 PM EST • 60 min
- Monday, Nov 11, 2:00 PM EST • 60 min
- Monday, Nov 18, 2:00 PM EST • 60 min
- Monday, Nov 25, 2:00 PM EST • 60 min
- Monday, Dec 2, 2:00 PM EST • 60 min
```

### Weekly Recurring (Multiple Days)
**Setup**: Monday, Wednesday, Friday at 14:00 UTC

**Dropdown Shows**:
```
- Friday, Nov 1, 2:00 PM EST • 60 min
- Monday, Nov 4, 2:00 PM EST • 60 min
- Wednesday, Nov 6, 2:00 PM EST • 60 min
- Friday, Nov 8, 2:00 PM EST • 60 min
- Monday, Nov 11, 2:00 PM EST • 60 min
```

## Slot ID System

### Format
```
{baseScheduleId}-slot-{index}
```

### Example
```
Original Schedule ID: "cm123abc456"

Generated Slots:
- cm123abc456-slot-0 → Monday, Nov 4, 2:00 PM EST
- cm123abc456-slot-1 → Monday, Nov 11, 2:00 PM EST
- cm123abc456-slot-2 → Monday, Nov 18, 2:00 PM EST
- cm123abc456-slot-3 → Monday, Nov 25, 2:00 PM EST
- cm123abc456-slot-4 → Monday, Dec 2, 2:00 PM EST
```

### Processing
1. User selects "cm123abc456-slot-2"
2. System extracts base ID: "cm123abc456"
3. Regenerates slots to find slot-2's exact time
4. Sends to API: `scheduleId="cm123abc456"`, `selectedDateTime="2024-11-18T14:00:00Z"`

## Benefits

### For Users
✅ **Clear Options**: See exact dates and times, not patterns
✅ **Easy Selection**: Pick the specific date that works best
✅ **Timezone Aware**: All times in their local timezone
✅ **No Confusion**: No more "Invalid Date" or vague descriptions

### For Conversions
✅ **Reduced Friction**: Clear options = faster decisions
✅ **Better UX**: Matches evergreen webinar experience
✅ **More Professional**: Shows planning and organization
✅ **Flexibility**: Users can choose the best time for them

### For Organizers
✅ **Automatic**: No manual schedule entry needed
✅ **Configurable**: Control how many slots to show
✅ **Scalable**: Works for any recurring pattern
✅ **Consistent**: Same behavior as evergreen webinars

## Configuration

### Set Max Schedules to Show
When editing a webinar, set the `maxSchedulesToShow` field (default: 5):

```typescript
// In webinar creation/edit form
maxSchedulesToShow: 5  // Show 5 upcoming time slots
```

### Pattern Examples

**Daily at 2 PM**:
```json
{
  "interval": "daily",
  "time": "14:00",
  "daysOfWeek": []
}
```

**Weekly on Mondays at 2 PM**:
```json
{
  "interval": "weekly",
  "time": "14:00",
  "daysOfWeek": ["Monday"]
}
```

**Weekly on Mon/Wed/Fri at 10 AM**:
```json
{
  "interval": "weekly",
  "time": "10:00",
  "daysOfWeek": ["Monday", "Wednesday", "Friday"]
}
```

## Files Modified

- `/src/app/w/[slug]/page-client.tsx`
  - Added `maxSchedulesToShow` to Webinar interface
  - Added `generateRecurringSlots()` function (daily + weekly logic)
  - Updated `formatScheduleTime()` to accept optional slotTime
  - Updated both schedule dropdowns (default + custom template)
  - Updated `handleRegister()` to extract datetime from slot ID
  - Updated onChange handlers to support slot IDs

## Testing

### Test Cases

1. **Daily Recurring**:
   - [ ] Set up daily webinar at 14:00
   - [ ] View registration page
   - [ ] Verify 5 consecutive days shown
   - [ ] Check times are in user's timezone
   - [ ] Change timezone dropdown
   - [ ] Verify times update

2. **Weekly Recurring (Single Day)**:
   - [ ] Set up weekly Monday webinar at 14:00
   - [ ] View registration page
   - [ ] Verify 5 Mondays shown
   - [ ] Check correct dates calculated
   - [ ] Verify timezone display

3. **Weekly Recurring (Multiple Days)**:
   - [ ] Set up Mon/Wed/Fri webinar at 10:00
   - [ ] View registration page
   - [ ] Verify mixed days shown in order
   - [ ] Check maxSchedulesToShow respected

4. **Registration Flow**:
   - [ ] Select a recurring slot
   - [ ] Complete registration
   - [ ] Verify correct datetime saved
   - [ ] Check email confirmation has right time

5. **Edge Cases**:
   - [ ] Test when today's time has passed
   - [ ] Test at midnight (timezone transitions)
   - [ ] Test with maxSchedulesToShow = 1
   - [ ] Test with maxSchedulesToShow = 10

### Manual Testing
```bash
# Start server
npm run dev

# Navigate to webinar page
http://localhost:3004/w/{slug}

# Click "Register Now"
# Check schedule dropdown
# Verify multiple dates shown for recurring schedules
```

## Known Limitations

1. **Max 8 Weeks Lookahead**: For weekly schedules, looks ahead maximum 8 weeks to find slots
2. **Regeneration**: Slots regenerated on each render (could cache if performance issue)
3. **Timezone Changes**: User must manually change timezone (no auto-detection yet)

## Future Enhancements

### Potential Improvements
- [ ] Cache generated slots to improve performance
- [ ] Add "Show More" button to load additional slots
- [ ] Visual calendar view for date selection
- [ ] Auto-detect user's timezone from browser
- [ ] Show availability indicators ("Almost Full", "Available")
- [ ] Group by week or month for easier scanning
- [ ] Add "Next Available" quick-select button

---

**Status**: ✅ Completed
**Testing**: ⏳ Pending
**Production**: 🎯 Ready for Testing
**Server**: Running on http://localhost:3004
**Last Updated**: October 31, 2025, 11:55 PM
