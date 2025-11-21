# Thank You Page Template - Setup Guide

## 📄 Template File
`templates/thank-you-emaan-power.html`

## 🎯 Template Variables

This template uses the following placeholders that will be automatically replaced:

### Webinar Variables
- `{{webinar.title}}` - The webinar title
- `{{webinar.slug}}` - The webinar URL slug
- `{{webinar.duration}}` - Duration in minutes

### Schedule Variables  
- `{{schedule.date}}` - Formatted date (e.g., "Saturday, 15th July 2023")
- `{{schedule.time}}` - Formatted time with timezone (e.g., "4:00 PM - 5:30 PM (GMT)")
- `{{schedule.dateISO}}` - ISO 8601 date format for calendar integration (e.g., "2023-07-15T16:00:00Z")

### User Variables (Available but not used in this template)
- `{{user.name}}` - Registrant's name
- `{{user.email}}` - Registrant's email

## 🎨 Customization Guide

### 1. **Colors** (CSS Variables in `:root`)
```css
--primary-color: #9E7A7A;     /* Main brand color */
--secondary-color: #7A9E9E;   /* Secondary accents */
--accent-color: #D4AF37;      /* Gold highlights */
--cta-color: #C55A7A;         /* Call-to-action buttons */
--background-color: #FBF8F3;  /* Page background */
```

### 2. **Logo** 
Replace "Emaan Power" text with your logo:
```html
<div class="logo">Your Brand Name</div>
```

Or use an image:
```html
<div class="logo">
    <img src="your-logo-url.png" alt="Your Brand" style="height: 40px;">
</div>
```

### 3. **Images**
Replace placeholder images:
- **Hero Image** (line 438): Success/celebration image
- **Bonus Image** (line 452): Product/bonus image

```html
<img src="YOUR_IMAGE_URL" alt="Description">
```

### 4. **Bonus Section**
If you don't offer a bonus gift, remove the entire bonus section (lines 432-467).

### 5. **Social Sharing**
The template includes:
- WhatsApp sharing
- Facebook sharing
- Link copying

All use the registration URL automatically via `{{webinar.slug}}`.

### 6. **Footer Links**
Update footer links (line 603):
```html
<a href="/privacy">Privacy Policy</a>
<a href="/terms">Terms of Service</a>
```

## 📋 How to Upload to Database

### Option 1: Via Dashboard (Recommended)
1. Go to **Dashboard → Thank You Pages**
2. Click **"Create New Template"**
3. Fill in:
   - **Name**: "Emaan Power - Elegant Thank You"
   - **Description**: "Professional thank you page with calendar integration and social sharing"
4. Copy the entire HTML from `templates/thank-you-emaan-power.html`
5. Paste into the HTML editor
6. **Save**

### Option 2: Via Script
```typescript
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function uploadTemplate() {
  const html = fs.readFileSync('./templates/thank-you-emaan-power.html', 'utf-8');
  
  await prisma.thankYouTemplate.create({
    data: {
      name: 'Emaan Power - Elegant Thank You',
      description: 'Professional thank you page with calendar integration and social sharing',
      htmlCode: html,
      thumbnail: 'https://example.com/preview.jpg' // Optional
    }
  });
  
  console.log('✅ Template uploaded!');
}

uploadTemplate().finally(() => prisma.$disconnect());
```

## 🔧 Assigning to a Webinar

1. Go to **Dashboard → Webinars**
2. Edit your webinar
3. Under **"Thank You Page"** section:
   - Select **"Emaan Power - Elegant Thank You"** from dropdown
4. **Save**

## ✨ Features Included

### 1. **Calendar Integration**
- One-click "Add to Calendar" button
- Opens Google Calendar with pre-filled event details
- Automatically calculates end time based on duration

### 2. **Social Sharing**
- WhatsApp share button with pre-formatted message
- Facebook share button
- Copy registration link to clipboard

### 3. **Responsive Design**
- Mobile-first approach
- Beautiful on all devices
- Touch-friendly buttons

### 4. **Islamic Elements**
- Hadith quote about sharing goodness
- Spiritual motivation for sharing
- Modest, professional design

### 5. **Professional Polish**
- Success icon animation
- Hover effects on cards
- Smooth transitions
- Clean typography

## 🎯 Best Practices

### 1. **Keep Bonus Section Relevant**
- Only show if you're offering a bonus
- Update bonus image and description
- Clearly state when they'll receive it

### 2. **Test Calendar Function**
- Verify the date format in `{{schedule.dateISO}}`
- Should be in format: `2023-07-15T16:00:00Z`
- Test with different timezones

### 3. **Update Social Messages**
- Customize the WhatsApp message
- Make it personal and compelling
- Include call-to-action

### 4. **Mobile Testing**
- Test on actual mobile devices
- Verify social buttons work
- Check calendar integration on iOS/Android

## 📱 Mobile Optimizations

The template is already mobile-optimized with:
- Flexible layouts (flexbox)
- Touch-friendly buttons (min 44px height)
- Readable font sizes
- No horizontal scrolling
- Compressed images

## 🔄 Variable Replacement Logic

The system automatically replaces variables when rendering the page:

```typescript
// Example of how variables are replaced
let html = template.htmlCode;

html = html.replace(/\{\{webinar\.title\}\}/g, webinar.title);
html = html.replace(/\{\{webinar\.slug\}\}/g, webinar.slug);
html = html.replace(/\{\{webinar\.duration\}\}/g, webinar.duration.toString());
html = html.replace(/\{\{schedule\.date\}\}/g, formatDate(schedule.scheduledAt));
html = html.replace(/\{\{schedule\.time\}\}/g, formatTime(schedule.scheduledAt));
html = html.replace(/\{\{schedule\.dateISO\}\}/g, schedule.scheduledAt.toISOString());
```

## 🎨 Alternative Color Schemes

### Professional Blue
```css
--primary-color: #2C5F7C;
--secondary-color: #5A9FB8;
--accent-color: #F4A261;
--cta-color: #E76F51;
```

### Warm Islamic Gold
```css
--primary-color: #8B4513;
--secondary-color: #D4AF37;
--accent-color: #CD853F;
--cta-color: #B8860B;
```

### Modern Purple
```css
--primary-color: #6B4C93;
--secondary-color: #9B7EBD;
--accent-color: #D4A574;
--cta-color: #8B5CF6;
```

## 📊 Analytics Tracking (Optional)

To add Google Analytics or tracking pixels, add before `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR-GA-ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR-GA-ID');
</script>

<!-- Facebook Pixel -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR-PIXEL-ID');
  fbq('track', 'CompleteRegistration');
</script>
```

## 🚀 Next Steps

1. ✅ Upload template to database
2. ✅ Assign to your webinar
3. ✅ Test registration flow end-to-end
4. ✅ Verify calendar integration works
5. ✅ Test social sharing on mobile
6. ✅ Check email notifications include correct link

## 🆘 Troubleshooting

### Calendar button doesn't work
- Check that `{{schedule.dateISO}}` is in correct format
- Verify timezone is set correctly
- Test in different browsers

### Social sharing fails
- Verify `{{webinar.slug}}` is correct
- Test URL is accessible publicly
- Check popup blockers

### Images don't load
- Use absolute URLs (https://...)
- Test image URLs in browser
- Check CORS settings

### Variables not replaced
- Verify variable names match exactly (case-sensitive)
- Check for typos in `{{...}}` syntax
- Ensure template is assigned to webinar

## 📝 Support

For issues or questions:
1. Check this guide first
2. Review the example HTML
3. Test with a sample webinar
4. Contact support with specific error details
