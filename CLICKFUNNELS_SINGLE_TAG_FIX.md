# ClickFunnels Single Tag Fix - CRITICAL

## 🚨 Problem Identified

When someone registers at **3:30 PM** for a webinar at **5:00 PM** (90 minutes before), the system was scheduling **MULTIPLE tags**:

```
Registration: 3:30 PM
Webinar Start: 5:00 PM
Minutes Until Start: 90 minutes

OLD LOGIC (WRONG):
✗ if (90 > 120) FALSE - Skip 2HR tag
✗ if (90 > 60) TRUE - Schedule 1HR tag ❌
✗ if (90 > 15) TRUE - Schedule 15MIN tag ❌

Result: TWO tags scheduled (1HRREMINDER + 15MINREMINDER)
```

### Why This is Wrong
- ClickFunnels should only receive **ONE tag per registration**
- ClickFunnels workflows handle the **rest of the reminder sequence**
- Multiple tags trigger **multiple workflows** = duplicate reminders

---

## ✅ Solution Applied

Changed from **multiple `if` statements** to **`if-else if` chain** to ensure **ONLY ONE tag** is scheduled:

```typescript
// NEW LOGIC (CORRECT):
if (minutesUntilStart > 1440) {
  // More than 24 hours → Schedule 24HRREMINDER
  
} else if (minutesUntilStart > 120) {
  // Between 2-24 hours → Schedule 2HRREMINDER
  
} else if (minutesUntilStart > 60) {
  // Between 1-2 hours → Schedule 1HRREMINDER ✓ ONLY THIS ONE
  
} else if (minutesUntilStart > 15) {
  // Between 15 min - 1 hour → Schedule 15MINREMINDER
  
} else if (minutesUntilStart >= 0) {
  // Less than 15 minutes → Apply WESTARTED immediately
}
```

---

## 📊 Examples with New Logic

### Example 1: Register 48 hours before
```
Registration: Monday 11:00 AM
Webinar Start: Wednesday 11:00 AM
Minutes Until Start: 2,880 minutes

✓ Only schedules: 24HRREMINDER for Tuesday 11:00 AM
✗ Does NOT schedule: 2HR, 1HR, or 15MIN tags
→ ClickFunnels workflow handles the rest
```

### Example 2: Register 8 hours before
```
Registration: 3:00 AM
Webinar Start: 11:00 AM  
Minutes Until Start: 480 minutes

✓ Only schedules: 2HRREMINDER for 9:00 AM
✗ Does NOT schedule: 1HR or 15MIN tags
→ ClickFunnels workflow handles the rest
```

### Example 3: Register 90 minutes before (YOUR EXAMPLE)
```
Registration: 3:30 PM
Webinar Start: 5:00 PM
Minutes Until Start: 90 minutes

✓ Only schedules: 1HRREMINDER for 4:00 PM
✗ Does NOT schedule: 15MIN tag
→ ClickFunnels workflow handles the rest
```

### Example 4: Register 30 minutes before
```
Registration: 4:30 PM
Webinar Start: 5:00 PM
Minutes Until Start: 30 minutes

✓ Only schedules: 15MINREMINDER for 4:45 PM
✗ Does NOT schedule: any other tags
→ ClickFunnels workflow handles the rest
```

### Example 5: Register 10 minutes before
```
Registration: 4:50 PM
Webinar Start: 5:00 PM
Minutes Until Start: 10 minutes

✓ Only applies: WESTARTED immediately
✗ Does NOT schedule: any reminder tags
→ User gets instant access link
```

---

## 🔄 How ClickFunnels Workflows Work

### Recommended Workflow Setup in ClickFunnels

**Workflow 1: 24HR Sequence**
```
Trigger: Contact tagged with "24HRREMINDER"
↓
Wait 22 hours
↓
Tag contact with "2HRREMINDER"
↓
Wait 1 hour
↓
Tag contact with "1HRREMINDER"
↓
Wait 45 minutes
↓
Tag contact with "15MINREMINDER"
```

**Workflow 2: 2HR Sequence** (for those who register late)
```
Trigger: Contact tagged with "2HRREMINDER"
↓
Wait 1 hour
↓
Tag contact with "1HRREMINDER"
↓
Wait 45 minutes
↓
Tag contact with "15MINREMINDER"
```

**Workflow 3: 1HR Sequence** (for those who register even later)
```
Trigger: Contact tagged with "1HRREMINDER"
↓
Wait 45 minutes
↓
Tag contact with "15MINREMINDER"
```

**Workflow 4-5: Individual Reminders**
```
Trigger: Contact tagged with "15MINREMINDER"
→ Send final reminder email

Trigger: Contact tagged with "WESTARTED"
→ Send "join now" email with room link
```

---

## 📝 Files Changed

### 1. `/src/lib/reminders.ts`
**Function:** `applyRegistrationTag()`

**Change:** Multiple `if` statements → Single `if-else if` chain

**Before:**
```typescript
if (minutesUntilStart > 1440) { schedule 24HR }
if (minutesUntilStart > 120) { schedule 2HR }  // ❌ Multiple tags possible
if (minutesUntilStart > 60) { schedule 1HR }   // ❌ Multiple tags possible
if (minutesUntilStart > 15) { schedule 15MIN } // ❌ Multiple tags possible
```

**After:**
```typescript
if (minutesUntilStart > 1440) { schedule 24HR }
else if (minutesUntilStart > 120) { schedule 2HR }  // ✓ Only one executes
else if (minutesUntilStart > 60) { schedule 1HR }   // ✓ Only one executes
else if (minutesUntilStart > 15) { schedule 15MIN } // ✓ Only one executes
else if (minutesUntilStart >= 0) { apply WESTARTED }
```

### 2. `/src/app/api/integrations/clickfunnels/webhook/route.ts`
**Location:** ClickFunnels webhook registration handler

**Change:** Same fix - multiple `if` statements → Single `if-else if` chain

**Impact:** Ensures webhook registrations also only get ONE tag

---

## ✅ Benefits of This Fix

1. **No Duplicate Reminders**
   - Users receive ONE initial tag
   - ClickFunnels workflows handle the sequence
   - No overlapping reminders

2. **Cleaner Tag Management**
   - Easier to track which tag a user received
   - Clear entry point into reminder sequence
   - Simpler debugging

3. **Better ClickFunnels Integration**
   - Works as ClickFunnels workflows expect
   - One tag triggers one workflow
   - Predictable behavior

4. **Reduced API Calls**
   - Only one tag scheduled per registration
   - Less load on ClickFunnels API
   - Faster registration processing

---

## 🧪 Testing

### Test Case 1: Register 90 minutes before
```bash
# Create test webinar starting in 90 minutes
# Register a user
# Check database:

SELECT * FROM clickfunnels_reminder_tags 
WHERE registration_id = 'xxx' 
ORDER BY scheduled_for;

# Expected: ONE row with tagName = '1HRREMINDER'
# Old behavior: TWO rows (1HRREMINDER + 15MINREMINDER)
```

### Test Case 2: Register 30 minutes before
```bash
# Expected: ONE row with tagName = '15MINREMINDER'
# Old behavior: TWO rows (1HRREMINDER + 15MINREMINDER)
```

### Test Case 3: Register 5 minutes before
```bash
# Expected: ZERO rows in clickfunnels_reminder_tags
# Expected: Contact immediately tagged with 'WESTARTED'
# Old behavior: ONE row (15MINREMINDER) - incorrect
```

---

## 🚀 Deployment Status

- ✅ Fix applied to `src/lib/reminders.ts`
- ✅ Fix applied to `src/app/api/integrations/clickfunnels/webhook/route.ts`
- ⏳ Ready to commit and deploy

---

## 📋 Commit Message

```bash
git add -A
git commit -m "fix: ClickFunnels should only receive ONE tag per registration

- Changed from multiple if statements to if-else if chain
- Prevents duplicate tags for same registration (e.g., both 1HR and 15MIN)
- ClickFunnels workflows handle reminder sequence after initial tag
- Applies to both normal registration and webhook registration
- Fixes issue where 90-minute registration got multiple tags

Example: Register at 3:30 PM for 5:00 PM webinar (90 min)
Before: Scheduled 1HRREMINDER + 15MINREMINDER (wrong)
After: Only schedules 1HRREMINDER (correct)"
git push origin main
```

---

## 🔮 Next Steps

1. **Deploy the fix** - Push to GitHub and Railway
2. **Update ClickFunnels workflows** - Set up tag sequences as shown above
3. **Test with real registration** - Verify only ONE tag is applied
4. **Monitor logs** - Check that cron job applies tags correctly
5. **Clean up old duplicate tags** (if needed):
   ```sql
   -- Find registrations with multiple tags
   SELECT registration_id, COUNT(*) as tag_count
   FROM clickfunnels_reminder_tags
   WHERE status = 'PENDING'
   GROUP BY registration_id
   HAVING COUNT(*) > 1;
   ```

---

## 📞 Support

If you see duplicate tags after this fix:
1. Check that you deployed the latest code
2. Verify ClickFunnels workflows aren't adding extra tags
3. Check Railway logs for tag scheduling messages
4. Query database to see what tags were actually scheduled

---

**Status:** ✅ FIX READY - Needs deployment
**Priority:** 🔴 CRITICAL - Affects all new registrations
**Impact:** Prevents duplicate reminder delivery via ClickFunnels
