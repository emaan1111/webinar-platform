# Zoom Integration - Quick Start Guide

## How to Add a Live Zoom Webinar

### Step 1: Edit Your Webinar
1. Go to **Dashboard** → **Webinars**
2. Click on the webinar you want to edit
3. Scroll to **"Webinar Schedule"** section

### Step 2: Add a Specific Date Schedule
1. Click **"Add New Schedule"** button
2. Select **"Specific Date"** option (the first tab)
3. Choose your date and time
4. Select the appropriate timezone

### Step 3: Enable Zoom Integration
1. **Check the box** "This is a live Zoom session"
2. **Enter your Zoom meeting link** in the text field
   - Example: `https://zoom.us/j/1234567890`
   - Must start with `https://`
3. Click **"Add This Schedule"**

### Step 4: Verify & Save
1. You'll see your schedule listed with a blue **"Live Zoom"** badge
2. The Zoom link will be displayed below the date/time
3. Click **"Save Changes"** at the bottom

## What Happens Next?

### For Your Attendees
1. **Registration**: They register normally through your registration page
2. **Countdown Page**: They see the countdown page before start time
3. **Automatic Redirect**: At start time, they're automatically redirected to your Zoom meeting
4. **ClickFunnels**: They're tagged as registrants and receive your Zoom link via webhook

### For You (Host)
- Start your Zoom meeting as scheduled
- Attendees will join automatically via the link
- All analytics still track attendance
- ClickFunnels receives the Zoom link for email sequences

## Visual Example

```
┌─────────────────────────────────────────┐
│  Webinar Schedule                       │
├─────────────────────────────────────────┤
│  [Add New Schedule]                     │
│                                         │
│  📅 2024-02-15 at 14:00                │
│     Eastern Time (US & Canada)          │
│     🎥 Live Zoom                        │
│     https://zoom.us/j/1234567890       │
│                          [🗑️ Delete]    │
└─────────────────────────────────────────┘
```

## When to Use Zoom vs Simulated Room

### Use Zoom When:
- ✅ You want live, interactive Q&A
- ✅ You need screen sharing with real-time interaction
- ✅ You want attendees to see you live
- ✅ The content changes based on audience feedback
- ✅ You need breakout rooms or other Zoom features

### Use Simulated Room When:
- ✅ You're doing an evergreen webinar
- ✅ The content is pre-recorded
- ✅ You want automated, scheduled playback
- ✅ You don't need live interaction
- ✅ You want to scale without being present

## Hybrid Strategy

You can have **both** Zoom and simulated schedules for the same webinar!

**Example**:
- Monday 2PM: **Live Zoom** (interactive)
- Tuesday 2PM: **Simulated** (automated playback)
- Wednesday 2PM: **Live Zoom** (interactive)
- Thursday 2PM: **Simulated** (automated playback)

Your attendees won't know the difference - they just see available times and register!

## Troubleshooting

### "Please enter a Zoom meeting link for this live session"
- **Solution**: You checked the Zoom box but didn't enter a link. Enter your Zoom URL.

### "Please enter a valid Zoom link starting with https://"
- **Solution**: Your Zoom link must start with `https://`. Example: `https://zoom.us/j/1234567890`

### Zoom Link Not Saving
- **Solution**: Make sure you click "Add This Schedule" first, then "Save Changes" at the bottom.

### Attendees Not Being Redirected
- **Solution**: Check that the schedule start time has passed. Redirect only happens at or after start time.

## Best Practices

1. **Test Your Link**: Join your Zoom meeting first to verify the link works
2. **Start Early**: Join Zoom 10-15 minutes before scheduled time
3. **Enable Waiting Room**: Prevent attendees from joining before you're ready
4. **Record It**: Consider recording for replay functionality
5. **Backup Plan**: Have your simulated video ready in case of technical issues

## Getting Your Zoom Link

### Personal Meeting Room
1. Go to [zoom.us](https://zoom.us)
2. Sign in to your account
3. Click "Meetings" → "Personal Room"
4. Copy your Personal Meeting URL

### Scheduled Meeting
1. Go to [zoom.us](https://zoom.us)
2. Click "Schedule a Meeting"
3. Fill in details and click "Save"
4. Copy the "Join URL" from the meeting details

### Meeting ID Format
If you only have a Meeting ID (e.g., 123 456 7890):
- Convert to: `https://zoom.us/j/1234567890`
- Remove spaces from the ID

## Support

**Questions?** Check out:
- [ZOOM_INTEGRATION_COMPLETE.md](./ZOOM_INTEGRATION_COMPLETE.md) - Full technical details
- [ZOOM_ADMIN_UI_COMPLETE.md](./ZOOM_ADMIN_UI_COMPLETE.md) - Admin UI documentation

**Feature Working?** ✅ Yes! It's fully implemented and ready to use.
