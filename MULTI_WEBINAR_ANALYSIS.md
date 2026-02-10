# Multi-Webinar Platform Analysis

## ✅ WHAT WORKS (Properly Isolated)

### 1. **Database Schema** ✅
- All key tables have `webinarId` foreign key
- Registration, Sessions, Sales, Offers, Chat, Reactions all properly linked
- Lead pages have `webinarId` 
- SMS reminder templates have `webinarId`

### 2. **ClickFunnels Tagging** ✅
- **EACH WEBINAR CAN HAVE CUSTOM TAGS**
- Webinar model has these fields:
  - `registrationTag` - Custom tag for registrations
  - `attendedTag` - Custom tag for attendance
  - `mostlyAttendedTag` - Custom tag for high engagement
  - `partlyAttendedTag` - Custom tag for low engagement
  - `missedTag` - Custom tag for no-shows
  - `replayAttendedTag` - Custom tag for replay viewers

- Registration API passes custom tags:
```typescript
await syncWebinarRegistrationToClickFunnels({
  // ... other fields
  customTags: {
    registrationTag: webinar.registrationTag,
    attendedTag: webinar.attendedTag,
    mostlyAttendedTag: webinar.mostlyAttendedTag,
    partlyAttendedTag: webinar.partlyAttendedTag,
    missedTag: webinar.missedTag,
    replayAttendedTag: webinar.replayAttendedTag,
  }
});
```

### 3. **Reports** ✅
- `/api/reports` accepts `webinarIds` query parameter
- Filters registrations, page visits, and sessions by webinarId
- Multiple webinar reports can be generated separately

### 4. **Attendees List** ✅
- `/api/attendees` accepts `webinarId` query parameter
- Filters attendees by specific webinar when provided
- Shows all attendees across all webinars when not filtered

### 5. **SMS Reminders** ✅
- Reminder templates are webinar-specific (`webinarId` in `WebinarReminderTemplate`)
- Each webinar has its own reminder schedule
- No cross-contamination between webinars

### 6. **Lead Pages** ✅
- Each lead page has `webinarId` field
- Lead page registrations link to correct webinar
- Conversion tracking is webinar-specific

### 7. **Analytics & Tracking** ✅
- Page visits have `webinarId`
- Video events linked to sessions → registrations → webinar
- Offer analytics have `webinarId`
- Engagement tracking properly isolated

## ⚠️ POTENTIAL ISSUES

### 1. **Dashboard Stats** ⚠️
**Issue**: Dashboard shows GLOBAL stats across ALL webinars
- Total webinars count (all)
- Total attendees count (all)
- Average attendance (all)
- Recent webinars list (last 5 from all)

**Impact**: 
- If hosting 2 different webinars for different audiences, the dashboard will mix metrics
- Example: "Motherhood Program" + "Business Coaching" will show combined stats

**Fix Needed**: Add webinar filter dropdown to dashboard

### 2. **Default ClickFunnels Tags** ⚠️
**Issue**: If custom tags are NOT set on webinar, system falls back to globals
```typescript
const ATTENDANCE_TAG_DEFAULT_NAMES = {
  registered: 'UM-Webinar-Registered',  // Global default
  attended: 'UM-Webinar-Attended',      // Global default
  // etc.
}
```

**Impact**: 
- If you forget to set custom tags, both webinars will use same tags
- Contacts will be tagged the same regardless of which webinar they registered for

**Current State**: Custom tags ARE implemented, just need to ensure they're set in webinar settings

### 3. **Global Reminder Tags** ⚠️
**Issue**: Timing reminder tags are GLOBAL (from .env)
```
CLICKFUNNELS_TAG_24HRREMINDER=372416
CLICKFUNNELS_TAG_2HRREMINDER=372417
```

**Impact**:
- Both webinars will apply same timing tags (24HR, 2HR, 1HR, etc.)
- This might be OKAY if you want to track "registered 24 hours before ANY webinar"
- But NOT OKAY if you want separate timing tags per webinar

**Fix Needed**: Add timing tag fields to Webinar model (optional)

## 📋 CHECKLIST FOR RUNNING 2 WEBINARS

### Before Launch:
- [ ] Set custom ClickFunnels tags for Webinar #1
  - Registration tag (e.g., "RH-Registered")
  - Attended tag (e.g., "RH-Attended")
  - Mostly attended tag (e.g., "RH-MostlyAttended")
  - Partly attended tag (e.g., "RH-PartlyAttended")
  - Missed tag (e.g., "RH-Missed")
  - Replay attended tag (e.g., "RH-ReplayAttended")

- [ ] Set custom ClickFunnels tags for Webinar #2
  - Registration tag (e.g., "BP-Registered")
  - Attended tag (e.g., "BP-Attended")
  - Etc.

- [ ] Create webinar-specific SMS reminder templates
  - Each webinar should have its own templates
  - Customize message content per webinar

- [ ] Create webinar-specific lead pages
  - Each lead page should be linked to correct webinarId
  - Ensure slug doesn't conflict

- [ ] Test registration flow for BOTH webinars
  - Verify correct tags applied in ClickFunnels
  - Check that registrations go to correct webinar
  - Verify SMS reminders use correct template

### During Operation:
- [ ] Filter reports by webinarId when viewing metrics
- [ ] Filter attendees list by webinarId
- [ ] Monitor both webinars separately in analytics

### After Sessions:
- [ ] Run reports with webinarIds parameter:
  ```
  /api/reports?from=2026-02-01&to=2026-02-28&webinarIds=webinar1-id,webinar2-id
  ```
- [ ] Check attendance tagging worked correctly per webinar
- [ ] Review engagement metrics separately

## 🎯 RECOMMENDED FIXES

### Priority 1: Dashboard Filter
Add webinar selector to dashboard to show per-webinar stats

### Priority 2: Webinar Settings UI
Ensure webinar edit page has clear UI for setting custom tags:
```
ClickFunnels Tags (Optional - leave blank to use defaults)
Registration Tag: [RH-Registered]
Attended Tag: [RH-Attended]
Mostly Attended Tag: [RH-MostlyAttended]
Partly Attended Tag: [RH-PartlyAttended]
Missed Tag: [RH-Missed]
Replay Attended Tag: [RH-ReplayAttended]
```

### Priority 3: Better Defaults
Set sensible defaults when creating a webinar:
- Use webinar slug as tag prefix (e.g., "rising-heroes" → "RH-Registered")

## 💡 SUMMARY

**YES, you can host 2 different webinars right now!**

**What will work perfectly:**
- ✅ Separate registrations per webinar
- ✅ Separate attendee lists (when filtered)
- ✅ Separate SMS reminders
- ✅ Separate lead pages
- ✅ Separate ClickFunnels tagging (IF you set custom tags)
- ✅ Separate reports (when filtered by webinarId)

**What needs attention:**
- ⚠️ Set custom ClickFunnels tags for EACH webinar (or they'll share tags)
- ⚠️ Dashboard shows combined stats (use Reports page with filters instead)
- ⚠️ Timing tags (24HR, 2HR) are global (this might be okay)

**Bottom line**: The platform is **READY** for multiple webinars, just make sure to:
1. Set custom tags for each webinar
2. Use filtered views in Reports and Attendees
3. Create separate lead pages per webinar
