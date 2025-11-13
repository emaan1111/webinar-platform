# ClickFunnels Custom Fields Update

## Summary
Updated the ClickFunnels integration to send three additional custom fields when a user registers for a webinar.

## Changes Made

### 1. Registration API Update
**File:** `src/app/api/webinars/[id]/register/route.ts`

Added logic to generate and pass three new fields to ClickFunnels:

#### UM Webinar Link (Countdown Page)
```typescript
const countdownLink = `${baseUrl}/countdown/${slug}?r=${registrationId}&s=${scheduleId}`
```
- This is the direct link to the countdown page for this specific registration
- Includes the registration ID and schedule ID as query parameters
- User can bookmark this link to return to their countdown page

#### Personal Invite Link (Referral Link)
```typescript
const referralLink = `${baseUrl}/w/${slug}?ref=${uniqueReferralCode}`
```
- This is the user's unique referral link they can share
- Contains their unique referral code
- When others register using this link, they'll be tracked as referrals

#### UM Webinar Time (US Eastern Time)
```typescript
const formattedWebinarTime = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  dateStyle: 'full',
  timeStyle: 'long'
}).format(scheduledStartTime)
```
- Converts the scheduled time to US/Eastern timezone
- Formatted as: "Wednesday, November 13, 2025 at 4:41:28 PM EST"
- Easy for users to understand when their webinar is scheduled

### 2. ClickFunnels Library Update
**File:** `src/lib/clickfunnels.ts`

Updated the `syncWebinarRegistrationToClickFunnels` function to accept and send the new fields:

```typescript
custom_attributes: {
  webinar_id: data.webinarId,
  webinar_title: data.webinarTitle,
  registered_at: new Date().toISOString(),
  scheduled_start_time: data.scheduledStartTime?.toISOString() || null,
  um_webinar_link: data.countdownLink || null, // NEW
  personal_invite_link: data.referralLink || null, // NEW
  um_webinar_time: data.formattedWebinarTime || null, // NEW
}
```

## Custom Field Names in ClickFunnels

These fields will be sent to ClickFunnels with the following names:

| Field Name | Description | Example Value |
|------------|-------------|---------------|
| `um_webinar_link` | Countdown page URL | `https://yoursite.com/countdown/loveislam?r=abc123&s=xyz789` |
| `personal_invite_link` | User's referral link | `https://yoursite.com/w/loveislam?ref=WJ7X0U` |
| `um_webinar_time` | Scheduled time in EST | `Wednesday, November 13, 2025 at 4:41:28 PM EST` |

## Usage in ClickFunnels

You can now use these custom fields in:
- **Email sequences** - Send users their countdown link and referral link
- **Thank you pages** - Display their webinar time and links
- **Follow-up automations** - Remind them of their scheduled time
- **Referral campaigns** - Share their personal invite link

### Example Email Template Variables:
```
Hi {{contact.first_name}},

Your webinar is scheduled for: {{contact.um_webinar_time}}

Click here to access your countdown page: {{contact.um_webinar_link}}

Want to invite friends? Share your personal invite link:
{{contact.personal_invite_link}}
```

## Technical Details

### Base URL Configuration
The links are built using the `NEXT_PUBLIC_BASE_URL` environment variable:
- **Development:** `http://localhost:3000`
- **Production:** Your actual domain (e.g., `https://webinar.ummaheducators.com`)

Make sure to set this in your `.env` file:
```env
NEXT_PUBLIC_BASE_URL=https://webinar.ummaheducators.com
```

### Timezone Handling
- Uses JavaScript's `Intl.DateTimeFormat` API
- Always converts to `America/New_York` timezone (US/Eastern)
- Includes full date and long time format
- Automatically handles EST/EDT (Daylight Saving Time)

### Error Handling
- If webinar slug is missing, links will be null (not sent)
- If time formatting fails, field will be null
- ClickFunnels sync runs asynchronously and doesn't block registration response
- Errors are logged but don't prevent user registration

## Testing

To test these fields are being sent:

1. Register for a webinar
2. Check ClickFunnels contact record
3. Navigate to "Custom Fields" section
4. Look for:
   - `um_webinar_link`
   - `personal_invite_link`
   - `um_webinar_time`

## Benefits

1. **Better User Experience**
   - Users receive direct links to their countdown page
   - Clear understanding of when their webinar is (in their timezone context)
   - Easy sharing with referral link

2. **Marketing Automation**
   - Send reminder emails with direct countdown links
   - Encourage referrals by highlighting their personal invite link
   - Time-based triggers using um_webinar_time

3. **Reduced Support**
   - Users can easily find their countdown page
   - Clear webinar time reduces confusion
   - Referral link is readily available

## Backward Compatibility

✅ This change is backward compatible:
- Existing contacts won't be affected
- New registrations will have these fields
- Fields are optional (null values are handled)
- Old integrations continue to work

## Next Steps

Optional enhancements you could add:

1. **Add timezone to um_webinar_time**
   - Could add user's local timezone version too
   - Store both EST and user's local time

2. **Track link clicks**
   - Add UTM parameters to links
   - Track which users click their referral links

3. **Update existing contacts**
   - Create migration script to add fields to old registrations
   - Backfill data for users who registered before this update
