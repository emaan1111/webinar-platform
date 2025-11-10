# Custom Registration Templates - Complete Guide

## Overview

Create custom registration page templates with your own HTML design. The system **automatically detects registration buttons** in your HTML and makes them work with the registration popup - no special code needed!

---

## 🎯 How It Works

### Automatic Button Detection

The system uses a **simple approach**: **ALL buttons and links** in your custom template will trigger the registration popup!

**What Gets Detected**:
- `<button>` - Any button element
- `<a href="...">` - Any link
- `<input type="button">` - Button inputs
- `<input type="submit">` - Submit buttons

**You don't need to write JavaScript or use special class names!** Just add any button or link to your HTML and it will automatically open the registration form.

---

## 📝 Template Variables

Use these variables in your HTML - they'll be replaced with actual webinar data:

| Variable | Replaced With | Example |
|----------|---------------|---------|
| `{{webinar.title}}` | Webinar title | "How to Help Your Child Love Islam" |
| `{{webinar.description}}` | Full description | Long text description |
| `{{webinar.duration}}` | Duration in minutes | "60" |
| `{{webinar.host}}` | Host name | "Ustadha Ariba Farheen" |
| `{{schedules}}` | HTML list of schedules | Clickable schedule items |

---

## 🚀 Quick Start Examples

### Example 1: Simple Template (Recommended)

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .header {
      text-align: center;
      padding: 40px 20px;
    }
    .title {
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 20px;
    }
    .description {
      font-size: 1.2rem;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .cta-button {
      background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
      color: white;
      font-size: 1.2rem;
      font-weight: bold;
      padding: 15px 40px;
      border: none;
      border-radius: 50px;
      cursor: pointer;
      box-shadow: 0 8px 16px rgba(255, 107, 107, 0.3);
      transition: all 0.3s ease;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 20px rgba(255, 107, 107, 0.4);
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">{{webinar.title}}</h1>
    <p class="description">{{webinar.description}}</p>
    
    <!-- This button will automatically open the registration popup! -->
    <button class="cta-button register-button">
      REGISTER NOW - FREE
    </button>
  </div>
</body>
</html>
```

### Example 2: With Schedule Display

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: #f5f5f5;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: white;
    }
    .hero {
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      color: white;
      padding: 60px 40px;
      text-align: center;
    }
    .hero h1 {
      font-size: 3rem;
      margin-bottom: 20px;
    }
    .schedules-section {
      padding: 40px;
    }
    .schedules-section h2 {
      text-align: center;
      color: #333;
      margin-bottom: 30px;
    }
    .schedules-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .register-btn {
      display: block;
      width: 100%;
      max-width: 400px;
      margin: 40px auto;
      background: #ff6b6b;
      color: white;
      font-size: 1.3rem;
      font-weight: bold;
      padding: 18px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <h1>{{webinar.title}}</h1>
      <p style="font-size: 1.3rem;">{{webinar.description}}</p>
      <p style="font-size: 1rem; margin-top: 20px;">Duration: {{webinar.duration}} minutes</p>
    </div>
    
    <div class="schedules-section">
      <h2>Available Times</h2>
      <ul class="schedules-list">
        {{schedules}}
      </ul>
      
      <!-- Any button with "register" in class name works! -->
      <button class="register-btn">
        Click Here to Register Free
      </button>
    </div>
  </div>
</body>
</html>
```

### Example 3: Multiple Call-to-Action Buttons

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #fff;
    }
    .header-banner {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      padding: 15px;
      text-align: center;
    }
    .register-button {
      background: white;
      color: #fa709a;
      border: none;
      padding: 12px 30px;
      font-size: 1rem;
      font-weight: bold;
      border-radius: 25px;
      cursor: pointer;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    .hero {
      padding: 60px 20px;
      text-align: center;
      background: #f9f9f9;
    }
    .content {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .cta-section {
      background: #fa709a;
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .cta-section button {
      background: white;
      color: #fa709a;
      border: none;
      padding: 15px 50px;
      font-size: 1.2rem;
      font-weight: bold;
      border-radius: 50px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <!-- Top Banner Button -->
  <div class="header-banner">
    <button class="register-button">SAVE MY SPOT</button>
  </div>
  
  <!-- Hero Section -->
  <div class="hero">
    <h1 style="font-size: 2.5rem; margin-bottom: 20px;">{{webinar.title}}</h1>
    <p style="font-size: 1.2rem; color: #666;">{{webinar.description}}</p>
    
    <!-- Middle Button -->
    <button data-register style="margin-top: 30px; padding: 15px 40px; font-size: 1.1rem; background: #fa709a; color: white; border: none; border-radius: 10px; cursor: pointer;">
      YES! I WANT TO ATTEND
    </button>
  </div>
  
  <!-- Content Section -->
  <div class="content">
    <h2 style="text-align: center; margin-bottom: 30px;">What You'll Learn</h2>
    <ul style="list-style: none; padding: 0;">
      <li style="padding: 15px; margin: 10px 0; background: #f0f0f0; border-radius: 8px;">
        ✅ Learn powerful strategies
      </li>
      <li style="padding: 15px; margin: 10px 0; background: #f0f0f0; border-radius: 8px;">
        ✅ Get insider secrets
      </li>
      <li style="padding: 15px; margin: 10px 0; background: #f0f0f0; border-radius: 8px;">
        ✅ Transform your results
      </li>
    </ul>
  </div>
  
  <!-- Bottom CTA -->
  <div class="cta-section">
    <h2 style="margin-bottom: 20px; font-size: 2rem;">Ready to Join?</h2>
    
    <!-- Bottom Button (using data-register-button) -->
    <button data-register-button>
      REGISTER NOW - IT'S FREE
    </button>
  </div>
</body>
</html>
```

---

## 🎨 Adding Buttons - It's That Simple!

### ANY Button Works!
```html
<!-- All of these work! -->
<button>Register Now</button>
<button class="my-cta">Click Here</button>
<button id="signup">Sign Up Free</button>
<a href="#">Get Started</a>
<a href="#register">Join Now</a>
<input type="button" value="Register">
<input type="submit" value="Sign Up">
```

**No special classes or IDs required!** Every button and link in your template will trigger the registration popup.

---

## 📋 Schedule Integration

When you use `{{schedules}}` in your template, it's automatically replaced with clickable schedule items:

```html
<div class="schedules-container">
  <h2>Choose Your Time</h2>
  <ul style="list-style: none; padding: 0;">
    {{schedules}}
  </ul>
</div>
```

**Each schedule item**:
- Has `data-schedule-id` attribute
- Is automatically clickable
- Opens registration modal when clicked
- Pre-selects that specific time slot
- Has hover effects applied automatically

---

## ⚡ Best Practices

### 1. **Use Multiple CTAs**
Place registration buttons in multiple locations:
- Header banner (top)
- Hero section (middle)
- After benefit lists
- Footer/bottom section

### 2. **Clear Button Text**
Use action-oriented text:
- ✅ "REGISTER NOW - FREE"
- ✅ "SAVE MY SPOT"
- ✅ "YES! I WANT TO ATTEND"
- ❌ "Click Here" (too vague)
- ❌ "More Info" (not clear)

### 3. **Make Buttons Stand Out**
```css
.register-button {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
  color: white;
  font-size: 1.2rem;
  font-weight: bold;
  padding: 15px 40px;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 8px 16px rgba(255, 107, 107, 0.3);
  transition: transform 0.3s ease;
}

.register-button:hover {
  transform: translateY(-2px);
}
```

### 4. **Responsive Design**
```css
/* Mobile-friendly buttons */
@media (max-width: 768px) {
  .register-button {
    width: 100%;
    font-size: 1rem;
    padding: 12px 20px;
  }
}
```

### 5. **Use Template Variables**
Always include:
- `{{webinar.title}}` - Shows webinar name
- `{{webinar.description}}` - Shows full description
- `{{webinar.duration}}` - Shows how long it is
- `{{schedules}}` - Shows available times

---

## 🔧 Troubleshooting

### Problem: Buttons Don't Work

**Solution 1**: Make sure you're using custom template
- Template must be assigned to the webinar
- Visit the registration page (not dashboard)

**Solution 2**: Check if it's actually a button
```html
<!-- ✅ These work -->
<button>Click Me</button>
<a href="#">Sign Up</a>

<!-- ❌ These don't work -->
<div class="button">Click Me</div>
<span onclick="register()">Sign Up</span>
```

**Solution 3**: Check console for errors
- Open browser DevTools (F12)
- Look for JavaScript errors
- Check if buttons were detected (console shows count)

### Problem: Schedules Not Showing

**Check your HTML includes**:
```html
{{schedules}}
```

**Not**:
```html
{{ schedules }}  <!-- ❌ Extra spaces -->
{schedules}      <!-- ❌ Single braces -->
```

### Problem: Variables Not Replacing

**Make sure you use exact syntax**:
```html
<!-- ✅ Correct -->
{{webinar.title}}

<!-- ❌ Wrong -->
{{ webinar.title }}
{webinar.title}
{{webinarTitle}}
```

---

## 📊 Testing Your Template

### Step 1: Create Template
1. Go to `/dashboard/templates/new`
2. Paste your HTML
3. Click "Create Template"

### Step 2: Preview
1. Click "👁️ Preview Template" button
2. Check if:
   - Variables are replaced
   - Layout looks good
   - Buttons are visible

### Step 3: Test in Webinar
1. Create/Edit a webinar
2. Select your template
3. Save and visit the registration page
4. Test clicking registration buttons
5. Verify registration modal opens

### Step 4: Check Console
Open browser console (F12) and look for:
```
Found registration buttons: 3
Found schedule items: 2
```

This confirms buttons were detected!

---

## 🎯 Advanced Examples

### Countdown Timer Template
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .countdown {
      display: flex;
      gap: 20px;
      justify-content: center;
      margin: 30px 0;
    }
    .countdown-item {
      background: white;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      min-width: 80px;
    }
    .countdown-value {
      font-size: 2.5rem;
      font-weight: bold;
      color: #ff6b6b;
    }
    .countdown-label {
      font-size: 0.9rem;
      color: #666;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 60px 20px; text-align: center;">
    <h1>{{webinar.title}}</h1>
    <p style="font-size: 1.2rem; margin: 20px 0;">{{webinar.description}}</p>
    
    <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; margin: 30px auto; max-width: 600px;">
      <p style="font-size: 1.1rem; margin-bottom: 15px;">LIMITED SPOTS AVAILABLE</p>
      <div class="countdown">
        <div class="countdown-item">
          <div class="countdown-value" id="days">00</div>
          <div class="countdown-label">Days</div>
        </div>
        <div class="countdown-item">
          <div class="countdown-value" id="hours">00</div>
          <div class="countdown-label">Hours</div>
        </div>
        <div class="countdown-item">
          <div class="countdown-value" id="minutes">00</div>
          <div class="countdown-label">Minutes</div>
        </div>
        <div class="countdown-item">
          <div class="countdown-value" id="seconds">00</div>
          <div class="countdown-label">Seconds</div>
        </div>
      </div>
    </div>
    
    <button data-register-button style="background: #ff6b6b; color: white; border: none; padding: 18px 50px; font-size: 1.3rem; font-weight: bold; border-radius: 50px; cursor: pointer; text-transform: uppercase;">
      Register Now - FREE
    </button>
  </div>
  
  <script>
    // Countdown to 3 days from now
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);
    
    function updateCountdown() {
      const now = new Date();
      const diff = targetDate - now;
      
      document.getElementById('days').textContent = Math.floor(diff / (1000 * 60 * 60 * 24));
      document.getElementById('hours').textContent = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      document.getElementById('minutes').textContent = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      document.getElementById('seconds').textContent = Math.floor((diff % (1000 * 60)) / 1000);
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
  </script>
</body>
</html>
```

### Video Background Template
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 0; overflow-x: hidden; }
    .video-background {
      position: relative;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .video-background::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1;
    }
    .content {
      position: relative;
      z-index: 2;
      text-align: center;
      color: white;
      padding: 40px;
      max-width: 800px;
    }
    .content h1 {
      font-size: 3.5rem;
      margin-bottom: 20px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    .content p {
      font-size: 1.5rem;
      margin-bottom: 40px;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>
  <div class="video-background" style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);">
    <div class="content">
      <h1>{{webinar.title}}</h1>
      <p>{{webinar.description}}</p>
      <p style="font-size: 1.2rem; margin-bottom: 30px;">
        📅 Duration: {{webinar.duration}} minutes
      </p>
      
      <button class="register-button" style="
        background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
        color: white;
        border: none;
        padding: 20px 60px;
        font-size: 1.5rem;
        font-weight: bold;
        border-radius: 50px;
        cursor: pointer;
        text-transform: uppercase;
        box-shadow: 0 10px 25px rgba(255, 107, 107, 0.4);
        transition: all 0.3s ease;
      ">
        Reserve My Spot Now
      </button>
    </div>
  </div>
</body>
</html>
```

---

## 📚 Summary

### ✅ What Works Automatically:
- Any button with "register" in class, ID, or data attribute
- Links with "register" in href
- Schedule items with `data-schedule-id`
- Hover effects on schedule items
- Registration modal popup
- Form validation and submission

### ✅ What You Need to Do:
- Create your HTML design
- Add registration buttons (with one of the supported selectors)
- Use template variables for dynamic content
- Test your template

### ❌ What You DON'T Need:
- Custom JavaScript for registration
- Form HTML (modal handles it)
- Schedule click handlers (automatic)
- API integration code (automatic)

---

## 🚀 Ready to Create?

1. Copy one of the example templates above
2. Customize the design to match your brand
3. Add your own colors, fonts, and styling
4. Create template in dashboard
5. Preview to verify
6. Use in your webinars!

**Questions?** Check the troubleshooting section or review the examples above.

---

**Last Updated**: October 31, 2025  
**Status**: Production Ready ✅
