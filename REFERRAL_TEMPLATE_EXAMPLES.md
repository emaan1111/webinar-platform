# Thank You Page Template - Referral System Example

## New Template Variables Available

### Referral System Variables

1. **`{{referralCode}}`** - User's unique 6-character referral code
   - Example: "ABC123"
   - Use this to display their code

2. **`{{referralLink}}`** - Full shareable URL with referral code
   - Example: "https://yoursite.com/w/free-class?ref=ABC123"
   - Use this for copy-to-clipboard or direct sharing

3. **`{{whatsappReferralLink}}`** - Pre-formatted WhatsApp share link
   - Opens WhatsApp with pre-filled message including referral link
   - Example: "https://wa.me/?text=I%20just%20registered..."

## Complete Example Template with Referral Section

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You - {{webinarTitle}}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 700px;
            margin: 0 auto;
            padding: 20px;
            background: #f9fafb;
            line-height: 1.6;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1 {
            color: #1a1a1a;
            margin-bottom: 10px;
        }
        .info-box {
            background: #f0f9ff;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 6px;
        }
        
        /* REFERRAL SECTION */
        .referral-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin: 30px 0;
            text-align: center;
        }
        .referral-section h2 {
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        .referral-section p {
            margin: 0 0 20px 0;
            opacity: 0.9;
        }
        .referral-link-box {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .referral-link-box input {
            flex: 1;
            background: white;
            border: none;
            padding: 10px;
            border-radius: 6px;
            font-family: monospace;
            font-size: 14px;
        }
        .copy-btn {
            background: white;
            color: #667eea;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
        }
        .copy-btn:hover {
            background: #f3f4f6;
        }
        .share-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .share-btn {
            flex: 1;
            min-width: 150px;
            padding: 12px 24px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.1);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.2s;
        }
        .share-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
        }
        .referral-code-display {
            background: rgba(255, 255, 255, 0.15);
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
        }
        .referral-code-display code {
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 4px;
            font-family: 'Courier New', monospace;
        }
        
        .btn {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin-top: 20px;
            transition: background 0.2s;
        }
        .btn:hover {
            background: #2563eb;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 Thank You for Registering!</h1>
        <p>Hi <strong>{{attendeeName}}</strong>,</p>
        <p>You're all set for: <strong>{{webinarTitle}}</strong></p>
        
        <div class="info-box">
            <p><strong>📅 Date:</strong> {{webinarDate}}</p>
            <p><strong>⏰ Time:</strong> {{webinarTime}}</p>
            <p><strong>⏱️ Duration:</strong> {{webinarDuration}} minutes</p>
            <p><strong>👤 Host:</strong> {{hostName}}</p>
        </div>
        
        <a href="{{joinLink}}" class="btn">📺 Go to Countdown Page</a>
        
        <!-- REFERRAL SECTION -->
        <div class="referral-section">
            <h2>🎁 Invite Your Friends!</h2>
            <p>Share this webinar and help others join too. Each friend you invite gets access to this amazing event!</p>
            
            <!-- Referral Link -->
            <div class="referral-link-box">
                <input 
                    type="text" 
                    value="{{referralLink}}" 
                    readonly 
                    id="referralLinkInput"
                    onclick="this.select()"
                />
                <button class="copy-btn" onclick="copyReferralLink()">
                    📋 Copy
                </button>
            </div>
            
            <!-- Share Buttons -->
            <div class="share-buttons">
                <a href="{{whatsappReferralLink}}" target="_blank" class="share-btn">
                    📱 WhatsApp
                </a>
                <a href="mailto:?subject=Join me for {{webinarTitle}}&body=I just registered for an amazing webinar! Join me: {{referralLink}}" class="share-btn">
                    ✉️ Email
                </a>
                <a href="https://twitter.com/intent/tweet?text=I just registered for {{webinarTitle}}! Join me: {{referralLink}}" target="_blank" class="share-btn">
                    🐦 Twitter
                </a>
            </div>
            
            <!-- Referral Code Display -->
            <div class="referral-code-display">
                <p style="margin: 0 0 5px 0; font-size: 12px; opacity: 0.8;">Your Referral Code:</p>
                <code>{{referralCode}}</code>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
                📧 Confirmation email sent to: <strong>{{attendeeEmail}}</strong>
            </p>
            <p style="color: #6b7280; font-size: 14px;">
                Registration ID: <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">{{registrationId}}</code>
            </p>
        </div>
    </div>
    
    <script>
        function copyReferralLink() {
            const input = document.getElementById('referralLinkInput');
            input.select();
            input.setSelectionRange(0, 99999); // For mobile
            
            try {
                navigator.clipboard.writeText(input.value).then(() => {
                    const btn = event.target;
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '✅ Copied!';
                    btn.style.background = '#10b981';
                    btn.style.color = 'white';
                    
                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.style.background = '';
                        btn.style.color = '';
                    }, 2000);
                });
            } catch (err) {
                // Fallback for older browsers
                document.execCommand('copy');
                alert('Link copied to clipboard!');
            }
        }
    </script>
</body>
</html>
```

## Simpler Version (Minimal Referral Section)

```html
<!-- Add this to your existing thank you template -->
<div style="background: #f0f9ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
    <h3 style="margin: 0 0 10px 0;">🎁 Share With Friends</h3>
    <p style="margin: 0 0 15px 0; color: #374151;">Your personal referral link:</p>
    
    <input 
        type="text" 
        value="{{referralLink}}" 
        readonly 
        onclick="this.select()"
        style="width: 100%; max-width: 500px; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; text-align: center; font-family: monospace; margin-bottom: 15px;"
    />
    
    <div>
        <a href="{{whatsappReferralLink}}" target="_blank" style="display: inline-block; background: #25D366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin: 5px;">
            📱 Share on WhatsApp
        </a>
    </div>
    
    <p style="margin: 15px 0 0 0; font-size: 12px; color: #6b7280;">
        Your code: <strong style="font-family: monospace; font-size: 14px;">{{referralCode}}</strong>
    </p>
</div>
```

## Just Display the Code (Minimalist)

```html
<p style="text-align: center; padding: 15px; background: #f9fafb; border-radius: 6px; margin: 20px 0;">
    🎁 Your referral code: <strong style="font-family: monospace; font-size: 18px; color: #3b82f6;">{{referralCode}}</strong>
    <br>
    <small style="color: #6b7280;">Share this link: <a href="{{referralLink}}">{{referralLink}}</a></small>
</p>
```

## Variables Explained

### `{{referralCode}}`
- **Output**: "ABC123" (6-character unique code)
- **Use for**: Displaying the code, showing in confirmation emails
- **Example**: `<code>{{referralCode}}</code>`

### `{{referralLink}}`
- **Output**: "https://yoursite.com/w/free-class?ref=ABC123"
- **Use for**: Copy-to-clipboard, direct sharing, email links
- **Example**: `<input value="{{referralLink}}" readonly />`

### `{{whatsappReferralLink}}`
- **Output**: "https://wa.me/?text=I%20just%20registered%20for%20'Webinar'!%20Join%20me:%20https://yoursite.com/w/free-class?ref=ABC123"
- **Use for**: WhatsApp share button
- **Example**: `<a href="{{whatsappReferralLink}}">Share on WhatsApp</a>`

## How It Works

1. User registers → Gets unique code "ABC123"
2. Thank you page shows their referral link
3. They click "Copy" or "Share on WhatsApp"
4. Friend clicks link: `https://yoursite.com/w/free-class?ref=ABC123`
5. Friend registers → System records they were referred by "ABC123"
6. Database tracks: Friend's `referredBy` = "ABC123"

## Testing

1. Register for a webinar
2. After registration, check the thank you page
3. You should see:
   - Your unique referral code (e.g., "ABC123")
   - A shareable link with `?ref=ABC123`
   - WhatsApp share button
4. Copy the link and open in incognito/private browser
5. Register as a different person
6. Check database to confirm referral was tracked

## Tips

- **Always include copy button** - Makes sharing easier
- **Add WhatsApp share** - Most popular sharing method
- **Show the code visually** - Use large, monospace font
- **Explain why to share** - "Help friends discover this event"
- **Make it prominent** - Use colors/gradient to stand out
- **Test on mobile** - Most sharing happens on phones

## Status

✅ Variables are live and working
✅ Referral tracking is active
✅ Registration forms capture referral codes
✅ Ready to add to your templates!

Just copy any of the examples above into your thank you page template and the variables will be replaced with real data automatically.
