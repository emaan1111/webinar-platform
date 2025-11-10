# Countdown Page - Quick Reference ⏰

## ✅ What's Implemented

### 1. **Auto-Redirect to Webinar Room**
- ✅ When countdown hits 0, shows "Webinar is Live! Redirecting..."
- ✅ Automatically redirects to webinar room after 2 seconds
- ✅ Uses `{{joinLink}}` variable for redirect URL
- ✅ Works with both single countdown and individual day/hour/minute/second elements

### 2. **Template Variables**
All templates support these dynamic placeholders:

**Webinar Info:**
- `{{webinarTitle}}` - Webinar title
- `{{webinarDescription}}` - Description/subtitle
- `{{webinarDuration}}` - Duration in minutes

**Date/Time:**
- `{{webinarDate}}` - "Friday, December 15, 2023"
- `{{webinarTime}}` - "7:00 PM EST"
- `{{webinarDateTime}}` - Combined date and time
- `{{webinarStartDateTime}}` - ISO format for JavaScript
- `{{timeZone}}` - Timezone name

**Host:**
- `{{hostName}}` - Host name
- `{{hostEmail}}` - Host email

**Links:**
- `{{joinLink}}` - Link to webinar room
- `{{registrationLink}}` - Link to registration page

**Organization:**
- `{{organizationName}}` - Your org name
- `{{contactEmail}}` - Contact email
- `{{websiteUrl}}` - Website URL
- `{{currentYear}}` - Current year

**Script:**
- `{{countdown}}` - JavaScript countdown logic (REQUIRED)

---

## 🚀 How to Update Template Placeholders

### Quick Steps:

1. **Open seed file:**
   ```
   prisma/seed-countdown-templates.ts
   ```

2. **Find your template** (search for template name)

3. **Replace hardcoded values with variables:**
   ```html
   <!-- Before -->
   <h1>How to Help Your Child Love Islam</h1>
   
   <!-- After -->
   <h1>{{webinarTitle}}</h1>
   ```

4. **Reseed database:**
   ```bash
   npx tsx prisma/seed-countdown-templates.ts
   ```

5. **Restart server:**
   ```bash
   pkill -9 node && npm run dev
   ```

---

## 🎯 Example Template Structure

```html
<!DOCTYPE html>
<html>
<head>
    <title>{{webinarTitle}}</title>
    <style>/* Your CSS */</style>
</head>
<body>
    <h1>{{webinarTitle}}</h1>
    <p>{{webinarDescription}}</p>
    
    <!-- Countdown Section -->
    <div>{{webinarDate}} at {{webinarTime}}</div>
    
    <!-- Option 1: Single element -->
    <div id="countdown">Loading...</div>
    
    <!-- Option 2: Individual elements -->
    <div>
        <span id="days">00</span> Days
        <span id="hours">00</span> Hours
        <span id="minutes">00</span> Minutes
        <span id="seconds">00</span> Seconds
    </div>
    
    <!-- Join Button -->
    <a href="{{joinLink}}">Enter Webinar Room</a>
    
    <!-- Footer -->
    <footer>
        <p>{{organizationName}}</p>
        <p>© {{currentYear}}</p>
    </footer>
    
    <!-- REQUIRED: Countdown script -->
    <script>
        {{countdown}}
        
        // Optional: Add custom functions
        function shareOnWhatsApp() {
            const text = "Join: {{webinarTitle}} - {{registrationLink}}";
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        }
    </script>
</body>
</html>
```

---

## 🔧 Testing

### Test Countdown:
```
http://localhost:3000/countdown/your-webinar-slug?s=schedule-id
```

### Test Auto-Redirect:
1. Create test webinar with start time = current time + 2 minutes
2. Open countdown page
3. Wait for countdown to reach 0
4. Verify redirect to webinar room

---

## 📱 Access URLs

### Countdown Page:
```
http://localhost:3000/countdown/[webinar-slug]?s=[schedule-id]
```

### Webinar Room (after redirect):
```
http://localhost:3000/room/[webinar-slug]
```

---

## 🎨 Current Templates

1. **Default** - Gradient hero layout
2. **Islamic Mothers - Mobile Optimized** - Purple/teal theme with bonus gift

---

## 📚 Full Documentation

See `COUNTDOWN_TEMPLATE_GUIDE.md` for complete details on:
- All template variables
- Creating custom templates
- Responsive design best practices
- Troubleshooting
- Testing checklist

---

**Status**: ✅ Ready to Use  
**Auto-Redirect**: ✅ Enabled (2-second delay)  
**Template Variables**: ✅ All working
