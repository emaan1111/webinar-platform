# Enhanced Countdown Template v2

## File Location
`/templates/countdown-emaan-power-v2.html`

## Features

### 🎨 Design Enhancements
- **More prominent countdown banner** with vibrant pink-red gradient
- **Pulsing animation** on countdown banner to draw attention
- **Better visual hierarchy** with larger, bolder countdown numbers
- **Responsive layout** that works on all devices
- **Professional color scheme** with dusty rose, teal, and gold accents

### ⏰ Auto-Redirect Functionality
**Automatic redirect when webinar starts:**
```javascript
// When countdown reaches 0, automatically redirect
if (distance <= 0) {
    clearInterval(countdownFunction);
    
    // Change button text
    enterButton.innerText = "Webinar is Live! Redirecting...";
    
    // Auto redirect after 2 seconds
    setTimeout(function() {
        window.location.href = webinarData.broadcastUrl;
    }, 2000);
}
```

**Redirect timing:**
- ✅ Countdown reaches 0 (webinar time arrives)
- ⏱️ Wait 2 seconds to show "Redirecting..." message
- 🚀 Automatically redirect to `{{broadcast.url}}`

**NO early redirect** - users cannot enter before the scheduled time.

### 📝 Template Variables

All standard countdown variables are supported:

**Webinar Info:**
- `{{webinar.title}}` - Webinar title
- `{{webinar.description}}` - Webinar description
- `{{webinar.slug}}` - URL slug
- `{{webinar.duration}}` - Duration in minutes

**Schedule Info:**
- `{{schedule.date}}` - Formatted date (e.g., "July 15, 2023")
- `{{schedule.time}}` - Formatted time (e.g., "4:00 PM - 5:30 PM")
- `{{schedule.dateISO}}` - ISO 8601 format for JavaScript countdown (e.g., "2023-07-15T16:00:00Z")

**Host Info:**
- `{{host.name}}` - Host/instructor name

**URLs:**
- `{{broadcast.url}}` - Webinar room URL (redirect destination)
- `/w/{{webinar.slug}}` - Registration page URL (for sharing)

## Usage

### 1. Create New Countdown Template
1. Go to Dashboard → Templates → Countdown Pages
2. Click "Create New Template"
3. Copy contents from `/templates/countdown-emaan-power-v2.html`
4. Paste into the HTML editor
5. Save as "Enhanced Countdown v2"

### 2. Assign to Webinar
1. Edit webinar settings
2. Go to "Countdown Page" section
3. Select "Enhanced Countdown v2" from dropdown
4. Save webinar

### 3. Test Auto-Redirect
To test the auto-redirect functionality:

**Option 1: Use Browser DevTools**
```javascript
// Open browser console on countdown page
// Fast-forward the countdown
const testDate = new Date();
testDate.setSeconds(testDate.getSeconds() + 5); // Set countdown to 5 seconds
// Modify the countDownDate variable
```

**Option 2: Create Test Webinar**
1. Create a test webinar
2. Set schedule time to 2 minutes from now
3. Register as attendee
4. Open countdown page
5. Wait for countdown to reach 0
6. Should auto-redirect to webinar room

## Countdown Behavior

### Before Webinar Starts
- ✅ Countdown timer displays days, hours, minutes, seconds
- ✅ "Enter Webinar Room" button is DISABLED
- ✅ Page refreshes automatically every second

### When Webinar Starts (distance <= 0)
1. Countdown stops and shows "00:00:00:00"
2. Button becomes enabled
3. Button text changes to "Webinar is Live! Redirecting..."
4. **After 2 seconds**: Automatic redirect to `{{broadcast.url}}`

### User Can Also Click Manually
- If auto-redirect fails or user clicks button first
- Button is clickable as soon as countdown reaches 0
- Clicking manually also redirects to webinar room

## Comparison with v1

| Feature | v1 (countdown-emaan-power.html) | v2 (countdown-emaan-power-v2.html) |
|---------|--------------------------------|-----------------------------------|
| Auto-redirect | ❌ No | ✅ Yes (2 sec delay) |
| Countdown banner | Standard | Vibrant with pulse animation |
| Button behavior | Manual click only | Manual + auto-redirect |
| Visual prominence | Medium | High (pulsing, larger) |
| Enter early | 15 min before | ❌ No early entry |

## Customization

### Change Auto-Redirect Delay
Edit line 639 in the template:
```javascript
// Change 2000 to desired milliseconds (e.g., 5000 = 5 seconds)
setTimeout(function() {
    window.location.href = webinarData.broadcastUrl;
}, 2000); // <-- Change this number
```

### Disable Auto-Redirect (Manual Only)
Remove or comment out lines 635-641:
```javascript
// Comment out this section to disable auto-redirect
// setTimeout(function() {
//     window.location.href = webinarData.broadcastUrl;
// }, 2000);
```

### Change Countdown Colors
Edit CSS variables at the top:
```css
:root {
    --countdown-bg: #B02E5C; /* Change this for banner color */
    --primary-color: #9E7A7A;
    --accent-color: #D4AF37;
    /* etc. */
}
```

### Change Pulse Animation Speed
Edit animation duration (line 60):
```css
animation: pulse 2s infinite; /* Change 2s to desired speed */
```

## Browser Compatibility
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Notes
- Auto-redirect uses `window.location.href` (not target="_blank")
- Countdown uses client-side JavaScript (runs in user's browser)
- ISO date format ensures correct timezone handling
- Social sharing buttons use dynamic URL from `{{webinar.slug}}`
