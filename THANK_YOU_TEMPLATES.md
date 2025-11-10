# Thank You Page Templates System

## Overview
The Thank You Page Templates system allows you to create reusable thank you page designs that can be assigned to different webinars. Templates support dynamic variables that automatically populate with webinar-specific information.

## Features
- **Reusable Templates**: Create once, use across multiple webinars
- **Dynamic Variables**: Automatically populate webinar details
- **Customizable HTML**: Full control over design and functionality
- **System Templates**: Pre-built templates that can't be accidentally deleted

## Dynamic Variables

Templates support the following variables that get replaced with actual webinar data:

### Webinar Information
- `{{webinarTitle}}` - The webinar title
- `{{webinarDescription}}` - The webinar description
- `{{webinarDuration}}` - Duration in minutes
- `{{hostName}}` - Host's name
- `{{hostEmail}}` - Host's email

### Schedule Information
- `{{webinarDate}}` - Formatted date (e.g., "Monday, November 4, 2025")
- `{{webinarTime}}` - Formatted time (e.g., "2:00 PM EST")
- `{{webinarDateTime}}` - Full date and time
- `{{timeZone}}` - User's timezone
- `{{calendarLink}}` - Add to calendar link (Google Calendar)
- `{{icsDownload}}` - ICS file download link

### Registration Information
- `{{attendeeName}}` - Registrant's name
- `{{attendeeEmail}}` - Registrant's email
- `{{registrationId}}` - Unique registration ID

### Join Information
- `{{joinLink}}` / `{{countdownLink}}` - Countdown page URL for the registered webinar (includes schedule when available)
- `{{roomLink}}` - Direct link to enter the live webinar room
- `{{webinarUrl}}` - Full webinar room URL

### Countdown Timer
- `{{countdown}}` - JavaScript countdown timer to webinar start

## Database Schema

```prisma
model ThankYouTemplate {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?  @db.Text
  htmlCode    String   @db.Text
  thumbnail   String?
  isSystem    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Webinar {
  // ... existing fields
  thankYouTemplateId String? // Reference to ThankYouTemplate
}
```

## API Endpoints

### Get All Templates
```
GET /api/thank-you-templates
```
Returns all thank you page templates.

### Get Single Template
```
GET /api/thank-you-templates/[id]
```
Returns a specific template by ID.

### Create Template
```
POST /api/thank-you-templates
Body: {
  name: string
  description?: string
  htmlCode: string
  thumbnail?: string
}
```

### Update Template
```
PATCH /api/thank-you-templates/[id]
Body: {
  name?: string
  description?: string
  htmlCode?: string
  thumbnail?: string
}
```

### Delete Template
```
DELETE /api/thank-you-templates/[id]
```
Note: System templates cannot be deleted.

### Get Thank You Page
```
GET /api/thank-you/[slug]?r=[registrationId]&s=[scheduleId]
```
Returns the thank you page with processed template variables.

## Usage Flow

### 1. Create Template
```typescript
const response = await fetch('/api/thank-you-templates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Modern Minimal',
    description: 'Clean design with calendar integration',
    htmlCode: `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Thank You - {{webinarTitle}}</title>
          <style>
            body { font-family: system-ui; max-width: 800px; margin: 0 auto; padding: 40px; }
            .hero { text-align: center; margin-bottom: 40px; }
            .info-box { background: #f5f5f5; padding: 24px; border-radius: 12px; }
          </style>
        </head>
        <body>
          <div class="hero">
            <h1>✓ You're Registered!</h1>
            <p>See you at the webinar, {{attendeeName}}!</p>
          </div>
          
          <div class="info-box">
            <h2>{{webinarTitle}}</h2>
            <p><strong>When:</strong> {{webinarDateTime}}</p>
            <p><strong>Duration:</strong> {{webinarDuration}} minutes</p>
            <p><strong>Host:</strong> {{hostName}}</p>
            
            <a href="{{calendarLink}}" class="btn">📅 Add to Calendar</a>
            <a href="{{joinLink}}" class="btn primary">🎥 View Countdown Page</a>
          </div>
          
          <div id="countdown"></div>
          
          <script>
            // Countdown timer will be injected here
            {{countdown}}
          </script>
        </body>
      </html>
    `
  })
})
```

### 2. Assign Template to Webinar
```typescript
await prisma.webinar.update({
  where: { id: webinarId },
  data: { thankYouTemplateId: templateId }
})
```

### 3. Redirect After Registration
```typescript
// In your registration handler
const registrationId = registration.id
const scheduleId = registration.scheduleId
const webinarSlug = webinar.slug

// Redirect to thank you page
window.location.href = `/thank-you/${webinarSlug}?r=${registrationId}&s=${scheduleId}`
```

### 4. Render Thank You Page
The thank you page route will:
1. Fetch webinar, registration, and schedule data
2. Load the assigned template (or default)
3. Replace all variables with actual values
4. Return the processed HTML

## Example Templates

### 1. Default Template
- Simple, clean design
- Calendar integration
- Countdown timer
- Join link

### 2. Download Focus
- Emphasizes bonus resources
- PDF downloads
- Resource library access

### 3. Calendar Priority
- Multiple calendar options (Google, Outlook, Apple)
- ICS file download
- SMS reminder option

### 4. Social Sharing
- Encourages sharing
- Social media links
- Referral tracking

## Variable Processing

The system processes variables in this order:

1. **Webinar Data** - Basic webinar information
2. **Schedule Data** - Calculate dates/times based on schedule type
3. **Registration Data** - Attendee personal information
4. **Generated Links** - Create calendar and join URLs
5. **Countdown Timer** - Inject JavaScript for live countdown

Example processing function:
```typescript
function processTemplate(template: string, data: any) {
  let processed = template

  // Replace webinar info
  processed = processed.replace(/{{webinarTitle}}/g, data.webinar.title)
  processed = processed.replace(/{{webinarDescription}}/g, data.webinar.description)
  
  // Replace schedule info
  const scheduleDate = new Date(data.schedule.scheduledAt)
  processed = processed.replace(/{{webinarDate}}/g, scheduleDate.toLocaleDateString())
  processed = processed.replace(/{{webinarTime}}/g, scheduleDate.toLocaleTimeString())
  
  // Replace registration info
  processed = processed.replace(/{{attendeeName}}/g, data.registration.name)
  processed = processed.replace(/{{attendeeEmail}}/g, data.registration.email)
  
  // Generate links
  const joinLink = `https://yoursite.com/countdown/${data.webinar.slug}?s=${data.schedule.id}`
  const roomLink = `https://yoursite.com/room/${data.webinar.slug}?r=${data.registration.id}`
  processed = processed.replace(/{{joinLink}}/g, joinLink)
  processed = processed.replace(/{{countdownLink}}/g, joinLink)
  processed = processed.replace(/{{roomLink}}/g, roomLink)
  
  // Add countdown timer
  const countdownScript = `
    const target = new Date('${data.schedule.scheduledAt}').getTime()
    setInterval(() => {
      const now = new Date().getTime()
      const distance = target - now
      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)
      document.getElementById('countdown').innerHTML = \`\${days}d \${hours}h \${minutes}m \${seconds}s\`
    }, 1000)
  `
  processed = processed.replace(/{{countdown}}/g, countdownScript)
  
  return processed
}
```

## Best Practices

1. **Keep It Simple**: Don't overload with too many elements
2. **Mobile Responsive**: Use responsive CSS
3. **Clear CTA**: Make the calendar/join buttons prominent
4. **Test Variables**: Test all variable replacements
5. **Backup Template**: Always have a default template
6. **Preview Mode**: Test templates before assigning

## Migration

Run the migration to add the new tables:
```bash
npx prisma migrate dev --name add_thank_you_templates
npx prisma generate
```

## Next Steps

1. ✅ Database schema updated
2. ✅ API routes created
3. ⏳ Create default system templates
4. ⏳ Build UI for template management
5. ⏳ Add template preview functionality
6. ⏳ Create variable replacement logic
7. ⏳ Build public thank you page renderer
8. ⏳ Add to webinar creation/edit flow
