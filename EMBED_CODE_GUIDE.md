# Webinar Registration Embed Code - Complete Guide

## 🎯 What It Does
Allows you to embed the **registration popup** from your webinar onto any external website (ClickFunnels, WordPress, custom HTML pages, etc.) so visitors can register without leaving the page.

## 📍 Where to Find It

### Dashboard Location:
1. Go to **Dashboard** → **Webinars**
2. Click on your webinar
3. Scroll down to **"Embed Code Generator"** section
4. Choose your embed style and copy the code

**OR**

Direct path: `/dashboard/webinars/[your-webinar-id]/edit`

## 🔧 How to Use

### **Option 1: Popup Form** (Recommended)
The registration form opens in a beautiful modal when someone clicks a button.

#### Step 1: Copy the embed code
```html
<!-- Add this to your button -->
<button data-webinar-popup="cmXXXXXXXXXXX">Register for Webinar</button>

<!-- Add this script anywhere on your page -->
<script src="https://yourdomain.com/api/embed/cmXXXXXXXXXXX?theme=purple&type=popup"></script>
```

#### Step 2: Customize your button
You can style the button however you want! Just keep the `data-webinar-popup` attribute:

```html
<!-- Example 1: Custom styled button -->
<button 
  data-webinar-popup="cmXXXXXXXXXXX"
  style="background: #8b5cf6; color: white; padding: 16px 32px; border: none; border-radius: 8px; font-size: 18px; font-weight: bold; cursor: pointer;">
  🎯 Reserve My Spot Now!
</button>

<!-- Example 2: Link instead of button -->
<a 
  href="#" 
  data-webinar-popup="cmXXXXXXXXXXX"
  style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 12px 24px; text-decoration: none; border-radius: 50px;">
  Click Here to Register
</a>

<!-- Example 3: Image button -->
<div data-webinar-popup="cmXXXXXXXXXXX" style="cursor: pointer;">
  <img src="register-button.png" alt="Register Now">
</div>
```

#### Step 3: Add the script tag
Place this once at the bottom of your page (before `</body>`):
```html
<script src="https://yourdomain.com/api/embed/cmXXXXXXXXXXX?theme=purple&type=popup"></script>
```

---

### **Option 2: Inline Form**
The registration form is embedded directly into your page.

#### Step 1: Copy the embed code
```html
<!-- Webinar Registration Form -->
<div id="webinar-embed-cmXXXXXXXXXXX"></div>
<script src="https://yourdomain.com/api/embed/cmXXXXXXXXXXX?theme=purple&type=inline"></script>
```

#### Step 2: Paste into your page
Place this code where you want the form to appear on your page.

---

## 🎨 Available Themes

Change the `theme` parameter in the script URL:

| Theme | Parameter | Colors |
|-------|-----------|--------|
| **Purple** (default) | `theme=purple` | Purple → Blue gradient |
| **Blue** | `theme=blue` | Blue → Cyan gradient |
| **Green** | `theme=green` | Green → Emerald gradient |

**Example:**
```html
<!-- Blue theme -->
<script src="https://yourdomain.com/api/embed/cmXXXX?theme=blue&type=popup"></script>
```

---

## 🌐 Platform-Specific Instructions

### **ClickFunnels 2.0**
1. In your funnel page editor, add an **HTML element**
2. Paste the popup embed code
3. Customize the button text/styling to match your page
4. Save and publish

### **ClickFunnels Classic**
1. Add a **Custom HTML/CSS** element
2. Paste the entire embed code
3. Style the button to match your page design
4. Save

### **WordPress**
1. Edit your page with Gutenberg or page builder
2. Add a **Custom HTML** block
3. Paste the embed code
4. Preview and publish

### **Kajabi**
1. Add a **Code** block to your page
2. Paste the embed code
3. Publish your page

### **Custom HTML Page**
Just paste the code anywhere in your HTML:
```html
<!DOCTYPE html>
<html>
<head>
  <title>My Webinar Page</title>
</head>
<body>
  <h1>Join Our Free Webinar</h1>
  
  <!-- Your embed code here -->
  <button data-webinar-popup="cmXXXX" style="background: #8b5cf6; color: white; padding: 16px 32px; border: none; border-radius: 8px;">
    Register Now
  </button>
  <script src="https://yourdomain.com/api/embed/cmXXXX?theme=purple&type=popup"></script>
  
</body>
</html>
```

---

## ✨ What the Popup Includes

### Form Fields:
- ✅ Full Name (required)
- ✅ Email Address (required)
- ✅ Phone Number with country code selector (required)
- ✅ Webinar Time selection dropdown (required)

### Features:
- ✅ Beautiful animated modal with backdrop blur
- ✅ Form validation with error messages
- ✅ Trust badges ("100% Secure", "No Spam")
- ✅ Privacy message
- ✅ Responsive design (works on mobile)
- ✅ Success confirmation screen
- ✅ Automatic email sent after registration

### Design:
- 🎨 Gradient header matching your theme
- 🎨 Rounded corners and smooth animations
- 🎨 Professional styling
- 🎨 Close button (X) in top right
- 🎨 Click outside to close

---

## 🔍 Testing Your Embed

### Test Locally:
1. Copy the embed code
2. Create a test HTML file:
```html
<!DOCTYPE html>
<html>
<head>
  <title>Embed Test</title>
</head>
<body style="padding: 40px; font-family: sans-serif;">
  <h1>Test Webinar Registration</h1>
  <p>Click the button below to test the registration popup:</p>
  
  <button 
    data-webinar-popup="YOUR_WEBINAR_ID"
    style="background: #8b5cf6; color: white; padding: 16px 32px; border: none; border-radius: 8px; font-size: 18px; cursor: pointer;">
    Register for Free Webinar
  </button>
  
  <script src="http://localhost:3000/api/embed/YOUR_WEBINAR_ID?theme=purple&type=popup"></script>
</body>
</html>
```
3. Open in browser
4. Click the button to test

### Test on Live Site:
1. Add embed code to a test page
2. Visit the page
3. Click the register button
4. Fill out the form
5. Check if registration appears in your dashboard

---

## 🚨 Troubleshooting

### Popup Doesn't Open
**Check:**
- ✅ Script tag is included on the page
- ✅ Button has correct `data-webinar-popup="WEBINAR_ID"` attribute
- ✅ No JavaScript errors in browser console (F12)
- ✅ Webinar ID is correct

### Form Doesn't Submit
**Check:**
- ✅ All required fields are filled
- ✅ Email format is valid
- ✅ Phone number is valid
- ✅ Schedule time is selected
- ✅ Network connection is working
- ✅ Check browser console for API errors

### Styling Looks Wrong
**Check:**
- ✅ No CSS conflicts with your page styles
- ✅ Script is loading (check Network tab in dev tools)
- ✅ Try different theme parameter

### Multiple Buttons Not Working
**Solution:** You can have multiple buttons for the same webinar! Just make sure:
```html
<!-- Button 1 -->
<button data-webinar-popup="cmXXXX">Top Register Button</button>

<!-- Button 2 -->
<button data-webinar-popup="cmXXXX">Middle Register Button</button>

<!-- Button 3 -->
<button data-webinar-popup="cmXXXX">Bottom Register Button</button>

<!-- Script only needs to be included ONCE -->
<script src="https://yourdomain.com/api/embed/cmXXXX?theme=purple&type=popup"></script>
```

---

## 🎯 Best Practices

### 1. **Button Placement**
- Add registration buttons at the top, middle, and bottom of your page
- Make buttons stand out with contrasting colors
- Use action-oriented text ("Register Now", "Save My Spot", "Claim Free Access")

### 2. **Button Design**
```html
<!-- Good: Clear, visible, action-oriented -->
<button data-webinar-popup="cmXXXX" style="
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: white;
  padding: 18px 40px;
  border: none;
  border-radius: 50px;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4);
  transition: transform 0.2s;
">
  🎯 REGISTER NOW - FREE!
</button>
```

### 3. **Loading Speed**
- Place the `<script>` tag at the bottom of your page (before `</body>`)
- This ensures your page content loads first

### 4. **Mobile Optimization**
- The popup is already mobile-responsive
- Test on mobile devices to ensure button is easy to tap
- Recommended minimum button size: 44x44px

### 5. **Conversion Optimization**
- Use urgency in button text ("Limited Spots", "Register Before It's Too Late")
- Match button colors to your brand
- Test different button positions

---

## 📊 Tracking & Analytics

All registrations from embedded forms are tracked in your dashboard:
- ✅ View total registrations per webinar
- ✅ See which registration page/embed generated each signup
- ✅ Track email opens and clicks
- ✅ Monitor attendee status

Path: **Dashboard → Webinars → [Your Webinar] → Registrations**

---

## 🔐 Security & Privacy

### Data Protection:
- ✅ All form submissions use HTTPS
- ✅ No data is stored in cookies or localStorage
- ✅ Privacy-compliant form messaging
- ✅ CORS enabled for cross-origin embedding

### Anti-Spam:
- ✅ Email validation
- ✅ Phone format validation
- ✅ Form submission rate limiting
- ✅ Server-side validation

---

## 🆘 Need Help?

### Common Questions:

**Q: Can I embed on multiple pages?**
A: Yes! Use the same embed code on as many pages as you want.

**Q: Can I have multiple webinars on one page?**
A: Yes! Just use different webinar IDs:
```html
<button data-webinar-popup="webinar-1-id">Webinar 1</button>
<button data-webinar-popup="webinar-2-id">Webinar 2</button>

<script src="/api/embed/webinar-1-id?theme=purple&type=popup"></script>
<script src="/api/embed/webinar-2-id?theme=blue&type=popup"></script>
```

**Q: Does it work with A/B testing?**
A: Yes! The embed will automatically show the correct variant based on A/B test settings.

**Q: Can I customize the form fields?**
A: Currently the form includes: Name, Email, Phone, Schedule. Contact support for custom field requirements.

**Q: Will it slow down my page?**
A: No! The script is lightweight (~15KB) and loads asynchronously.

---

## 📝 Quick Copy-Paste Templates

### Template 1: Simple Button
```html
<button 
  data-webinar-popup="YOUR_WEBINAR_ID"
  style="background: #8b5cf6; color: white; padding: 16px 32px; border: none; border-radius: 8px; font-size: 18px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4);">
  Register for Free Webinar
</button>
<script src="https://yourdomain.com/api/embed/YOUR_WEBINAR_ID?theme=purple&type=popup"></script>
```

### Template 2: Centered CTA Section
```html
<div style="text-align: center; padding: 60px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
  <h2 style="color: white; font-size: 36px; margin-bottom: 20px;">Ready to Join?</h2>
  <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin-bottom: 30px;">Reserve your spot in our exclusive webinar</p>
  <button 
    data-webinar-popup="YOUR_WEBINAR_ID"
    style="background: white; color: #667eea; padding: 20px 50px; border: none; border-radius: 50px; font-size: 20px; font-weight: bold; cursor: pointer; box-shadow: 0 8px 20px rgba(0,0,0,0.3);">
    REGISTER NOW - IT'S FREE!
  </button>
</div>
<script src="https://yourdomain.com/api/embed/YOUR_WEBINAR_ID?theme=purple&type=popup"></script>
```

### Template 3: Multiple CTAs
```html
<!-- Top of page -->
<div style="background: #f9fafb; padding: 40px 20px; text-align: center;">
  <button data-webinar-popup="YOUR_WEBINAR_ID" style="background: #8b5cf6; color: white; padding: 16px 32px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
    Register Now
  </button>
</div>

<!-- Middle of page -->
<div style="margin: 60px 0; text-align: center;">
  <button data-webinar-popup="YOUR_WEBINAR_ID" style="background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 18px 40px; border: none; border-radius: 50px; font-size: 18px; font-weight: bold; cursor: pointer;">
    Save My Spot
  </button>
</div>

<!-- Bottom of page -->
<footer style="background: #1f2937; color: white; padding: 40px 20px; text-align: center;">
  <h3 style="margin-bottom: 20px;">Don't Miss Out!</h3>
  <button data-webinar-popup="YOUR_WEBINAR_ID" style="background: #8b5cf6; color: white; padding: 20px 50px; border: none; border-radius: 8px; font-size: 20px; font-weight: bold; cursor: pointer;">
    Claim Your Free Spot
  </button>
</footer>

<!-- Script only once -->
<script src="https://yourdomain.com/api/embed/YOUR_WEBINAR_ID?theme=purple&type=popup"></script>
```

---

## 🎉 That's It!

Your webinar registration popup is now embeddable anywhere on the internet. Just copy the code, paste it on your page, and start collecting registrations!

**Need the embed code?** Go to: **Dashboard → Webinars → [Your Webinar] → Scroll to "Embed Code Generator"**
