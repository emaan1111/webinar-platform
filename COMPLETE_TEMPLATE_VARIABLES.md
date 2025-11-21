# Complete Template Variables Reference

## 📋 All Supported Variables

This document lists **ALL** template variables supported in both Thank You and Countdown page templates.

---

## 🌐 Webinar Variables

| Variable | Example Output | Description | Pages |
|----------|---------------|-------------|-------|
| `{{webinar.title}}` | "How to Help Your Child Love Islam" | Webinar title | Both |
| `{{webinar.description}}` | "A Free Masterclass for Mothers..." | Webinar description/subtitle | Both |
| `{{webinar.duration}}` | `90` | Duration in minutes (number, no quotes in JS) | Both |
| `{{webinar.slug}}` | "child-love-islam" | URL-friendly identifier | Both |
| `{{webinar.registrationUrl}}` | Full registration page URL | For sharing | Both |

### Usage Example:
```html
<h1>{{webinar.title}}</h1>
<p>{{webinar.description}}</p>
<p>Duration: {{webinar.duration}} minutes</p>

<script>
const webinarData = {
    title: "{{webinar.title}}",
    registrationUrl: window.location.origin + "/w/{{webinar.slug}}",
    duration: {{webinar.duration}} // No quotes - it's a number
};
</script>
```

---

## 👤 Host Variables

| Variable | Example Output | Description | Pages |
|----------|---------------|-------------|-------|
| `{{host.name}}` | "Ustadha Ariba Farheen" | Host's full name | Both |
| `{{host.email}}` | "ariba@example.com" | Host's email address | Both |

### Usage Example:
```html
<p>Hosted by: {{host.name}}</p>
<p>© 2023 {{host.name}}. All rights reserved.</p>
<h2>Watch This Message From {{host.name}}</h2>
```

---

## 📅 Schedule Variables

| Variable | Example Output | Description | Pages |
|----------|---------------|-------------|-------|
| `{{schedule.date}}` | "Wednesday, July 15, 2023" | Human-readable date | Both |
| `{{schedule.time}}` | "4:00 PM US/Canada Eastern Time (EST)" | Time with timezone | Both |
| `{{schedule.dateTime}}` | "Wednesday, July 15, 2023 at 4:00 PM EST" | Combined | Both |
| `{{schedule.dateISO}}` | "2023-07-15T16:00:00Z" | ISO format for JavaScript | Both |
| `{{timeZone}}` | "US/Canada Eastern Time (EST)" | Friendly timezone name | Both |

### Usage Example:
```html
<div class="time-item">
    <i class="fas fa-calendar-alt"></i>
    <span>{{schedule.date}}</span>
</div>
<div class="time-item">
    <i class="fas fa-clock"></i>
    <span>{{schedule.time}}</span>
</div>

<script>
// For countdown timer - MUST use dateISO!
const countDownDate = new Date("{{schedule.dateISO}}").getTime();

const webinarData = {
    scheduleDate: "{{schedule.date}}",
    scheduleTime: "{{schedule.time}}",
    scheduleDateISO: "{{schedule.dateISO}}"
};
</script>
```

---

## 👥 Attendee Variables (Thank You Pages Only)

| Variable | Example Output | Description |
|----------|---------------|-------------|
| `{{attendee.name}}` | "Sarah Johnson" | Registered attendee's name |
| `{{attendee.email}}` | "sarah@example.com" | Registered attendee's email |
| `{{registration.id}}` | "clx123abc..." | Unique registration ID |

### Usage Example:
```html
<p>Hi {{attendee.name}},</p>
<p>You're all set! We've sent confirmation to {{attendee.email}}</p>
```

---

## 🔗 Link Variables

| Variable | Points To | Description | Pages |
|----------|-----------|-------------|-------|
| `{{broadcast.url}}` | `/room/webinar-slug?r=reg123&s=sch456` | Live webinar room (Enter button) | Both |
| `{{webinar.registrationUrl}}` | Full registration page URL | For sharing with others | Both |
| `{{referralLink}}` | Registration URL + referral code | Personalized sharing link | Thank You |
| `{{referralCode}}` | "ABC123" | User's unique referral code | Thank You |
| `{{whatsappReferralLink}}` | Pre-formatted WhatsApp share URL | WhatsApp share with message | Thank You |

### Usage Example:
```html
<!-- Enter Webinar Button -->
<button onclick="window.location.href='{{broadcast.url}}'">
    Enter Webinar Room
</button>

<!-- OR -->
<a href="{{broadcast.url}}">Join Webinar</a>

<!-- Share Link Input -->
<input type="text" id="shareLink" value="" readonly>

<script>
const webinarData = {
    broadcastUrl: "{{broadcast.url}}",
    registrationUrl: window.location.origin + "/w/{{webinar.slug}}"
};

// Set the share link value
document.getElementById('shareLink').value = webinarData.registrationUrl;

// Enter button click handler
document.getElementById("enterButton").addEventListener("click", function() {
    window.location.href = webinarData.broadcastUrl;
});
</script>
```

---

## 📧 Social Sharing (Thank You Pages)

| Variable | Example | Description |
|----------|---------|-------------|
| `{{whatsappShareMessage}}` | Custom share message | Pre-defined WhatsApp message |
| `{{facebookShareMessage}}` | Custom share message | Pre-defined Facebook message |

### Usage Example:
```javascript
function shareOnWhatsApp() {
    const message = `I just registered for "${webinarData.title}". Join me! ${webinarData.registrationUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

function shareOnFacebook() {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(webinarData.registrationUrl)}`;
    window.open(url, '_blank');
}

function shareOnTwitter() {
    const text = `I just registered for "${webinarData.title}". Join me!`;
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(webinarData.registrationUrl)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}
```

---

## 📆 Calendar Links (Thank You Pages)

| Variable | Type | Description |
|----------|------|-------------|
| `{{calendarLink}}` | Google Calendar URL | Add to Google Calendar |
| `{{googleCalendarLink}}` | Same as above | Alternative name |
| `{{appleCalendarLink}}` | .ics data URL | Apple Calendar / Outlook |
| `{{icsDownload}}` | API endpoint | Download .ics file |

### Usage Example:
```html
<button onclick="addToGoogleCalendar()">
    <i class="fab fa-google"></i> Google Calendar
</button>
<button onclick="downloadICS()">
    <i class="fab fa-apple"></i> Apple Calendar
</button>

<script>
function addToGoogleCalendar() {
    const title = "{{webinar.title}}";
    const details = "You're registered for this webinar. Don't miss it!";
    const location = "Online Webinar";
    
    const startDate = new Date("{{schedule.dateISO}}");
    const endDate = new Date(startDate.getTime() + ({{webinar.duration}} * 60000));
    
    const formatDate = (date) => {
        return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    };
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}&dates=${formatDate(startDate)}/${formatDate(endDate)}`;
    
    window.open(googleCalendarUrl, '_blank');
}

function downloadICS() {
    const title = "{{webinar.title}}";
    const startDate = new Date("{{schedule.dateISO}}");
    const endDate = new Date(startDate.getTime() + ({{webinar.duration}} * 60000));
    
    const formatICSDate = (date) => {
        return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    };
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Webinar Platform//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
DTSTAMP:${formatICSDate(new Date())}
SUMMARY:${title}
DESCRIPTION:You're registered for this webinar
LOCATION:Online Webinar
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'webinar.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
</script>
```

---

## 🎨 Branding Variables (Optional)

| Variable | Example | Description |
|----------|---------|-------------|
| `{{organizationName}}` | "Emaan Power" | Organization name |
| `{{contactEmail}}` | "contact@example.com" | Support email |
| `{{websiteUrl}}` | "https://example.com" | Website URL |
| `{{primaryColor}}` | "#9E7A7A" | Brand primary color |
| `{{accentColor}}` | "#D4AF37" | Brand accent color |
| `{{logoUrl}}` | "https://..." | Logo image URL |

---

## 🔧 Special Variables

| Variable | Output | Description | Pages |
|----------|--------|-------------|-------|
| `{{currentYear}}` | "2023" | Current year for footer | Both |

### Usage Example:
```html
<footer>
    <p>© {{currentYear}} {{host.name}}. All rights reserved.</p>
</footer>
```

---

## ⚡ Complete Template Example

### Countdown Page with ALL Variables:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{webinar.title}} - Starting Soon</title>
</head>
<body>
    <!-- Hero Section -->
    <h1>{{webinar.title}}</h1>
    <p>{{webinar.description}}</p>
    
    <!-- Schedule Info -->
    <div class="details">
        <p>📅 Date: {{schedule.date}}</p>
        <p>🕐 Time: {{schedule.time}}</p>
        <p>⏱️ Duration: {{webinar.duration}} minutes</p>
        <p>👤 Host: {{host.name}}</p>
    </div>
    
    <!-- Countdown Timer -->
    <div id="countdown">
        <span id="days">00</span>d
        <span id="hours">00</span>h
        <span id="minutes">00</span>m
        <span id="seconds">00</span>s
    </div>
    
    <!-- Enter Button -->
    <button id="enterButton" disabled>Enter Webinar Room</button>
    
    <!-- Share Section -->
    <input type="text" id="shareLink" value="" readonly>
    
    <!-- Footer -->
    <footer>
        <p>© {{currentYear}} {{host.name}}. All rights reserved.</p>
    </footer>
    
    <script>
        // Webinar data from template variables
        const webinarData = {
            title: "{{webinar.title}}",
            registrationUrl: window.location.origin + "/w/{{webinar.slug}}",
            broadcastUrl: "{{broadcast.url}}",
            scheduleDate: "{{schedule.date}}",
            scheduleTime: "{{schedule.time}}",
            scheduleDateISO: "{{schedule.dateISO}}",
            duration: {{webinar.duration}}
        };
        
        // Set share link
        document.getElementById('shareLink').value = webinarData.registrationUrl;
        
        // Countdown timer
        const countDownDate = new Date(webinarData.scheduleDateISO).getTime();
        
        const countdownFunction = setInterval(function() {
            const now = new Date().getTime();
            const distance = countDownDate - now;
            
            if (distance < 0) {
                clearInterval(countdownFunction);
                document.getElementById("enterButton").disabled = false;
                return;
            }
            
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            document.getElementById("days").innerText = days.toString().padStart(2, '0');
            document.getElementById("hours").innerText = hours.toString().padStart(2, '0');
            document.getElementById("minutes").innerText = minutes.toString().padStart(2, '0');
            document.getElementById("seconds").innerText = seconds.toString().padStart(2, '0');
            
            // Enable button 15 minutes before
            if (distance < 15 * 60 * 1000) {
                document.getElementById("enterButton").disabled = false;
            }
        }, 1000);
        
        // Enter webinar
        document.getElementById("enterButton").addEventListener("click", function() {
            window.location.href = webinarData.broadcastUrl;
        });
        
        // Social sharing
        function shareOnWhatsApp() {
            const message = `I just registered for "${webinarData.title}". Join me! ${webinarData.registrationUrl}`;
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
        }
        
        function shareOnFacebook() {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(webinarData.registrationUrl)}`, '_blank');
        }
    </script>
</body>
</html>
```

---

## ✅ Your Template is Complete!

Your countdown template (`countdown-emaan-power.html`) uses these variables correctly:

✅ `{{webinar.title}}` - ✓ Supported  
✅ `{{webinar.description}}` - ✓ Supported  
✅ `{{webinar.slug}}` - ✓ Supported  
✅ `{{webinar.duration}}` - ✓ Supported  
✅ `{{host.name}}` - ✓ Supported  
✅ `{{schedule.date}}` - ✓ Supported  
✅ `{{schedule.time}}` - ✓ Supported  
✅ `{{schedule.dateISO}}` - ✓ Supported  
✅ `{{broadcast.url}}` - ✓ Supported  

**All variables in your template are now fully supported!** 🎉

---

## 🐛 Troubleshooting

### Variables showing as `{{variable.name}}`?
- The backend renderer supports these variables
- Make sure the template is saved in the database
- Check that the webinar has the required data (schedule, host, etc.)
- Refresh the page after registering

### Countdown not working?
- Ensure you're using `{{schedule.dateISO}}` (ISO format)
- Don't use `{{schedule.date}}` for JavaScript Date() - it won't parse correctly

### Enter button not working?
- Make sure you're using `{{broadcast.url}}` not a hardcoded URL
- The URL is automatically generated with registration and schedule IDs

---

**Last Updated**: November 22, 2025
