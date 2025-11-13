# Template Management - Quick Start Guide 🚀

## What's New? 

You now have a complete **Template Management System** where you can:
- View all Thank You and Countdown page templates
- Create new custom templates
- Edit existing templates (including system templates)
- Delete custom templates
- Preview templates before using them

## How to Access

### Option 1: From Dashboard Sidebar
1. Look for **"Templates"** in the left sidebar (📄 icon)
2. Click on it
3. Choose "Thank You Pages" or "Countdown Pages"

### Option 2: Direct URLs
- Main hub: `http://localhost:3000/dashboard/templates`
- Thank You Pages: `http://localhost:3000/dashboard/templates/thank-you`
- Countdown Pages: `http://localhost:3000/dashboard/templates/countdown`

---

## Templates Hub (`/dashboard/templates`)

```
┌─────────────────────────────────────────────────┐
│  Template Management                            │
│  Create, edit, and manage your templates       │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌───────────────────┐  ┌───────────────────┐  │
│  │  🎉 Thank You     │  │  ⏳ Countdown     │  │
│  │     Pages         │  │     Pages         │  │
│  │                   │  │                   │  │
│  │  Manage templates │  │  Manage templates │  │
│  │  displayed after  │  │  shown before     │  │
│  │  users register   │  │  webinars start   │  │
│  │                   │  │                   │  │
│  │ [Manage →]        │  │ [Manage →]        │  │
│  └───────────────────┘  └───────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Thank You Templates Page

```
┌──────────────────────────────────────────────────────┐
│  ← Back to Templates                                 │
│                                                      │
│  Thank You Page Templates         [+ Create New]    │
│  Manage templates after registration                │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Default      │  │ Minimal      │  │ Islamic    │ │
│  │ System ✓     │  │ System ✓     │  │ System ✓   │ │
│  │              │  │              │  │            │ │
│  │ Clean modern │  │ Simple text  │  │ Islamic    │ │
│  │ design with  │  │ focused      │  │ themed     │ │
│  │ calendar     │  │              │  │            │ │
│  │              │  │              │  │            │ │
│  │ [👁️ Preview] │  │ [👁️ Preview] │  │ [👁️ Pre.] │ │
│  │ [✏️ Edit]    │  │ [✏️ Edit]    │  │ [✏️ Edit]  │ │
│  │              │  │              │  │            │ │
│  │ Created: ... │  │ Created: ... │  │ Creat: ... │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Create/Edit Template Modal

```
┌────────────────────────────────────────────────────┐
│  Create New Template                          [×]  │
├────────────────────────────────────────────────────┤
│                                                    │
│  Template Name *                                   │
│  ┌──────────────────────────────────────────────┐ │
│  │ Modern Minimal                               │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  Description                                       │
│  ┌──────────────────────────────────────────────┐ │
│  │ Clean design with calendar integration       │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  HTML Code *                                       │
│  ┌──────────────────────────────────────────────┐ │
│  │ Available Variables:                         │ │
│  │ {{webinarTitle}}  {{webinarDescription}}     │ │
│  │ {{webinarDuration}} {{webinarDate}}          │ │
│  │ {{attendeeName}}  {{attendeeEmail}}          │ │
│  │ {{joinLink}}      {{calendarLink}}           │ │
│  └──────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────┐ │
│  │ <!DOCTYPE html>                              │ │
│  │ <html>                                       │ │
│  │   <head>                                     │ │
│  │     <title>{{webinarTitle}}</title>          │ │
│  │   </head>                                    │ │
│  │   <body>                                     │ │
│  │     <h1>Thank You!</h1>                      │ │
│  │   </body>                                    │ │
│  │ </html>                                      │ │
│  │                                              │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│                      [Cancel]  [Create Template]  │
└────────────────────────────────────────────────────┘
```

---

## Preview Modal

```
┌──────────────────────────────────────────────────────┐
│  Modern Minimal                                 [×]  │
│  Clean design with calendar integration              │
├──────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────┐ │
│ │                                                  │ │
│ │          🎉 Thank You for Registering!           │ │
│ │                                                  │ │
│ │     Hi John Doe,                                 │ │
│ │                                                  │ │
│ │     You're all set for: Advanced React Patterns  │ │
│ │                                                  │ │
│ │     ┌────────────────────────────────────────┐  │ │
│ │     │ Date: Monday, November 13, 2025        │  │ │
│ │     │ Time: 2:00 PM EST                      │  │ │
│ │     │ Duration: 60 minutes                   │  │ │
│ │     └────────────────────────────────────────┘  │ │
│ │                                                  │ │
│ │     [View Countdown Page]                        │ │
│ │                                                  │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

---

## Key Features

### 1. **View All Templates**
- Grid layout showing all templates
- System template badges
- Template descriptions
- Creation/update dates

### 2. **Create New Templates**
- Full HTML editor
- Available variables helper
- Name and description fields
- Real-time validation

### 3. **Edit Templates**
- Modify any field (name, description, HTML)
- System templates can be edited by admins
- Changes save immediately

### 4. **Preview Templates**
- Full-screen modal
- Live iframe rendering
- See exactly how it will look
- Close to return

### 5. **Delete Templates**
- Custom templates only (not system)
- Confirmation dialog
- Permanent deletion

---

## Dynamic Variables

### Thank You Pages
```
{{webinarTitle}}         - Webinar name
{{webinarDescription}}   - Full description
{{webinarDuration}}      - Duration in minutes
{{webinarDate}}          - Date (e.g., "Monday, Nov 13")
{{webinarTime}}          - Time (e.g., "2:00 PM EST")
{{webinarDateTime}}      - Full date and time
{{hostName}}             - Host's name
{{hostEmail}}            - Host's email
{{attendeeName}}         - Registrant's name
{{attendeeEmail}}        - Registrant's email
{{registrationId}}       - Unique registration ID
{{joinLink}}             - Countdown page link
{{calendarLink}}         - Google Calendar add link
{{countdown}}            - JavaScript countdown timer
```

### Countdown Pages
```
{{webinarTitle}}         - Webinar name
{{webinarDescription}}   - Full description
{{webinarDuration}}      - Duration in minutes
{{hostName}}             - Host's name
{{hostEmail}}            - Host's email
{{startTime}}            - ISO format start time
{{roomLink}}             - Direct webinar room link
{{webinarUrl}}           - Full webinar URL
```

---

## Common Use Cases

### 1. Create a Simple Thank You Page
```html
<!DOCTYPE html>
<html>
<head>
    <title>Thank You - {{webinarTitle}}</title>
    <style>
        body { font-family: Arial; max-width: 600px; margin: 40px auto; padding: 20px; }
        .btn { display: inline-block; background: #007bff; color: white; 
               padding: 12px 24px; text-decoration: none; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>🎉 Thank You, {{attendeeName}}!</h1>
    <p>You're registered for: <strong>{{webinarTitle}}</strong></p>
    <p>Date: {{webinarDate}} at {{webinarTime}}</p>
    <a href="{{joinLink}}" class="btn">View Countdown Page</a>
</body>
</html>
```

### 2. Create a Countdown Page
```html
<!DOCTYPE html>
<html>
<head>
    <title>{{webinarTitle}} - Starting Soon</title>
    <style>
        body { display: flex; align-items: center; justify-content: center; 
               min-height: 100vh; background: #667eea; color: white; text-align: center; }
        #countdown { font-size: 3rem; font-weight: bold; margin: 2rem 0; }
    </style>
</head>
<body>
    <div>
        <h1>{{webinarTitle}}</h1>
        <p>Webinar starts in:</p>
        <div id="countdown">Loading...</div>
        <a href="{{roomLink}}" style="color: white;">Enter Room</a>
    </div>
    
    <script>
        const startTime = new Date('{{startTime}}').getTime();
        setInterval(() => {
            const now = new Date().getTime();
            const diff = startTime - now;
            if (diff < 0) {
                document.getElementById('countdown').innerHTML = 'Live Now!';
            } else {
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                document.getElementById('countdown').innerHTML = hours + 'h ' + minutes + 'm ' + seconds + 's';
            }
        }, 1000);
    </script>
</body>
</html>
```

---

## Tips & Best Practices

✅ **Use Variables** - Always use `{{variables}}` for dynamic content
✅ **Test Preview** - Preview before assigning to webinars
✅ **Mobile Responsive** - Use responsive CSS (viewport meta tag)
✅ **Embed CSS** - Include all styles in the HTML
✅ **Descriptive Names** - Use clear template names
✅ **Add Descriptions** - Help identify templates later
✅ **Countdown Timer** - Use JavaScript for live countdowns
✅ **Calendar Links** - Include {{calendarLink}} for easy adds

❌ **Don't Rely on External CSS** - Embed everything
❌ **Don't Forget Variables** - Hard-coded text won't update
❌ **Don't Delete System Templates** - They're protected anyway
❌ **Don't Skip Testing** - Always preview first

---

## Workflow

### Creating a New Template
1. Go to `/dashboard/templates`
2. Choose template type (Thank You or Countdown)
3. Click "+ Create New Template"
4. Fill in name, description
5. Write/paste HTML code
6. Reference available variables
7. Click "Create Template"
8. Preview to verify
9. Assign to webinars

### Editing a Template
1. Find template in list
2. Click "✏️ Edit"
3. Modify fields
4. Click "Update Template"
5. Preview changes
6. Template updates for all webinars using it

### Assigning to Webinars
1. Go to webinar edit page
2. Find "Thank You Page" or "Countdown Page" section
3. Select template from dropdown
4. Save webinar settings
5. Template will be used for that webinar

---

## Security & Permissions

- ✅ **Authentication Required** - Must be logged in
- ✅ **Role Check** - Only ADMIN and HOST can manage
- ✅ **System Protection** - System templates can't be deleted
- ✅ **Validation** - Name and HTML are required
- ✅ **Error Handling** - Graceful error messages

---

## Next Steps

1. **Explore Templates** - Visit `/dashboard/templates`
2. **Preview Existing** - Check out system templates
3. **Create Custom** - Build your own branded templates
4. **Test Thoroughly** - Preview before assigning
5. **Assign to Webinars** - Use in webinar edit page

---

**Status:** ✅ **LIVE AND READY**

Navigate to: `http://localhost:3000/dashboard/templates`
