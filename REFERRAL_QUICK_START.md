# 🎁 Referral System - Quick Start

## ✅ System is READY!

The referral system is fully implemented and working. Here's how to use it:

## For Template Creators

### Step 1: Edit Your Thank You Page Template

Go to: **Dashboard → Templates → Thank You Pages**

### Step 2: Add Referral Section

Copy one of these examples into your template:

#### Option A: Full Featured (Recommended)

```html
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center;">
    <h2 style="margin: 0 0 10px 0;">🎁 Invite Your Friends!</h2>
    <p style="margin: 0 0 20px 0; opacity: 0.9;">Share this webinar with your network</p>
    
    <!-- Copy Link Box -->
    <div style="background: rgba(255,255,255,0.2); border-radius: 8px; padding: 15px; margin: 20px 0; display: flex; gap: 10px; align-items: center;">
        <input 
            type="text" 
            value="{{referralLink}}" 
            readonly 
            id="refLink"
            onclick="this.select()"
            style="flex: 1; padding: 10px; border: none; border-radius: 6px; font-family: monospace;"
        />
        <button onclick="copyLink()" style="background: white; color: #667eea; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer;">
            📋 Copy
        </button>
    </div>
    
    <!-- Share Buttons -->
    <a href="{{whatsappReferralLink}}" target="_blank" style="display: inline-block; background: rgba(255,255,255,0.1); border: 2px solid rgba(255,255,255,0.3); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 5px; font-weight: 600;">
        📱 Share on WhatsApp
    </a>
    
    <!-- Code Display -->
    <p style="margin: 20px 0 0 0; font-size: 12px; opacity: 0.8;">
        Your code: <strong style="font-size: 24px; letter-spacing: 3px; font-family: monospace;">{{referralCode}}</strong>
    </p>
</div>

<script>
function copyLink() {
    const input = document.getElementById('refLink');
    input.select();
    navigator.clipboard.writeText(input.value).then(() => {
        alert('✅ Link copied!');
    });
}
</script>
```

#### Option B: Minimal Version

```html
<div style="background: #f0f9ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
    <h3>🎁 Share With Friends</h3>
    <input 
        type="text" 
        value="{{referralLink}}" 
        readonly 
        onclick="this.select()"
        style="width: 100%; max-width: 500px; padding: 10px; border: 1px solid #ccc; border-radius: 6px; margin: 10px 0; text-align: center; font-family: monospace;"
    />
    <br>
    <a href="{{whatsappReferralLink}}" target="_blank" style="display: inline-block; background: #25D366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
        📱 Share on WhatsApp
    </a>
    <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">
        Your code: <strong>{{referralCode}}</strong>
    </p>
</div>
```

#### Option C: Just the Link

```html
<p style="text-align: center; padding: 15px; background: #f9fafb; border-radius: 6px;">
    🎁 Share: <a href="{{referralLink}}" style="font-family: monospace; color: #3b82f6;">{{referralLink}}</a>
    <br>
    <small style="color: #666;">Your code: <strong>{{referralCode}}</strong></small>
</p>
```

## Available Variables

Use these in your thank you page templates:

| Variable | Output | Use For |
|----------|--------|---------|
| `{{referralCode}}` | ABC123 | Display the code |
| `{{referralLink}}` | https://yoursite.com/w/webinar?ref=ABC123 | Copy link, direct share |
| `{{whatsappReferralLink}}` | https://wa.me/?text=... | WhatsApp share button |

## How It Works

### For Users:
1. User A registers → Gets code "ABC123"
2. Thank you page shows their referral link
3. They share: `https://yoursite.com/w/webinar?ref=ABC123`
4. User B clicks link and registers
5. System tracks: User B was referred by User A

### For You:
1. Edit thank you template
2. Add referral section with variables
3. Variables automatically replaced with real data
4. Users can share immediately

## Testing

1. Register for a test webinar
2. Check the thank you page
3. You should see your referral code and link
4. Copy the link
5. Open in private/incognito browser
6. Register as different person
7. Check database to confirm tracking

## View in Dashboard

Go to: **Dashboard → Templates → Thank You Pages**

You'll see the new variables listed:
- `{{referralCode}}` ← NEW
- `{{referralLink}}` ← NEW  
- `{{whatsappReferralLink}}` ← NEW

## Examples Gallery

Check `REFERRAL_TEMPLATE_EXAMPLES.md` for:
- Complete gradient design
- Minimal clean design
- Social share buttons
- Copy-to-clipboard code
- Mobile-responsive layouts

## What's Already Done

✅ Database setup
✅ API integration
✅ Registration forms capture referral codes
✅ Template variables working
✅ WhatsApp sharing ready
✅ Documentation complete

## What You Need To Do

1. **Edit your thank you page template**
2. **Add one of the referral sections above**
3. **Save and test**
4. **Done!**

That's it! The system handles everything else automatically.

## Questions?

- See `REFERRAL_SYSTEM_COMPLETE.md` for full technical details
- See `REFERRAL_TEMPLATE_EXAMPLES.md` for more design options
- See `REFERRAL_SYSTEM_STATUS.md` for implementation status

**The referral system is ready to use! Just add it to your templates.** 🚀
