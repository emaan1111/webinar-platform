# Quick Testing Guide - Schedule Fix

## 🎯 What to Test

All schedule types should now behave exactly like Just-in-Time schedules:
- Countdown page shows YOUR selected time (not the "next" occurrence)
- Webinar room starts at the correct video timestamp
- Late joining works correctly with elapsed time

## 🧪 Quick Test Procedure

### Setup: View Your Webinar
1. Go to dashboard
2. Find your test webinar with:
   - ✅ One specific schedule (Nov 15, 11:11 AM India)
   - ✅ One recurring daily schedule (Every day at 1:01 AM India)
   - ✅ One recurring weekly schedule (Every Sunday at some time)
3. Copy the registration link

### Test 1: Specific Schedule ⏰
**Expected Behavior**: Should show Nov 15, 11:11 AM (in your timezone)

1. **Register**:
   - Open registration page in incognito/private window
   - Fill form
   - Select the specific schedule (Nov 15, 11:11 AM)
   - Click "Register"

2. **Check Countdown**:
   - You should land on countdown page
   - **✅ Should show**: "Friday, Nov 15, 11:11 AM • India"
   - **❌ Should NOT show**: Any other date/time

3. **Check Console**:
   - Open browser DevTools → Console tab
   - Look for: `✅ Using stored scheduledStartTime: 2025-11-15T05:41:00.000Z`
   - This means it's using the stored time ✅

### Test 2: Recurring Daily Schedule 📅
**Expected Behavior**: Should show the SPECIFIC day you selected, not "tomorrow"

1. **Register**:
   - Open new incognito window
   - Fill form
   - Look at the dropdown - you should see multiple "Daily at 1:01 AM" options with different dates
   - Select the FIRST one (earliest date, e.g., Nov 13, 1:01 AM)
   - Click "Register"

2. **Check Countdown**:
   - **✅ Should show**: The exact date you selected (e.g., "Wednesday, Nov 13, 1:01 AM")
   - **❌ Should NOT show**: Tomorrow's date or "next occurrence"

3. **Verify Console**:
   - Look for: `✅ Using stored scheduledStartTime: 2025-11-13T01:01:00.000Z`
   - The date should match what you selected

### Test 3: Recurring Weekly Schedule 🔁
**Expected Behavior**: Should show the SPECIFIC Sunday you selected

1. **Register**:
   - Open new incognito window
   - Fill form
   - Look at dropdown - should see multiple Sunday options
   - Select a specific Sunday (e.g., Nov 17, 10:00 AM)
   - Click "Register"

2. **Check Countdown**:
   - **✅ Should show**: "Sunday, Nov 17, 10:00 AM" (or whatever you selected)
   - **❌ Should NOT show**: Next Sunday or different date

3. **Verify Console**:
   - Look for: `✅ Using stored scheduledStartTime: 2025-11-17T10:00:00.000Z`

## 🔍 What to Look For

### ✅ SUCCESS Indicators:
1. Countdown page shows the EXACT time you selected in the dropdown
2. Console shows `✅ Using stored scheduledStartTime`
3. Date matches what you clicked during registration
4. Time shown matches your selected timezone

### ❌ FAILURE Indicators:
1. Countdown shows "next occurrence" (e.g., you selected Nov 13 but it shows Nov 14)
2. Console shows `⚠️ Fallback - calculating scheduledTime`
3. Recurring schedule shows tomorrow instead of the day you picked
4. Wrong timezone conversion

## 🚀 Advanced Test: Late Joining

If you want to test the webinar room:

1. **Simulate Time**: 
   - Register for a schedule
   - Note the registration ID from URL (`?r=clxxx`)
   - Visit: `http://localhost:3006/room/your-slug?r=clxxx`

2. **Check Console**:
   - Should see: `✅ [Room] Using stored scheduledStartTime: ...`
   - Video should start at correct position based on elapsed time

3. **Test Late Join**:
   - Register for a schedule that "started" 5 minutes ago (if using real time)
   - Join the room
   - Video should be ~5 minutes into the playback

## 📊 Quick Verification Table

| Test | Select | Countdown Should Show | Pass/Fail |
|------|--------|----------------------|-----------|
| Specific | Nov 15, 11:11 AM | Nov 15, 11:11 AM | ☐ |
| Daily | Nov 13, 1:01 AM | Nov 13, 1:01 AM | ☐ |
| Weekly | Nov 17, 10:00 AM | Nov 17, 10:00 AM | ☐ |

## 💡 Quick Debug Tips

### If countdown shows wrong date:
1. Check browser console for `scheduledStartTime` value
2. If you see `⚠️ Fallback`, the stored time wasn't saved
3. Check Network tab → Registration API call → Response body

### If registration fails:
1. Check terminal/server logs
2. Look for `📝 Registration API - Received scheduledStartTime`
3. Should also see `✅ Registration created with scheduledStartTime`

### If timezone looks wrong:
1. Check dropdown format: "Friday, Nov 15, 11:11 AM • India"
2. Timezone selector at bottom should show "Times shown in India"
3. Console should show UTC time (e.g., `05:41:00.000Z` for India 11:11 AM)

## ✅ All Tests Passed?

If all three tests show the correct dates you selected:
- 🎉 **The fix is working perfectly!**
- All schedule types now behave consistently
- No more "wrong Sunday" or "next occurrence" bugs

---

**Note**: The first registration after server restart might be slightly slower (Prisma connection). Subsequent registrations should be fast.
