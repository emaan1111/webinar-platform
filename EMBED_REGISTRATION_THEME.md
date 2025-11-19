# Registration Theme for Embed Forms

## Overview
A beautiful, modern embed form theme that matches the registration page design with a purple gradient header, trust badges, and clean white form section.

## Features
- **Purple gradient header** with animated decorative circles
- **"Secure Your Spot!" headline** with subtitle
- **Trust badges**: "100% Secure" and "No Spam" with SVG icons
- **Clean white form section** with subtle gradient background
- **Mobile responsive** design that stacks beautifully on small screens
- **Maximum width**: 700px for optimal readability

## How to Use

### Option 1: From Dashboard
1. Go to your webinar in the dashboard
2. Find the "Embed Code" section
3. Select **"Registration Style"** theme
4. Choose **"Inline Form"** type
5. Copy the generated embed code
6. Paste it into your website

### Option 2: Manual Configuration
Use the embed code with `theme=registration` parameter:

```html
<!-- Webinar Registration Form -->
<div id="webinar-embed-YOUR_WEBINAR_ID"></div>
<script src="https://emaanpowerclasses.com/api/embed/YOUR_WEBINAR_ID?theme=registration&type=inline"></script>
```

## Design Specifications

### Header Section
- **Background**: Purple to indigo gradient (135deg, #8b5cf6 to #6366f1)
- **Decorative Elements**: Two semi-transparent circles for visual interest
- **Title**: "Secure Your Spot!" - 32px, white, bold (800 weight)
- **Subtitle**: "Join thousands who've already registered" - 14px, white
- **Trust Badges**: 
  - 100% Secure (shield icon)
  - No Spam (thumbs up icon)
  - 12px font, white with 90% opacity

### Form Section
- **Background**: Light gradient from #f9fafb to white
- **Padding**: 32px on all sides (24px on mobile)
- **Form fields**: Standard design matching other themes
- **Submit button**: Red gradient (matching registration page CTA)

### Mobile Responsiveness
- Header padding reduced to 24px
- Title size reduced to 24px
- Trust badges stack vertically
- Form padding reduced to 24px

## Comparison with Other Themes

| Theme | Style | Best For |
|-------|-------|----------|
| **Registration** | Modern modal-style with trust badges | High-converting landing pages |
| Purple | Split-screen with info + form | Feature-rich content pages |
| Blue | Top banner with form below | Blog posts and articles |
| Green | Compact card with icon | Sidebar widgets and popups |

## Visual Hierarchy

```
┌─────────────────────────────────────┐
│  Purple Gradient Header             │
│  ◯ Decorative Circle                │
│                                     │
│  Secure Your Spot!                  │
│  Join thousands who've already...   │
│                                     │
│  [✓] 100% Secure  [👍] No Spam     │
│            ◯ Decorative Circle      │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  White Form Section                 │
│                                     │
│  [ Name Field                    ]  │
│  [ Email Field                   ]  │
│  [ Phone Field (optional)        ]  │
│  [ Timezone Selection            ]  │
│  [ ] I agree to Privacy Policy      │
│                                     │
│  [  Complete Registration  ]        │
│                                     │
│  🔒 Your information is safe        │
└─────────────────────────────────────┘
```

## Button Styling
- **Background**: Red gradient (dc2626 to 991b1b)
- **Hover**: Darker red gradient (b91c1c to 7f1d1d)
- **Text**: White, bold
- **Padding**: 16px 32px
- **Border radius**: 12px
- **Shadow**: Subtle on hover

## Trust & Security
The registration theme emphasizes trust with:
- Shield icon for "100% Secure"
- Thumbs up icon for "No Spam"
- Privacy statement at form bottom
- Professional gradient design
- Clean, modern typography

## Browser Compatibility
- ✅ Chrome/Edge (latest 2 versions)
- ✅ Firefox (latest 2 versions)
- ✅ Safari (latest 2 versions)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance
- **Lightweight**: ~15KB total (HTML + CSS)
- **No external dependencies**
- **Fast loading**: Single HTTP request
- **Cached**: 5-minute browser cache

## Customization Options
The embed code respects these webinar settings:
- Custom timezone display
- Phone number requirement (optional/required)
- Schedule selection (if multiple times available)
- Privacy policy link
- Terms of service link

## Testing
To preview the registration theme:
1. Click "Preview" in the embed code generator
2. Or visit: `https://emaanpowerclasses.com/api/embed/{WEBINAR_ID}/preview?theme=registration&type=inline`

## Examples

### Landing Page
Perfect for dedicated landing pages where the form is the primary focus:
```html
<section class="hero">
  <h1>Transform Your Business in 90 Minutes</h1>
  <p>Join our exclusive masterclass</p>
  
  <!-- Embed goes here -->
  <div id="webinar-embed-abc123"></div>
  <script src="https://emaanpowerclasses.com/api/embed/abc123?theme=registration&type=inline"></script>
</section>
```

### Sales Page
Use in the middle of a sales page:
```html
<div class="container">
  <h2>Ready to Get Started?</h2>
  <p>Register now for instant access</p>
  
  <div id="webinar-embed-abc123"></div>
  <script src="https://emaanpowerclasses.com/api/embed/abc123?theme=registration&type=inline"></script>
</div>
```

## SEO Considerations
- Form loads after page content (better for SEO)
- No iframe (search engines can see form structure)
- Semantic HTML structure
- Accessible form labels and ARIA attributes

## Conversion Optimization
The registration theme includes proven conversion elements:
- **Social proof**: "Join thousands..." subtitle
- **Trust signals**: Security and no-spam badges
- **Clear value**: "Secure Your Spot!" creates urgency
- **Minimal friction**: Clean, uncluttered design
- **Professional appearance**: Builds credibility

## Support
If you encounter issues with the registration theme:
1. Check browser console for errors
2. Verify webinar ID is correct
3. Ensure the embed div ID matches: `webinar-embed-{WEBINAR_ID}`
4. Test in incognito mode to rule out cache issues

## Version History
- **v1.0** (Current): Initial release with full registration page design
- Purple gradient header with decorative circles
- Trust badges with SVG icons
- Mobile-responsive layout
- Red CTA button matching registration page

---

**Need Help?** Contact support or check the main embed documentation for troubleshooting tips.
