# ClickFunnels Attendance-Based Tagging System

## Overview
Automatically tag webinar registrants in ClickFunnels based on their attendance behavior. This allows you to segment your audience and create targeted follow-up campaigns.

## Tag Types & Criteria

### 1. **UM-Webinar-Registered** 
- **When Applied**: Immediately upon webinar registration
- **Criteria**: Contact registers for any webinar
- **Tag ID**: Set in `CLICKFUNNELS_TAG_REGISTERED`

### 2. **UM-Webinar-Attended**
- **When Applied**: When user joins and watches any part of the webinar
- **Criteria**: `attended = true` and `watchTime > 0`
- **Tag ID**: Set in `CLICKFUNNELS_TAG_ATTENDED`

### 3. **UM-Webinar-MostlyAttended**
- **When Applied**: When session ends
- **Criteria**: User watched until the offer/CTA section (last 15 minutes of webinar)
- **Tag ID**: Set in `CLICKFUNNELS_TAG_MOSTLY_ATTENDED`
- **Use Case**: Highly engaged attendees who saw your offer

### 4. **UM-Webinar-PartlyAttended**
- **When Applied**: When session ends
- **Criteria**: User watched at least 40 minutes but did NOT reach offer/CTA
- **Tag ID**: Set in `CLICKFUNNELS_TAG_PARTLY_ATTENDED`
- **Use Case**: Moderately engaged attendees who might need nurturing

### 5. **UM-Webinar-Missed**
- **When Applied**: When webinar starts but user doesn't attend
- **Criteria**: `attended = false` OR `watchTime = 0`
- **Tag ID**: Set in `CLICKFUNNELS_TAG_MISSED`
- **Use Case**: Send replay link and re-engagement campaign

### 6. **UM-Webinar-ReplayAttended**
- **When Applied**: When user watches the replay
- **Criteria**: `isReplay = true` and `attended = true`
- **Tag ID**: Set in `CLICKFUNNELS_TAG_REPLAY_ATTENDED`
- **Use Case**: Track replay engagement separately from live attendance

## Configuration

### Step 1: Get Your Tag IDs from ClickFunnels

1. Log into your ClickFunnels account
2. Go to **Contacts** → **Tags**
3. Create the following tags if they don't exist:
   - `UM-Webinar-Registered`
   - `UM-Webinar-Attended`
   - `UM-Webinar-MostlyAttended`
   - `UM-Webinar-PartlyAttended`
   - `UM-Webinar-Missed`
   - `UM-Webinar-ReplayAttended`
4. Click on each tag and note the **Tag ID** from the URL:
   - URL format: `https://app.myclickfunnels.com/workspaces/{workspace_id}/tags/{TAG_ID}`
   - Example: If URL is `.../tags/368586`, then Tag ID is `368586`

### Step 2: Update .env File

```bash
# ClickFunnels 2.0 API
CLICKFUNNELS_API_KEY="your_api_key_here"
CLICKFUNNELS_WORKSPACE_ID="your_workspace_id"
CLICKFUNNELS_TEAM_ID="your_team_id"

# ClickFunnels Tag IDs
CLICKFUNNELS_TAG_REGISTERED="368586"        # UM-Webinar-Registered
CLICKFUNNELS_TAG_ATTENDED="368587"          # UM-Webinar-Attended
CLICKFUNNELS_TAG_MOSTLY_ATTENDED="368588"   # UM-Webinar-MostlyAttended
CLICKFUNNELS_TAG_PARTLY_ATTENDED="368589"   # UM-Webinar-PartlyAttended
CLICKFUNNELS_TAG_MISSED="368590"            # UM-Webinar-Missed
CLICKFUNNELS_TAG_REPLAY_ATTENDED="368591"   # UM-Webinar-ReplayAttended
```

### Step 3: Restart Your Application

```bash
npm run dev
```

## How It Works

### Registration Flow
1. User registers for webinar
2. System calls `syncWebinarRegistrationToClickFunnels()`
3. Contact created/updated in ClickFunnels
4. **UM-Webinar-Registered** tag applied
5. Custom attributes saved (webinar_id, webinar_title, registered_at, etc.)

### Attendance Tracking Flow
1. User joins webinar → Session tracking starts
2. System tracks `watchTime` and `videoPosition` in real-time
3. User leaves webinar → `action: 'leave'` sent to `/api/tracking/session`
4. System calculates attendance metrics:
   - Total watch time
   - Video position when left
   - Whether reached offer CTA
5. System calls `syncAttendanceToClickFunnels()`
6. Contact looked up by email
7. Appropriate tags applied based on criteria
8. Custom attributes updated with attendance data

### Tag Application Logic

```typescript
// Pseudo-code
if (watchTime === 0) {
  apply: UM-Webinar-Missed
} else {
  apply: UM-Webinar-Attended
  
  if (isReplay) {
    apply: UM-Webinar-ReplayAttended
  }
  
  if (reachedOfferCTA) {
    apply: UM-Webinar-MostlyAttended
  } else if (watchTime >= 2400) { // 40 minutes
    apply: UM-Webinar-PartlyAttended
  }
}
```

## Custom Attributes Tracked

When attendance is synced, the following custom attributes are updated in ClickFunnels:

```json
{
  "last_attendance_date": "2025-11-12T10:30:00Z",
  "watch_time_minutes": 45,
  "watch_percentage": 75,
  "reached_offer": true,
  "left_at": "2025-11-12T11:15:00Z"
}
```

## Testing

### Test Registration
```bash
# Start dev server
npm run dev

# Run test script
node test-clickfunnels.js
```

### Test Attendance Tracking
1. Register for a webinar
2. Join the webinar room
3. Watch for a specific duration
4. Leave the webinar
5. Check ClickFunnels contact to verify:
   - Tags applied correctly
   - Custom attributes updated
   - Watch time recorded

### Manual API Test
```bash
curl -X POST http://localhost:3000/api/tracking/session \
  -H "Content-Type: application/json" \
  -d '{
    "registrationId": "your_registration_id",
    "webinarId": "your_webinar_id",
    "action": "leave",
    "videoPosition": 2700,
    "watchTime": 2700
  }'
```

## Campaign Examples

### For UM-Webinar-Missed
- **Subject**: "You Missed Something Amazing..."
- **Content**: Send replay link, highlight key takeaways
- **CTA**: "Watch the Replay Now"

### For UM-Webinar-PartlyAttended
- **Subject**: "You Left Before the Best Part..."
- **Content**: Tease the offer/CTA they missed
- **CTA**: "See What You Missed"

### For UM-Webinar-MostlyAttended
- **Subject**: "Special Offer Inside"
- **Content**: Recap the offer, limited time discount
- **CTA**: "Claim Your Bonus"

### For UM-Webinar-ReplayAttended
- **Subject**: "Thanks for Watching the Replay"
- **Content**: Offer still available, social proof
- **CTA**: "Get Started Today"

## Troubleshooting

### Tags Not Being Applied

1. **Check Environment Variables**
   ```bash
   # Verify tag IDs are set
   grep CLICKFUNNELS_TAG .env
   ```

2. **Check Console Logs**
   - Look for "📊 Syncing attendance to ClickFunnels"
   - Look for "🏷️ Applying attendance tags"
   - Check for error messages

3. **Verify Tag IDs in ClickFunnels**
   - Go to ClickFunnels dashboard
   - Navigate to tag and confirm ID from URL

4. **Check Contact Exists**
   - Search for email in ClickFunnels
   - Verify contact was created during registration

### Tags Applied Incorrectly

1. **Check Watch Time Calculation**
   - Verify `totalWatchTime` in database
   - Check `videoPosition` when left

2. **Verify Webinar Duration**
   - Ensure `duration` field set correctly in webinar settings
   - Duration should be in **minutes** in database

3. **Check Offer CTA Threshold**
   - Default: Last 15 minutes of webinar
   - Adjust in code if your offer timing is different

## API Reference

### `syncAttendanceToClickFunnels()`

```typescript
interface AttendanceData {
  email: string                // Contact email
  webinarDuration: number      // Total duration in seconds
  watchTime: number            // Time watched in seconds
  attended: boolean            // Did they attend?
  isReplay?: boolean           // Is this a replay?
  reachedOfferCTA?: boolean    // Reached offer section?
  webinarTitle?: string        // Webinar title for reference
  leftAt?: Date                // When they left
}

// Returns: Promise<boolean>
// true = success, false = failed
```

### `determineAttendanceTags()`

```typescript
// Pure function - no API calls
// Returns array of tag IDs to apply
function determineAttendanceTags(data: {
  webinarDuration: number
  watchTime: number
  attended: boolean
  isReplay?: boolean
  reachedOfferCTA?: boolean
}): string[]
```

## Best Practices

1. **Always Set All Tag IDs**: Even if you don't plan to use a tag immediately, set it up for future campaigns

2. **Test with Real Data**: Use actual webinar durations and watch times to verify tag logic

3. **Monitor Initial Rollout**: Check first 10-20 attendees to ensure tags applied correctly

4. **Update Tag Names**: Keep tag names consistent between your system and ClickFunnels

5. **Custom Attributes**: Use the custom attributes for advanced segmentation in ClickFunnels

6. **Async Processing**: Tagging happens in background - won't slow down user experience

## Future Enhancements

- [ ] Tag removal (e.g., remove "Missed" if they watch replay later)
- [ ] Progressive tagging (e.g., upgrade from "Partly" to "Mostly" if they return)
- [ ] Engagement scoring based on multiple webinars
- [ ] Integration with ClickFunnels automation workflows
- [ ] Bulk retagging for historical data

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify all environment variables are set
3. Test with a single registration first
4. Review ClickFunnels API logs in their dashboard

---

**Last Updated**: November 12, 2025
