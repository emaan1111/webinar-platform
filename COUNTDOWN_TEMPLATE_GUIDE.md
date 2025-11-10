# Countdown Template Guide

## Overview
Countdown templates are customizable HTML pages that attendees see before your webinar starts. They feature a live countdown timer and automatically redirect to the webinar room when the countdown reaches zero.

---

## ✨ Features

### 1. **Auto-Redirect to Webinar Room**
When the countdown hits 0, attendees are automatically redirected to the live webinar room after 2 seconds.

### 2. **Dynamic Template Variables**
All templates support dynamic placeholders that are replaced with real webinar data.

### 3. **Multiple Countdown Formats**
Templates can use either:
- Single `#countdown` element (shows formatted text like "2d 5h 30m 15s")
- Individual elements (`#days`, `#hours`, `#minutes`, `#seconds`)

---

## 📝 Available Template Variables

### Webinar Information
| Variable | Description | Example |
|----------|-------------|---------|
| `{{webinarTitle}}` | Title of the webinar | "How to Help Your Child Love Islam" |
| `{{webinarDescription}}` | Webinar description/subtitle | "A transformative masterclass for Muslim mothers" |
| `{{webinarDuration}}` | Duration in minutes | "60" |

### Date & Time
| Variable | Description | Example |
|----------|-------------|---------|
| `{{webinarDate}}` | Formatted date | "Friday, December 15, 2023" |
| `{{webinarTime}}` | Formatted time with timezone | "7:00 PM EST" |
| `{{webinarDateTime}}` | Combined date and time | "Friday, December 15, 2023 at 7:00 PM EST" |
| `{{webinarStartDateTime}}` | ISO 8601 datetime (for JavaScript) | "2023-12-15T19:00:00.000Z" |
| `{{timeZone}}` | Timezone name | "America/New_York" |

### Host Information
| Variable | Description | Example |
|----------|-------------|---------|
| `{{hostName}}` | Name of webinar host | "Ustadha Ariba Farheen" |
| `{{hostEmail}}` | Host email address | "info@emanpower.com" |

### Links
| Variable | Description | Example |
|----------|-------------|---------|
| `{{joinLink}}` | Direct link to webinar room | "http://localhost:3000/room/my-webinar" |
| `{{registrationLink}}` | Registration page link | "http://localhost:3000/w/my-webinar" |

### Organization Details
| Variable | Description | Example |
|----------|-------------|---------|
| `{{organizationName}}` | Your organization name | "Emaan Power Educational Institute" |
| `{{contactEmail}}` | Contact email | "info@emanpower.com" |
| `{{websiteUrl}}` | Website URL | "https://www.emanpower.com" |
| `{{currentYear}}` | Current year | "2025" |

### Countdown Script
| Variable | Description |
|----------|-------------|
| `{{countdown}}` | JavaScript countdown logic (required) |

---

## 🔧 How to Update Template Placeholders

### Method 1: Edit Seed File (For System Templates)

1. **Open the seed file:**
   ```bash
   /Volumes/WD/CODE/Webinar Play 2/prisma/seed-countdown-templates.ts
   ```

2. **Find your template:**
   Look for the template by name (e.g., "Islamic Mothers - Mobile Optimized")

3. **Update the HTML:**
   Replace placeholder values in the HTML code. For example:
   ```html
   <!-- Before -->
   <h3 class="footer-title">Emaan Power Educational Institute</h3>
   
   <!-- After (using variable) -->
   <h3 class="footer-title">{{organizationName}}</h3>
   ```

4. **Reseed the database:**
   ```bash
   cd "/Volumes/WD/CODE/Webinar Play 2"
   npx tsx prisma/seed-countdown-templates.ts
   ```

5. **Restart dev server:**
   ```bash
   # Kill existing server
   pkill -9 node
   
   # Start fresh
   npm run dev
   ```

### Method 2: Via Database (For Custom Templates)

1. **Create a new template** through the UI or API
2. **Use the template variables** listed above in your HTML
3. The system will automatically replace them with real data

---

## 🎨 Creating a Custom Template

### Template Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{webinarTitle}} - Starts Soon</title>
    <style>
        /* Your custom CSS here */
    </style>
</head>
<body>
    <!-- Header -->
    <header>
        <h1>{{webinarTitle}}</h1>
        <p>{{webinarDescription}}</p>
    </header>
    
    <!-- Countdown Section -->
    <section>
        <h2>Webinar Starts In</h2>
        <div>{{webinarDate}} at {{webinarTime}}</div>
        
        <!-- Option 1: Single countdown element -->
        <div id="countdown">Loading...</div>
        
        <!-- Option 2: Individual elements (more control) -->
        <div class="countdown">
            <div>
                <span id="days">00</span>
                <span>Days</span>
            </div>
            <div>
                <span id="hours">00</span>
                <span>Hours</span>
            </div>
            <div>
                <span id="minutes">00</span>
                <span>Minutes</span>
            </div>
            <div>
                <span id="seconds">00</span>
                <span>Seconds</span>
            </div>
        </div>
    </section>
    
    <!-- Call to Action -->
    <section>
        <a href="{{joinLink}}">Enter Webinar Room</a>
        <button onclick="setReminder()">Set Reminder</button>
        <button onclick="shareOnWhatsApp()">Share on WhatsApp</button>
    </section>
    
    <!-- Footer -->
    <footer>
        <p>{{organizationName}}</p>
        <p>© {{currentYear}} All rights reserved.</p>
    </footer>
    
    <!-- Required: Countdown Script -->
    <script>
        {{countdown}}
        
        // Optional: Custom functions
        function setReminder() {
            const webinarTitle = "{{webinarTitle}}";
            const webinarDescription = "{{webinarDescription}}";
            const targetDate = new Date("{{webinarStartDateTime}}");
            
            const startDate = targetDate.toISOString().replace(/-|:|\\.\\d\\d\\d/g, "");
            const endDate = new Date(targetDate.getTime() + {{webinarDuration}} * 60000)
                .toISOString().replace(/-|:|\\.\\d\\d\\d/g, "");
            
            const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(webinarTitle)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(webinarDescription)}&location=Online`;
            
            window.open(googleCalendarUrl, '_blank');
        }
        
        function shareOnWhatsApp() {
            const shareText = "Join me for this webinar: {{webinarTitle}}. Register here: {{registrationLink}}";
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
            window.open(whatsappUrl, '_blank');
        }
    </script>
</body>
</html>
```

---

## 🚀 Auto-Redirect Functionality

### How It Works

1. **Countdown reaches 0**: Timer stops
2. **Message displays**: "Webinar is Live! Redirecting..."
3. **Automatic redirect**: After 2 seconds, user is sent to webinar room
4. **Redirect URL**: Uses `{{joinLink}}` variable (e.g., `/room/webinar-slug`)

### Customizing Redirect Behavior

The countdown script automatically handles redirect. You can modify the delay by editing:

```javascript
// In the countdown script
setTimeout(function() {
    window.location.href = joinUrl;
}, 2000); // Change 2000 (2 seconds) to your preferred delay
```

### Manual Redirect Button

You can also add a manual button that works before countdown ends:

```html
<a href="{{joinLink}}" class="join-button">
    Enter Webinar Room Now
</a>
```

---

## 📱 Responsive Design Best Practices

### Mobile-First Approach
```css
/* Base styles for mobile */
.container {
    padding: 15px;
}

/* Tablet and up */
@media (min-width: 768px) {
    .container {
        padding: 25px;
    }
}

/* Desktop */
@media (min-width: 1024px) {
    .container {
        padding: 40px;
    }
}
```

### Touch-Friendly Buttons
```css
.button {
    min-height: 44px; /* iOS minimum touch target */
    min-width: 44px;
    padding: 12px 20px;
    font-size: 16px; /* Prevents zoom on iOS */
}
```

---

## 🎯 Testing Your Template

### 1. **Preview in UI**
- Go to webinar edit page
- Select your template
- Click "Preview" button
- Check layout and styling

### 2. **Test Countdown Logic**
Create a test webinar with a start time a few minutes in the future:

```bash
# Test URL format
http://localhost:3000/countdown/your-webinar-slug?s=schedule-id
```

### 3. **Test Auto-Redirect**
Set webinar start time to current time + 2 minutes, then watch the countdown and verify redirect happens.

### 4. **Test on Multiple Devices**
- Desktop (Chrome, Firefox, Safari)
- Tablet (portrait and landscape)
- Mobile (iOS Safari, Chrome)

---

## 🔍 Troubleshooting

### Template Not Showing in UI
```bash
# 1. Check database
npx tsx -e "import { PrismaClient } from '@prisma/client'; const p = new PrismaClient(); p.countdownTemplate.findMany().then(t => console.log(t.map(x => x.name))).finally(() => p.\$disconnect())"

# 2. Regenerate Prisma client
npx prisma generate

# 3. Reseed templates
npx tsx prisma/seed-countdown-templates.ts

# 4. Restart server
pkill -9 node && npm run dev
```

### Countdown Not Working
- Ensure `{{countdown}}` placeholder is in a `<script>` tag
- Check browser console for JavaScript errors
- Verify `id="countdown"` exists in HTML OR individual elements (#days, #hours, etc.)

### Variables Not Replacing
- Check spelling of variable names (case-sensitive)
- Ensure variables are wrapped in double curly braces: `{{variableName}}`
- Restart server after template changes

### Auto-Redirect Not Working
- Check browser console for errors
- Verify `{{joinLink}}` is generating correct URL
- Test with browser dev tools Network tab open

---

## 📋 Template Checklist

When creating a new template, ensure:

- [ ] All template variables are properly formatted
- [ ] `{{countdown}}` script is included in `<script>` tag
- [ ] Countdown element(s) exist: `#countdown` OR `#days`, `#hours`, `#minutes`, `#seconds`
- [ ] Links use proper variables: `{{joinLink}}`, `{{registrationLink}}`
- [ ] Responsive design for mobile, tablet, desktop
- [ ] Touch-friendly buttons (min 44px)
- [ ] Fast loading (optimized images, minimal external resources)
- [ ] Accessible (proper ARIA labels, semantic HTML)
- [ ] Tested on multiple browsers and devices

---

## 🎨 Example: Islamic Mothers Template

The "Islamic Mothers - Mobile Optimized" template includes:

### ✨ Features
- Purple/Teal gradient theme
- Animated patterns in background
- Live countdown with gold borders
- Video preview placeholder
- Bonus gift showcase card
- Social sharing buttons (WhatsApp, Facebook)
- Google Calendar reminder integration
- Mobile-optimized layouts
- Auto-redirect when countdown ends

### 🎨 Color Scheme
```css
--primary: #4a3b6b;    /* Purple */
--secondary: #2c7a7b;  /* Teal */
--accent: #d53f8c;     /* Pink */
--gold: #d69e2e;       /* Gold */
```

### 📱 Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

---

## 🔗 Related Documentation

- [Webinar Creation Guide](./WEBINAR_CREATION_FIXES.md)
- [Template System Summary](./TEMPLATE_SYSTEM_SUMMARY.md)
- [Simulated Webinar Guide](./SIMULATED_WEBINAR_GUIDE.md)

---

## 💡 Tips & Best Practices

1. **Keep it Fast**: Minimize external resources, optimize images
2. **Mobile-First**: Design for mobile, enhance for desktop
3. **Clear CTA**: Make join/register buttons prominent
4. **Social Proof**: Include testimonials, attendee count, etc.
5. **Urgency**: Highlight limited time, countdown visibility
6. **Branding**: Use consistent colors, fonts, logos
7. **Accessibility**: Proper contrast, keyboard navigation, ARIA labels
8. **Test Everything**: Different browsers, devices, timezones

---

**Last Updated**: November 2, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready
