# ✨ Auto Convert Feature

## Overview
The **Auto Convert** button automatically converts common text patterns in your HTML templates into dynamic template variables. This saves time when creating templates and ensures consistency.

## Location
The Auto Convert button is available in:
- **Thank You Page Templates** editor (`/dashboard/templates/thank-you`)
- **Countdown Page Templates** editor (`/dashboard/templates/countdown`)

Look for the purple gradient button labeled "✨ Auto Convert" next to the Code/Visual editor toggle.

## How It Works

### 1. Click Auto Convert
When you click the button, the system scans your HTML code for common patterns and automatically replaces them with template variables.

### 2. Automatic Replacements

#### **Thank You Pages**
The auto-converter replaces:

- **Titles & Headings**
  - `<title>Your Webinar Title</title>` → `<title>{{webinar.title}}</title>`
  - `<h1>Your Webinar Title</h1>` → `<h1>{{webinar.title}}</h1>`

- **Dates & Times**
  - `Date: July 15, 2023` → `Date: {{schedule.date}}`
  - `Time: 4:00 PM - 5:30 PM` → `Time: {{schedule.time}}`
  - `Duration: 90 minutes` → `Duration: {{webinar.duration}} minutes`

- **Host Information**
  - `Host: John Doe` → `Host: {{host.name}}`
  - `Speaker: Jane Smith` → `Speaker: {{host.name}}`

- **Links**
  - Zoom/Meet URLs → `{{broadcast.url}}`
  - Registration URLs → `{{webinar.registrationUrl}}`
  - Google Calendar links → Converted to `onclick="addToGoogleCalendar()"`

- **Variable Normalization**
  - Old format `{{webinarTitle}}` → New format `{{webinar.title}}`
  - Old format `{{hostName}}` → New format `{{host.name}}`
  - Old format `{{joinLink}}` → New format `{{broadcast.url}}`

#### **Countdown Pages**
Additional countdown-specific replacements:

- **Countdown Timer JavaScript**
  - `new Date("2023-07-15T16:00:00Z")` → `new Date("{{schedule.dateISO}}")`
  - Countdown date variables → `{{schedule.dateISO}}`

- **Enter Button Links**
  - `window.location.href = "https://zoom.us/..."` → `window.location.href = "{{broadcast.url}}"`

- **Script Variables**
  - `scheduleDateISO: "2023-07-15..."` → `scheduleDateISO: "{{schedule.dateISO}}"`
  - `title: "Webinar Title"` → `title: "{{webinar.title}}"`
  - `broadcastUrl: "..."` → `broadcastUrl: "{{broadcast.url}}"`

## Example Conversion

### Before Auto Convert:
```html
<!DOCTYPE html>
<html>
<head>
    <title>How to Help Your Child Love Islam</title>
</head>
<body>
    <h1>How to Help Your Child Love Islam</h1>
    <p>Date: July 15, 2023</p>
    <p>Time: 4:00 PM - 5:30 PM (GMT)</p>
    <p>Host: Ustadha Ariba</p>
    <p>Duration: 90 minutes</p>
    <a href="https://zoom.us/j/1234567890">Enter Webinar</a>
</body>
</html>
```

### After Auto Convert:
```html
<!DOCTYPE html>
<html>
<head>
    <title>{{webinar.title}}</title>
</head>
<body>
    <h1>{{webinar.title}}</h1>
    <p>Date: {{schedule.date}}</p>
    <p>Time: {{schedule.time}}</p>
    <p>Host: {{host.name}}</p>
    <p>Duration: {{webinar.duration}} minutes</p>
    <a href="{{broadcast.url}}">Enter Webinar</a>
</body>
</html>
```

## Usage Tips

### ✅ Best Practices
1. **Start with hardcoded content** - Paste your complete HTML design first
2. **Click Auto Convert** - Let the system handle common replacements
3. **Review changes** - Check the code to ensure conversions are correct
4. **Manual adjustments** - Fine-tune any specific sections as needed
5. **Test preview** - Always preview your template before saving

### 📝 When to Use
- Importing templates from external sources
- Converting static HTML to dynamic templates
- Updating old templates to new variable format
- Quick setup of new templates

### ⚠️ What Auto Convert Doesn't Replace
- Content inside images (alt text, src)
- Custom JavaScript functions (you'll need to update these manually)
- CSS variables or styles
- Conditional logic or complex structures

### 🔄 Multiple Conversions
You can click Auto Convert multiple times safely. It won't double-convert already converted variables.

## Available Template Variables

### Webinar Variables
- `{{webinar.title}}` - Webinar title
- `{{webinar.description}}` - Webinar description
- `{{webinar.duration}}` - Duration in minutes
- `{{webinar.slug}}` - URL-friendly webinar identifier
- `{{webinar.registrationUrl}}` - Full registration page URL

### Schedule Variables
- `{{schedule.date}}` - Human-readable date (e.g., "July 15, 2023")
- `{{schedule.time}}` - Human-readable time (e.g., "4:00 PM - 5:30 PM")
- `{{schedule.dateISO}}` - ISO format date for JavaScript (e.g., "2023-07-15T16:00:00Z")

### Host Variables
- `{{host.name}}` - Host's full name
- `{{host.email}}` - Host's email address

### Attendee Variables (Thank You pages only)
- `{{attendee.name}}` - Registered attendee's name
- `{{attendee.email}}` - Registered attendee's email

### Broadcast Variables
- `{{broadcast.url}}` - Live webinar room URL

### Referral Variables (Thank You pages)
- `{{referralCode}}` - Unique referral code for sharing
- `{{referralLink}}` - Full shareable URL with referral code
- `{{whatsappReferralLink}}` - Pre-formatted WhatsApp share link

## Troubleshooting

### "Nothing was converted"
- Ensure your HTML contains recognizable patterns (dates, times, titles)
- The converter looks for common text formats like "Date:", "Time:", etc.
- Try manually adding some structure before converting

### "Incorrect conversion"
- Review the code after conversion
- Manually adjust any incorrect replacements
- The system uses pattern matching which may occasionally miss context

### "Variables not working"
- Ensure you're using the correct variable format: `{{category.variable}}`
- Check that you haven't modified the variable syntax after conversion
- Preview the template to see actual output

## Need Help?

If you need to:
- Add custom variables
- Modify conversion patterns
- Report conversion issues

Contact the development team or refer to the main template documentation.

---

**Pro Tip**: Use Auto Convert as a starting point, then manually refine your template for perfect results! 🎨
