# Custom HTML Template Feature

## Overview
This feature allows users to create fully custom registration pages by pasting their own HTML/CSS code. The system will inject webinar data dynamically and handle registrations automatically.

## How It Works

### 1. User Flow
```
Admin Dashboard → Create/Edit Webinar
    ↓
Select "Custom HTML" as template type
    ↓
Paste HTML code in editor
    ↓
Optionally add custom CSS and JavaScript
    ↓
Save webinar
    ↓
Registration page uses custom HTML with injected data
```

### 2. Variable Replacement System

Users can use **template variables** in their HTML that get automatically replaced with real data:

| Variable | Replaced With | Example |
|----------|---------------|---------|
| `{{webinar.title}}` | Webinar title | "Master Digital Marketing" |
| `{{webinar.description}}` | Description | "Learn proven strategies..." |
| `{{webinar.duration}}` | Duration in minutes | "60" |
| `{{schedules}}` | HTML list of schedules | Formatted schedule divs |

### 3. Special Data Attributes

Users can add these attributes to trigger actions:

| Attribute | Action | Example |
|-----------|--------|---------|
| `data-action="register"` | Opens registration modal | `<button data-action="register">Sign Up</button>` |
| `data-action="open-modal"` | Same as above | Any clickable element |
| `data-action="select-schedule"` | Selects specific schedule | Used with schedules |
| `data-success-message` | Shows after registration | `<div data-success-message class="hidden">Thanks!</div>` |

## Example Custom HTML Templates

### Example 1: Simple Landing Page

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .hero {
      text-align: center;
      padding: 60px 20px;
    }
    .hero h1 {
      font-size: 48px;
      margin-bottom: 20px;
    }
    .hero p {
      font-size: 20px;
      margin-bottom: 30px;
      opacity: 0.9;
    }
    .cta-button {
      background: #ff6b6b;
      color: white;
      border: none;
      padding: 20px 40px;
      font-size: 20px;
      font-weight: bold;
      border-radius: 50px;
      cursor: pointer;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 40px rgba(0,0,0,0.4);
    }
    .schedules {
      margin-top: 40px;
      background: rgba(255,255,255,0.1);
      padding: 30px;
      border-radius: 20px;
    }
    .schedule-item {
      background: rgba(255,255,255,0.2);
      padding: 15px;
      margin: 10px 0;
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .schedule-item:hover {
      background: rgba(255,255,255,0.3);
    }
  </style>
</head>
<body>
  <div class="hero">
    <h1>{{webinar.title}}</h1>
    <p>{{webinar.description}}</p>
    <button class="cta-button" data-action="register">
      REGISTER FOR FREE
    </button>
    <p style="font-size: 14px; margin-top: 15px;">
      Duration: {{webinar.duration}} minutes • 100% Free
    </p>
  </div>

  <div class="schedules">
    <h2 style="text-align: center; margin-bottom: 20px;">Choose Your Session:</h2>
    {{schedules}}
  </div>

  <div data-success-message class="hidden" style="text-align: center; padding: 40px; background: rgba(76, 175, 80, 0.2); border-radius: 20px; margin-top: 40px;">
    <h2>🎉 You're Registered!</h2>
    <p>Check your email for confirmation and webinar link.</p>
  </div>
</body>
</html>
```

### Example 2: Video-First Landing Page

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background: #000;
      color: #fff;
    }
    .video-hero {
      position: relative;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), 
                  url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920') center/cover;
    }
    .video-content {
      text-align: center;
      z-index: 10;
      padding: 40px;
    }
    .video-content h1 {
      font-size: 72px;
      font-weight: 900;
      margin-bottom: 20px;
      text-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }
    .video-content p {
      font-size: 24px;
      margin-bottom: 40px;
      max-width: 700px;
      margin-left: auto;
      margin-right: auto;
    }
    .play-button {
      background: #ff0000;
      color: white;
      border: none;
      padding: 30px 60px;
      font-size: 24px;
      font-weight: bold;
      border-radius: 60px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 15px;
      box-shadow: 0 20px 60px rgba(255, 0, 0, 0.4);
      transition: all 0.3s;
    }
    .play-button:hover {
      transform: scale(1.05);
      box-shadow: 0 25px 80px rgba(255, 0, 0, 0.6);
    }
    .play-icon {
      width: 0;
      height: 0;
      border-left: 20px solid white;
      border-top: 12px solid transparent;
      border-bottom: 12px solid transparent;
    }
  </style>
</head>
<body>
  <div class="video-hero">
    <div class="video-content">
      <h1>{{webinar.title}}</h1>
      <p>{{webinar.description}}</p>
      <button class="play-button" data-action="register">
        <span class="play-icon"></span>
        WATCH FREE TRAINING
      </button>
      <p style="font-size: 16px; margin-top: 20px; opacity: 0.8;">
        {{webinar.duration}} min • No credit card required
      </p>
    </div>
  </div>
</body>
</html>
```

### Example 3: Sales Page Style

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0;
      padding: 0;
      background: #f8f9fa;
    }
    .header {
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      color: white;
      text-align: center;
      padding: 60px 20px;
    }
    .header h1 {
      font-size: 48px;
      margin-bottom: 20px;
    }
    .badge {
      display: inline-block;
      background: #ffd700;
      color: #1e3c72;
      padding: 10px 20px;
      border-radius: 25px;
      font-weight: bold;
      margin-bottom: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 60px 20px;
    }
    .benefits {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
      margin: 40px 0;
    }
    .benefit-card {
      background: white;
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }
    .benefit-card h3 {
      color: #1e3c72;
      margin-bottom: 15px;
    }
    .cta-section {
      background: #ff6b6b;
      color: white;
      padding: 80px 20px;
      text-align: center;
      margin-top: 60px;
    }
    .cta-button {
      background: white;
      color: #ff6b6b;
      border: none;
      padding: 25px 50px;
      font-size: 24px;
      font-weight: bold;
      border-radius: 50px;
      cursor: pointer;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="badge">FREE LIVE TRAINING</div>
    <h1>{{webinar.title}}</h1>
    <p style="font-size: 20px; max-width: 700px; margin: 0 auto;">
      {{webinar.description}}
    </p>
  </div>

  <div class="container">
    <div class="benefits">
      <div class="benefit-card">
        <h3>✅ Proven Strategies</h3>
        <p>Learn the exact methods top performers use to get results</p>
      </div>
      <div class="benefit-card">
        <h3>✅ Step-by-Step System</h3>
        <p>Easy-to-follow framework you can implement immediately</p>
      </div>
      <div class="benefit-card">
        <h3>✅ Live Q&A</h3>
        <p>Get your specific questions answered by an expert</p>
      </div>
    </div>

    <div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
      <h2 style="text-align: center; margin-bottom: 30px; color: #1e3c72;">
        Choose Your Session:
      </h2>
      {{schedules}}
    </div>
  </div>

  <div class="cta-section">
    <h2 style="font-size: 42px; margin-bottom: 20px;">
      Ready to Get Started?
    </h2>
    <p style="font-size: 20px; margin-bottom: 40px;">
      Join thousands of people who've already transformed their results
    </p>
    <button class="cta-button" data-action="register">
      REGISTER NOW - IT'S FREE
    </button>
    <p style="font-size: 14px; margin-top: 20px; opacity: 0.9;">
      {{webinar.duration}} minutes • No credit card • No spam
    </p>
  </div>

  <div data-success-message class="hidden" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; color: #1e3c72; padding: 60px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); text-align: center; z-index: 1000;">
    <h2 style="color: #28a745; margin-bottom: 20px;">✅ Success!</h2>
    <p style="font-size: 18px;">You're all set! Check your email for details.</p>
  </div>
</body>
</html>
```

## Admin UI Implementation

### Custom HTML Editor in Webinar Form

```typescript
// Add to webinar creation/edit form

{formData.registrationTemplate === 'custom' && (
  <>
    {/* HTML Editor */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Custom HTML
      </label>
      <textarea
        rows={20}
        value={formData.customHtml}
        onChange={(e) => setFormData({ ...formData, customHtml: e.target.value })}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm"
        placeholder="Paste your HTML code here..."
      />
      <p className="text-xs text-gray-500 mt-1">
        Use variables: {{webinar.title}}, {{webinar.description}}, {{webinar.duration}}, {{schedules}}
      </p>
    </div>

    {/* CSS Editor */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Custom CSS (Optional)
      </label>
      <textarea
        rows={10}
        value={formData.customCss}
        onChange={(e) => setFormData({ ...formData, customCss: e.target.value })}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm"
        placeholder=".my-class { color: red; }"
      />
    </div>

    {/* JavaScript Editor */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Custom JavaScript (Optional - Advanced)
      </label>
      <textarea
        rows={10}
        value={formData.customJs}
        onChange={(e) => setFormData({ ...formData, customJs: e.target.value })}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm"
        placeholder="console.log('Custom JS');"
      />
      <p className="text-xs text-red-600 mt-1">
        ⚠️ Be careful with JavaScript - it can break your page
      </p>
    </div>

    {/* Preview Button */}
    <button
      type="button"
      onClick={() => window.open(`/w/${formData.slug}?preview=true`, '_blank')}
      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
    >
      Preview Page
    </button>
  </>
)}
```

## Security Features

### 1. HTML Sanitization
Uses DOMPurify to prevent XSS attacks:
- Removes dangerous tags (`<script>`, `<iframe>` by default)
- Strips event handlers (except whitelisted `onclick`)
- Cleans malicious attributes

### 2. Content Security Policy (CSP)
Recommended headers:
```typescript
// In next.config.js
headers: async () => [
  {
    source: '/w/:slug*',
    headers: [
      {
        key: 'Content-Security-Policy',
        value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
      }
    ]
  }
]
```

### 3. JavaScript Sandboxing
- Custom JS runs in isolated scope
- No access to sensitive data
- Can't modify registration logic

## Installation

### 1. Install Dependencies

```bash
cd "/Volumes/WD/CODE/Webinar Play 2"
npm install isomorphic-dompurify
```

### 2. Push Schema Changes

```bash
npx prisma db push
npx prisma generate
```

### 3. Add Custom Template to Router

(We'll do this next in the main page.tsx)

## Template Variables Reference

### Available Variables

```
{{webinar.title}}          - Webinar title
{{webinar.description}}    - Full description
{{webinar.duration}}       - Duration in minutes
{{schedules}}              - Auto-generated schedule list
{{webinar.thumbnail}}      - Thumbnail URL (if set)
{{webinar.hostName}}       - Host name (future)
```

### Special Attributes

```html
<!-- Opens registration modal -->
<button data-action="register">Register</button>
<a href="#" data-action="open-modal">Sign Up</a>

<!-- Selects specific schedule -->
<div data-action="select-schedule" data-schedule-index="0">
  Click to register for this slot
</div>

<!-- Shows after successful registration -->
<div data-success-message class="hidden">
  Thank you for registering!
</div>
```

## Best Practices

### 1. Keep It Simple
- Start with basic HTML/CSS
- Test thoroughly before going live
- Use inline styles or `<style>` tags

### 2. Mobile Responsive
```css
@media (max-width: 768px) {
  .hero h1 {
    font-size: 32px;
  }
}
```

### 3. Fast Loading
- Minimize external resources
- Use system fonts when possible
- Optimize images

### 4. Clear CTAs
- Make "Register" buttons obvious
- Use `data-action="register"` attribute
- Test click events work

## Testing Checklist

- [ ] Variables replaced correctly
- [ ] CTA buttons open registration modal
- [ ] Schedule selection works
- [ ] Form validation works
- [ ] Success message shows
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Registration saves to database

## Troubleshooting

### Issue: Variables Not Replaced
**Solution**: Check exact syntax `{{webinar.title}}` with double curly braces

### Issue: Buttons Don't Work
**Solution**: Add `data-action="register"` attribute

### Issue: Styling Broken
**Solution**: Use inline styles or `<style>` tag in HTML

### Issue: JavaScript Not Running
**Solution**: Check browser console for errors, ensure no syntax issues

## Future Enhancements

1. **Visual HTML Builder**: Drag-and-drop editor
2. **Template Marketplace**: Library of pre-made templates
3. **AI Generator**: "Describe your page, we'll create HTML"
4. **Version History**: Save multiple versions
5. **Collaboration**: Multiple users can edit
6. **Preview Mode**: Live preview as you type
7. **Template Variables Autocomplete**: Suggest variables as you type

## Next Steps

1. Install `isomorphic-dompurify` package
2. Add custom HTML fields to webinar form
3. Update template router to support custom template
4. Test with example HTML

Want me to proceed with the installation and integration?
