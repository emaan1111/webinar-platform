# Reminder Management UI - Quick Start Guide

## Overview

The Reminder Management UI allows you to create, edit, and manage email reminders for your webinars through a user-friendly interface.

## Access the UI

1. Go to **Dashboard** → **Webinars**
2. Click on any webinar
3. Click the **"Reminders"** button in the action bar

Or navigate directly to:
```
/dashboard/webinars/{webinarId}/reminders
```

## Features

### ✅ Visual Reminder List
- See all reminders at a glance
- View when each reminder sends (e.g., "24 hours before", "2 hours before")
- See email subject and preview of body
- Active/inactive status indicators
- Quick toggle to activate/deactivate reminders

### ✅ Easy Reminder Creation
- **Quick Templates**: One-click templates for common reminder times
  - 24 Hours Before
  - 2 Hours Before
  - 15 Minutes Before
- **Preset Time Options**: Choose from dropdown (15 mins, 30 mins, 1 hour, 2 hours, 1 day, etc.)
- **Custom Timing**: Set any custom time in minutes

### ✅ Placeholder System
- Click **"Show Placeholders"** to see all available variables
- **Insert directly** into email with one click
- **Copy to clipboard** to paste manually
- Available placeholders:
  - `{{name}}` - Attendee's name
  - `{{email}}` - Attendee's email
  - `{{webinarTitle}}` - Webinar title
  - `{{webinarTime}}` - Formatted time in user's timezone
  - `{{countdownLink}}` - Link to countdown page
  - `{{referralLink}}` - User's unique referral link
  - `{{webinarTimezone}}` - User's timezone

### ✅ HTML Email Editor
- Write HTML directly in the text area
- Use placeholders for personalization
- Full HTML formatting support
- Preview shows first 200 characters

### ✅ Quick Edit & Delete
- Click **Edit** icon to modify any reminder
- Click **Eye** icon to activate/deactivate
- Click **Trash** icon to delete
- All changes take effect immediately

## Usage Examples

### Example 1: Create a 24-Hour Reminder

1. Click **"Add Reminder"**
2. Click **"24 Hours Before"** template button
3. Review the pre-filled subject and body
4. Customize if needed
5. Click **"Create Reminder"**

### Example 2: Create a Custom Reminder

1. Click **"Add Reminder"**
2. Select time from dropdown or choose "Custom"
3. Enter custom minutes (e.g., 360 for 6 hours)
4. Write email subject: `Don't forget: {{webinarTitle}}`
5. Click **"Show Placeholders"**
6. Click **Insert** next to placeholders you want to add
7. Write email body using placeholders
8. Click **"Create Reminder"**

### Example 3: Edit Existing Reminder

1. Find the reminder in the list
2. Click the **Edit** icon (pencil)
3. Modify subject, body, or timing
4. Click **"Update Reminder"**

### Example 4: Temporarily Disable a Reminder

1. Find the reminder in the list
2. Click the **Eye** icon
3. Reminder is now inactive (won't be sent to new registrations)
4. Click **Eye** icon again to reactivate

## Quick Templates

The UI includes 3 pre-built templates to get you started:

### 1. 24 Hours Before
```
Subject: Tomorrow: {{webinarTitle}}
Body: Friendly reminder with countdown link and referral link
```

### 2. 2 Hours Before
```
Subject: Starting Soon: {{webinarTitle}}
Body: Urgent reminder to get ready
```

### 3. 15 Minutes Before
```
Subject: Final Reminder: {{webinarTitle}} starts in 15 minutes!
Body: Last-minute reminder with prominent JOIN NOW button
```

## Best Practices

### Recommended Reminder Schedule

For maximum attendance, use this schedule:

1. **1 Week Before** (10080 minutes)
   - Initial confirmation
   - Build anticipation
   
2. **24 Hours Before** (1440 minutes)
   - Main reminder
   - Include countdown link and details
   
3. **2 Hours Before** (120 minutes)
   - Get ready reminder
   - Last chance to prepare
   
4. **15 Minutes Before** (15 minutes)
   - Final urgent reminder
   - Prominent JOIN button

### Email Writing Tips

1. **Keep it short**: People scan emails quickly
2. **Clear CTA**: Make the countdown link prominent
3. **Use urgency**: "Starting soon!", "Don't miss out!"
4. **Include value**: Remind them why they registered
5. **Add referral link**: Encourage sharing

### HTML Formatting Examples

**Simple Button:**
```html
<a href="{{countdownLink}}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
  Join Webinar
</a>
```

**Countdown Timer Style:**
```html
<div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 16px; border-radius: 8px; text-align: center;">
  <h3 style="margin: 0; color: #92400e;">Starts in 2 Hours!</h3>
  <p style="margin: 8px 0 0 0; color: #78350f;">{{webinarTime}}</p>
</div>
```

## Placeholder Examples

### Personalized Greeting
```html
<h2>Hi {{name}}!</h2>
<p>We're excited to see you at <strong>{{webinarTitle}}</strong>!</p>
```

### Time with Timezone
```html
<p><strong>When:</strong> {{webinarTime}}</p>
<p><strong>Your timezone:</strong> {{webinarTimezone}}</p>
```

### Countdown Link as Button
```html
<p>
  <a href="{{countdownLink}}" style="...">
    Go to Countdown Page
  </a>
</p>
```

### Referral Link Section
```html
<p>Invite friends and earn rewards:</p>
<p><a href="{{referralLink}}">{{referralLink}}</a></p>
<p>Share this link to get credit for referrals!</p>
```

## Troubleshooting

### Reminders Not Showing Up
- Make sure you ran the Prisma migration
- Check browser console for errors
- Verify you're authenticated

### Changes Not Saving
- Check server logs for errors
- Verify required fields are filled
- Make sure email body is valid HTML

### Placeholders Not Working
- Double-check spelling: `{{name}}` not `{name}`
- Use exact case as shown in placeholder list
- Make sure no extra spaces: `{{name}}` not `{{ name }}`

### "Eye" Icon Not Toggling
- Refresh the page
- Check if reminder is being used
- Look for error messages in UI

## Advanced Features

### Testing a Reminder

To test before going live:
1. Create a test webinar
2. Add a reminder set to 1 minute before
3. Register yourself
4. Wait for the cron job to run
5. Check your email

### Bulk Create Reminders

For the same schedule across multiple webinars:
1. Create reminders for one webinar
2. Copy the subject and body
3. Go to other webinars and paste

### Monitoring Reminder Performance

Check the API or database to see:
- How many reminders were sent
- How many failed
- Which reminders have best open rates (requires email tracking)

## Integration with Registration Flow

When someone registers:
1. ✅ System automatically schedules all **active** reminders
2. ✅ Only **future** reminders are scheduled
3. ✅ Reminders are personalized with user's data
4. ✅ Reminders are sent at the scheduled time via cron job

## Keyboard Shortcuts

- **Esc**: Close the form
- **Ctrl/Cmd + Enter**: Submit form (when focused)

## Mobile Support

The UI is fully responsive and works on:
- ✅ Desktop
- ✅ Tablet
- ✅ Mobile phones

## Next Steps

1. ✅ Create your first reminder using a quick template
2. ✅ Customize the email content
3. ✅ Add more reminders for different timeframes
4. ✅ Test with a registration
5. ✅ Monitor performance and adjust

## Support

For issues or questions:
- Check server logs
- Verify Prisma migration was run
- Check cron job is running
- Review the REMINDER_SYSTEM_COMPLETE.md documentation
