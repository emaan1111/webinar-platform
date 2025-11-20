# Automated ClickFunnels Attendance Tagging System

## Overview
The system automatically applies ClickFunnels tags to attendees based on their viewing behavior **when their session ends**, not after the webinar ends.

## How It Works

### Tag Logic

1. **ATTENDED** (`CLICKFUNNELS_TAG_ATTENDED="368587"`)
   - Applied to: Anyone who attended at all (even 1%)
   - Condition: User joined the webinar
   - Applied when: User's session ends (when they leave)

2. **MOSTLY_ATTENDED** (`CLICKFUNNELS_TAG_MOSTLY_ATTENDED="368588"`)
   - Applied to: Users who watched past the configured threshold
   - Condition: `lastWatchedPosition >= webinar.mostlyAttendedThreshold`
   - Configurable: Set per webinar in webinar settings
   - Applied when: User's session ends

3. **PARTLY_ATTENDED** (`CLICKFUNNELS_TAG_PARTLY_ATTENDED="368589"`)
   - Applied to: Users who attended but didn't reach the MOSTLY_ATTENDED threshold
   - Condition: User attended BUT `lastWatchedPosition < webinar.mostlyAttendedThreshold`
   - Applied when: User's session ends

4. **MISSED** (`CLICKFUNNELS_TAG_MISSED="368590"`)
   - Applied to: Registrants who never attended
   - Condition: `attended = false`
   - Applied when: User's session ends (if they registered but never joined)

### When Tags Are Applied

Tags are applied **automatically** when:
- A user **leaves** the webinar (closes tab, navigates away, or video ends)
- The session tracking API receives `action: 'leave'`
- Tags are applied in the **background** (async) so it doesn't block the response

### Configuration

#### Per Webinar Settings (Coming Soon)
You'll be able to configure the `mostlyAttendedThreshold` in the webinar settings UI. For now, you can set it via database:

```sql
-- Example: Set threshold to 30 minutes (1800 seconds) for a specific webinar
UPDATE webinars 
SET "mostlyAttendedThreshold" = 1800 
WHERE id = 'your-webinar-id';
```

#### Environment Variables
Make sure these are set in your `.env`:

```env
CLICKFUNNELS_TAG_ATTENDED="368587"
CLICKFUNNELS_TAG_MOSTLY_ATTENDED="368588"
CLICKFUNNELS_TAG_PARTLY_ATTENDED="368589"
CLICKFUNNELS_TAG_MISSED="368590"
```

## Examples

### Example 1: Webinar with Threshold Set
**Webinar Duration:** 60 minutes  
**Threshold:** 30 minutes (1800 seconds)

| User | Watched | Last Position | Tag Applied |
|------|---------|---------------|-------------|
| Alice | Yes | 45 min (2700s) | MOSTLY_ATTENDED |
| Bob | Yes | 25 min (1500s) | PARTLY_ATTENDED |
| Charlie | Yes | 5 min (300s) | PARTLY_ATTENDED |
| Diana | No | N/A | MISSED |

### Example 2: Webinar WITHOUT Threshold
**Webinar Duration:** 60 minutes  
**Threshold:** Not set (null)

| User | Watched | Last Position | Tag Applied |
|------|---------|---------------|-------------|
| Alice | Yes | 45 min (2700s) | ATTENDED |
| Bob | Yes | 25 min (1500s) | ATTENDED |
| Charlie | Yes | 5 min (300s) | ATTENDED |
| Diana | No | N/A | MISSED |

## Manual Tagging

### Bulk Apply Tags
You can manually trigger tagging for all attendees via the attendees dashboard:

1. Go to **Dashboard > Attendees**
2. Filter by webinar (optional)
3. Click **"Apply CF Tags"** button
4. Confirms and applies tags to all registrations

### API Endpoint
```bash
# Apply tags for a specific webinar
curl -X POST https://your-domain.com/api/clickfunnels/apply-attendance-tags \
  -H "Content-Type: application/json" \
  -d '{"webinarId": "your-webinar-id"}'

# Apply tags for all webinars
curl -X POST https://your-domain.com/api/clickfunnels/apply-attendance-tags \
  -H "Content-Type: application/json" \
  -d '{"all": true}'
```

## Technical Details

### Session Tracking Flow
1. User joins webinar → `action: 'join'` → Creates session
2. Video plays → `action: 'update'` → Updates `lastWatchedPosition` every 5 seconds
3. User leaves → `action: 'leave'` → Ends session + **triggers tag application**

### Tag Application Process
```typescript
// When user leaves (automatic)
applyAttendanceTagOnSessionEnd({ registrationId })
  .then(result => {
    console.log(`Applied ${result.tag} tag: ${result.reason}`)
  })
```

### Database Migration
Run this to add the new field:

```bash
psql $DATABASE_URL < add-mostly-attended-threshold.sql
```

## Monitoring

### Check Logs
```bash
# Railway logs
railway logs --tail 100 | grep "attendance tag"

# Look for:
# ✅ Applied MOSTLY_ATTENDED tag for user@email.com: Watched 2700s, past threshold 1800s
# ❌ Failed to apply attendance tag for user@email.com: No tag configured
```

### Verify Tags in ClickFunnels
1. Go to ClickFunnels dashboard
2. Navigate to **Contacts**
3. Search for an attendee
4. Check **Tags** section
5. Should see: `UM-Webinar-Attended`, `UM-Webinar-MostlyAttended`, etc.

## FAQ

**Q: What if I don't set a threshold?**  
A: All attendees will get the ATTENDED tag (or MISSED if they didn't attend).

**Q: Can I change the threshold after the webinar?**  
A: Yes, but it won't retroactively apply tags. Use the "Apply CF Tags" button to reprocess.

**Q: What if ClickFunnels API is down?**  
A: The session still ends normally. The tag application fails silently and logs the error.

**Q: Are tags applied for replay viewers?**  
A: Yes, the same logic applies. The system tracks `lastWatchedPosition` for both live and replay.

**Q: Can I have different thresholds for different webinars?**  
A: Yes! Each webinar has its own `mostlyAttendedThreshold` field.

## Next Steps

1. ✅ Deploy the code (already done)
2. ⏳ Run database migration to add `mostlyAttendedThreshold` field
3. ⏳ Add UI in webinar settings to configure the threshold
4. ⏳ Test with a live webinar
5. ⏳ Monitor ClickFunnels to verify tags are being applied

## Support

If tags aren't being applied:
1. Check environment variables are set
2. Check Railway logs for errors
3. Verify ClickFunnels API credentials
4. Test manually via "Apply CF Tags" button
5. Check that users actually left (session ended)
