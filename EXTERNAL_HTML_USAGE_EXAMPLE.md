# External HTML Integration - Usage Example

## How to Integrate External HTML with Your Webinar System

### Step 1: Update page-client.tsx

Add the ExternalHtmlRenderer component to handle external HTML pages:

```tsx
// At the top of page-client.tsx
import ExternalHtmlRenderer from '@/components/ExternalHtmlRenderer'

// Inside the component, check if registrationPage has htmlCode
export default function WebinarRegisterPage({ webinarData, registrationPage }: WebinarRegisterPageProps) {
  // ... existing state and hooks ...
  
  // If registration page has custom HTML, render it with ExternalHtmlRenderer
  if (registrationPage?.htmlCode) {
    return (
      <>
        <RegistrationPageTracker 
          webinarId={webinar?.id || webinarData.id} 
          sessionId={`session-${Date.now()}`}
        />
        
        {/* Render external HTML with automatic trigger detection */}
        <ExternalHtmlRenderer
          html={registrationPage.htmlCode}
          onTriggerClick={() => setShowScheduleModal(true)}
        />
        
        {/* The registration modal (same as existing) */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-md">
            {/* ... your existing modal code ... */}
          </div>
        )}
        
        {/* Success state */}
        {registered && (
          <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
            {/* ... your existing success message ... */}
          </div>
        )}
      </>
    )
  }
  
  // Otherwise, render default template
  return (
    <>
      {/* ... your existing default template ... */}
    </>
  )
}
```

### Step 2: Add Database Field (if not exists)

Make sure your RegistrationPage model has the `htmlCode` field:

```prisma
model RegistrationPage {
  id        String   @id @default(cuid())
  name      String
  htmlCode  String?  @db.Text  // Store external HTML here
  // ... other fields ...
}
```

### Step 3: Update Registration Page Form

In your dashboard where admins create registration pages, add an HTML code textarea:

```tsx
// dashboard/registration-pages/create/page.tsx or edit/page.tsx

<div>
  <label htmlFor="htmlCode" className="block text-sm font-medium text-gray-700 mb-2">
    Custom HTML Code (Optional)
  </label>
  <p className="text-sm text-gray-600 mb-2">
    Paste your external HTML page here. All registration buttons will automatically connect to your webinar.
  </p>
  <textarea
    id="htmlCode"
    name="htmlCode"
    rows={20}
    value={formData.htmlCode}
    onChange={(e) => setFormData({ ...formData, htmlCode: e.target.value })}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
    placeholder="<!DOCTYPE html>
<html>
<head>
  <title>Your Landing Page</title>
</head>
<body>
  <button onclick='openPopup()'>Register Now</button>
</body>
</html>"
  />
  <p className="mt-2 text-sm text-gray-500">
    ✅ Automatically removes existing popups<br/>
    ✅ Converts onclick="openPopup()" to webinar registration<br/>
    ✅ Detects .cta-button, .register-button classes<br/>
    ✅ Works with any landing page builder HTML
  </p>
</div>
```

### Step 4: Test Your Integration

1. **Create a Registration Page with External HTML:**
   - Go to Dashboard → Registration Pages → Create New
   - Paste your HTML (like the Emaan Power example)
   - Save

2. **Assign to Webinar:**
   - Go to Dashboard → Webinars → Edit Webinar
   - Select your new registration page
   - Save

3. **Test the Page:**
   - Visit `/w/your-webinar-slug`
   - Click any "Register" button
   - Registration popup should appear
   - Fill form and submit
   - Check Dashboard → Registrations

## Example: The Emaan Power HTML

Here's how the HTML you provided would work:

### Original HTML (What You Paste)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Free Class: Help Your Child Love Islam Without Force</title>
    <style>
        .cta-button {
            background-color: #b08d7c;
            color: white;
            padding: 15px 30px;
            border-radius: 50px;
        }
    </style>
</head>
<body>
    <section class="hero">
        <h1>Help Your Child Love Islam, Deeply.</h1>
        <a href="#" class="cta-button" onclick="openPopup(); return false;">
            Reserve My Free Seat
        </a>
    </section>

    <!-- This popup will be automatically removed -->
    <div id="registrationPopup" class="popup-overlay">
        <div class="popup-content">
            <form>
                <input type="text" name="name" />
                <input type="email" name="email" />
            </form>
        </div>
    </div>

    <script>
        function openPopup() {
            document.getElementById('registrationPopup').style.display = 'flex';
        }
    </script>
</body>
</html>
```

### What Gets Rendered

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Free Class: Help Your Child Love Islam Without Force</title>
    <style>
        .cta-button {
            background-color: #b08d7c;
            color: white;
            padding: 15px 30px;
            border-radius: 50px;
        }
    </style>
</head>
<body>
    <section class="hero">
        <h1>Help Your Child Love Islam, Deeply.</h1>
        <!-- onclick removed, data-webinar-trigger added -->
        <a href="#" class="cta-button" data-webinar-trigger="true">
            Reserve My Free Seat
        </a>
    </section>

    <!-- Popup removed -->
    <!-- Script removed -->
    
    <!-- ExternalHtmlRenderer adds event listeners automatically -->
</body>
</html>
```

### What Happens When Button is Clicked

1. User clicks "Reserve My Free Seat"
2. ExternalHtmlRenderer detects the click (via data-webinar-trigger)
3. Calls `onTriggerClick()` callback
4. `setShowScheduleModal(true)` is called
5. Your webinar registration modal appears
6. User fills form with name, email, phone, schedule
7. Data is saved to your database
8. Confirmation email is sent

## Automatic Detection Patterns

The `ExternalHtmlRenderer` automatically detects these patterns:

### 1. onclick Handlers
```html
<button onclick="openPopup()">Register</button>
<a onclick="showPopup()">Register</a>
<div onclick="openRegistration()">Register</div>
```

### 2. CSS Classes
```html
<button class="cta-button">Register</button>
<button class="register-button">Register</button>
<button class="btn-register">Register</button>
```

### 3. href Patterns
```html
<a href="#register">Register</a>
<a href="#registration">Register</a>
<a href="#signup">Register</a>
```

### 4. Text Content
Buttons/links containing these keywords:
- "Register"
- "Sign Up"
- "Reserve"
- "Save My Spot"
- "Claim"
- "Join Now"
- "Book Now"
- "Enroll"

## Advanced: Multiple Buttons

You can have unlimited registration buttons on your page:

```html
<!-- Top CTA -->
<button class="cta-button">Register Now</button>

<!-- Middle CTA -->
<a href="#" onclick="openPopup()">Save My Spot</a>

<!-- Bottom CTA -->
<button>Reserve Your Free Seat</button>

<!-- Floating CTA -->
<div class="sticky-cta">
  <button class="register-button">Don't Miss Out!</button>
</div>

<!-- All will work automatically! -->
```

## Styling the Registration Modal

The registration modal uses your system's default styling. To match your external HTML, you can:

1. **Use Popup Themes** (already implemented):
   - Purple (default)
   - Blue
   - Green
   - Red
   - Orange

2. **Custom CSS** (add to your external HTML):
```html
<style>
  /* Style the modal overlay */
  .fixed.inset-0.backdrop-blur-md {
    background: rgba(176, 141, 124, 0.9) !important;
  }
  
  /* Style the modal content */
  .bg-white.rounded-3xl {
    background: linear-gradient(135deg, #c9a99a, #b08d7c) !important;
  }
</style>
```

## Security

The ExternalHtmlRenderer automatically:
- ✅ Removes dangerous inline scripts
- ✅ Sanitizes HTML to prevent XSS
- ✅ Removes existing popup modals
- ✅ Preserves safe styles and assets
- ✅ Maintains analytics scripts (Google Analytics, Facebook Pixel, etc.)

## Troubleshooting

### Issue: Buttons don't trigger popup

**Solution 1:** Check browser console for errors:
```
F12 → Console tab
Look for: [ExternalHtmlRenderer] Found X registration trigger elements
```

**Solution 2:** Manually add data-webinar-trigger:
```html
<button data-webinar-trigger="true">Register Now</button>
```

**Solution 3:** Check if registrationPage.htmlCode has content:
```tsx
console.log('HTML Code:', registrationPage?.htmlCode?.substring(0, 100))
```

### Issue: Original popup still appears

**Solution:** The removal pattern might not match. Add more specific removal:

```tsx
// In ExternalHtmlRenderer.tsx, add to processHtml:
processed = processed.replace(
  /<div[^>]*id\s*=\s*["']yourSpecificPopupId["'][^>]*>[\s\S]*?<\/div>/gi,
  ''
)
```

### Issue: Styles look broken

**Solution:** Wrap your HTML in a container:

```html
<div class="external-landing-page" style="all: initial;">
  <!-- Your HTML content -->
</div>
```

Then scope your CSS:
```css
.external-landing-page * {
  /* Your styles */
}
```

## Complete Example

Here's a complete working example:

**1. External HTML (paste into registration page):**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Amazing Webinar</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
        .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; padding: 100px 20px; text-align: center; }
        .cta-button { background: white; color: #667eea; padding: 20px 40px; 
                      border: none; border-radius: 50px; font-size: 18px; 
                      font-weight: bold; cursor: pointer; }
    </style>
</head>
<body>
    <section class="hero">
        <h1>Transform Your Life</h1>
        <p>Join our exclusive webinar</p>
        <button class="cta-button" onclick="openPopup()">Register Now</button>
    </section>
</body>
</html>
```

**2. Result:**
- Visit `/w/your-webinar-slug`
- See your styled landing page
- Click "Register Now"
- Your webinar registration modal appears
- Registration saves to database
- Email confirmation sent

**Perfect!** 🎉

## Next Steps

1. ✅ Read the [External HTML Integration Guide](./EXTERNAL_HTML_INTEGRATION_GUIDE.md)
2. ✅ Copy the ExternalHtmlRenderer component
3. ✅ Update page-client.tsx to use it
4. ✅ Add htmlCode field to registration page form
5. ✅ Test with your external HTML
6. ✅ Go live!

---

**Questions?** Check the [Troubleshooting section](#troubleshooting) or the [External HTML Integration Guide](./EXTERNAL_HTML_INTEGRATION_GUIDE.md).
