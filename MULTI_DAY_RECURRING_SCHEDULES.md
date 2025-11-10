# Multi-Day Recurring Schedules Feature

## Overview
Added the ability to select multiple days of the week for recurring webinar schedules. For example, you can now create a webinar that recurs every Monday, Wednesday, and Friday at 11:00 AM.

## Implementation

### 1. Frontend - Webinar Creation Form
**File**: `src/app/dashboard/webinars/new/page.tsx`

#### UI Changes:
- Added a **Days of Week Selector** that appears when "Weekly" interval is selected
- Checkbox group for all 7 days: Sun, Mon, Tue, Wed, Thu, Fri, Sat
- Days selector is hidden for "Daily" and "Monthly" intervals (only relevant for weekly)
- Visual feedback with hover states and proper styling

#### Validation:
- For weekly recurring schedules, at least one day must be selected
- Alert shown if user tries to add weekly schedule without selecting days

#### Data Structure:
```javascript
{
  interval: "weekly",
  time: "11:00",
  daysOfWeek: [1, 3, 5]  // Monday, Wednesday, Friday
}
```

Days are represented as numbers (0=Sunday, 1=Monday, ..., 6=Saturday) matching JavaScript's `Date.getDay()` method.

### 2. Backend - Public API
**File**: `src/app/api/webinars/public/[slug]/route.ts`

#### generateRecurringOccurrences Function:
- Already had support for `daysOfWeek` array
- For weekly recurring schedules, checks if current day is in the `daysOfWeek` array
- Only generates occurrences for matching days
- Example: If daysOfWeek=[1,3,5] and today is Tuesday (Nov 5), it will generate:
  - Wed Nov 6 (day 3)
  - Fri Nov 8 (day 5)
  - Mon Nov 11 (day 1)
  - Wed Nov 13 (day 3)
  - etc.

### 3. Display - Webinar Detail Page
**File**: `src/app/dashboard/webinars/[id]/page.tsx`

#### Enhanced Display:
- Parses `daysOfWeek` array from recurring pattern
- Converts day numbers to day names (0→Sun, 1→Mon, etc.)
- Shows: "Every Mon, Wed, Fri at 11:00" instead of just "weekly at 11:00"
- Falls back to simple display if daysOfWeek is empty or invalid

## User Flow

### Creating a Multi-Day Recurring Webinar:

1. **Navigate to Create Webinar**: `/dashboard/webinars/new`

2. **Fill in Basic Info**: Title, slug, description, etc.

3. **Add Schedule**:
   - Click "Add Schedule" button
   - Select "Recurring Schedule" tab
   - Choose "Weekly" from Interval dropdown
   - Days selector automatically appears
   - Check multiple days (e.g., ☑️ Mon, ☑️ Wed, ☑️ Fri)
   - Set time (e.g., 11:00 AM)
   - Select timezone
   - Click "Add" button

4. **Validation**:
   - If no days selected → Alert: "Please select at least one day for weekly recurring schedule"
   - If valid → Schedule added to list

5. **Save Webinar**: Click "Create Webinar" button at bottom

### Viewing the Schedule:

On the webinar detail page, recurring schedules now show:
- **Before**: "recurring at 14:00 (America/New_York)"
- **After**: "Every Mon, Wed, Fri at 14:00 (America/New_York)"

### Public Registration Page:

When users visit `/w/[slug]`:
- If you selected Mon/Wed/Fri and set `maxSchedulesToShow: 3`
- They'll see the next 3 occurrences:
  - Wednesday, Nov 6 at 11:00 AM
  - Friday, Nov 8 at 11:00 AM
  - Monday, Nov 11 at 11:00 AM
- Users can select which specific occurrence they want to attend

## Technical Details

### Database Schema:
No schema changes needed. The `recurringPattern` field (JSON/String) already stores the pattern:

```prisma
model WebinarSchedule {
  id                String   @id @default(cuid())
  recurringPattern  String?  // Stores JSON: {"interval":"weekly","time":"11:00","daysOfWeek":[1,3,5]}
  // ... other fields
}
```

### JSON Structure in Database:
```json
{
  "interval": "weekly",
  "time": "14:00",
  "daysOfWeek": [1, 3, 5]
}
```

For daily: `daysOfWeek` is `[]` or omitted
For monthly: `daysOfWeek` is `[]` or omitted

## Examples

### Example 1: Every Monday and Wednesday
```javascript
{
  interval: "weekly",
  time: "10:00",
  daysOfWeek: [1, 3]  // Monday, Wednesday
}
```
Display: "Every Mon, Wed at 10:00"

### Example 2: Every Weekday
```javascript
{
  interval: "weekly",
  time: "09:00",
  daysOfWeek: [1, 2, 3, 4, 5]  // Mon-Fri
}
```
Display: "Every Mon, Tue, Wed, Thu, Fri at 09:00"

### Example 3: Weekend Only
```javascript
{
  interval: "weekly",
  time: "14:00",
  daysOfWeek: [0, 6]  // Sunday, Saturday
}
```
Display: "Every Sun, Sat at 14:00"

## Benefits

1. **Flexibility**: Create complex recurring patterns (e.g., M/W/F, Tue/Thu, weekdays only)
2. **User-Friendly**: Checkbox interface is intuitive
3. **Accurate Display**: Shows exactly which days the webinar occurs
4. **Smart Generation**: Only generates occurrences for selected days
5. **Efficient**: No need for multiple schedules, one recurring schedule handles multiple days

## Testing Checklist

- [x] Days selector appears when "Weekly" is selected
- [x] Days selector hides for "Daily" and "Monthly"
- [x] Can select multiple days
- [x] Validation prevents adding weekly schedule with no days
- [x] Schedule saves with correct daysOfWeek array
- [x] Webinar detail page displays selected days correctly
- [x] Public API generates occurrences only for selected days
- [ ] Test on public registration page (`/w/[slug]`)
- [ ] Test registration for specific occurrence
- [ ] Verify email/calendar invite shows correct day

## Future Enhancements

1. **Preset Buttons**: "Weekdays" (M-F), "Weekends" (Sat-Sun), "All Days"
2. **Date Range**: Add "End Date" or "Number of Occurrences" limit
3. **Exceptions**: Skip specific dates (holidays)
4. **Multiple Time Slots**: Same days but different times (e.g., 10 AM and 2 PM)
5. **Copy Schedule**: Duplicate existing recurring schedule to another webinar

## Notes

- Days of week use JavaScript convention: 0=Sunday, 1=Monday, ..., 6=Saturday
- Empty `daysOfWeek` array for weekly schedules will be treated as all days
- The feature is backward compatible - existing weekly schedules without `daysOfWeek` will work as before
- Maximum 7 days can be selected (all days of the week)
