# Embeddable Registration Forms - Complete Guide

## Overview

The new embed system allows users to add webinar registration forms to ANY website with a simple code snippet. No more template conflicts!

## Features

### 1. **Two Form Types**

#### Inline Form
- Embeds directly on the page
- Perfect for landing pages
- Seamless integration

#### Popup Form
- Opens in a modal when button is clicked
- Perfect for existing pages
- Non-intrusive

### 2. **Four Beautiful Themes**

1. **Default** - Purple gradient, professional
2. **Modern** - Indigo/purple gradient with white text
3. **Minimal** - Clean gray design
4. **Vibrant** - Pink/red gradient, eye-catching

### 3. **How to Use**

#### For Inline Forms:

```html
<!-- Add this where you want the form to appear -->
<div id="webinar-embed-WEBINAR_ID"></div>
<script src="YOUR_DOMAIN/api/embed/WEBINAR_ID?theme=default&type=inline"></script>
```

#### For Popup Forms:

```html
<!-- Add this to your button -->
<button data-webinar-popup="WEBINAR_ID">Register for Webinar</button>

<!-- Add this script anywhere on your page -->
<script src="YOUR_DOMAIN/api/embed/WEBINAR_ID?theme=default&type=popup"></script>
```

## How It Works

1. User copies embed code from dashboard
2. Pastes it into their website HTML
3. Script loads and generates form dynamically
4. Form submission goes directly to registration API
5. Success message shown after registration

## Benefits

✅ **No JavaScript Conflicts** - We control all the code
✅ **Reliable Button Clicks** - No template scripts interfering  
✅ **Mobile Responsive** - Tested and optimized
✅ **Easy to Use** - Copy/paste, no HTML knowledge needed
✅ **Multiple Sites** - Use same embed code on unlimited sites

## Usage

1. Go to webinar edit page
2. Scroll to "📋 Embed Registration Form" section
3. Choose form type (inline/popup)
4. Select theme
5. Copy embed code
6. Click "Preview" to test
7. Paste code into your website
