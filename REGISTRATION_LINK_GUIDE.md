# How to Create and Share Your Registration Page

## Quick Start Guide

### Step 1: Create a Webinar with Slug

1. Go to **Create Webinar**: `http://localhost:3001/dashboard/webinars/new`

2. Fill in the **required fields**:
   - **Webinar Title**: "How to Help Your Child Love Islam"
   - **Public URL Slug**: Auto-generates as you type the title
     - Example: `help-child-love-islam`
     - You can customize it (lowercase, hyphens only)
   - **Description**: At least 20 characters
   - **Duration**: In minutes (default: 60)

3. The slug field now shows your **public URL** in real-time:
   ```
   http://localhost:3001/w/help-child-love-islam
   ```

4. **Add at least one schedule**:
   - Click "Add Schedule"
   - Choose type:
     - **Specific Date**: e.g., Dec 22, 2025 at 2 PM
     - **Recurring**: e.g., Mondays at 11 AM
     - **Just-in-Time**: e.g., 5 minutes after registration
   - Save the schedule

5. Set **"Number of schedules to show"** (default is 3):
   - This controls how many upcoming time slots users see
   - For recurring: Shows next N occurrences
   - For specific dates: Shows next N future dates

6. Click **"Schedule Webinar"** (not "Save as Draft")
   - Status must be "SCHEDULED" for public access

### Step 2: Get Your Registration Link

**Option A: From the creation success page**
- After creating, you'll see the webinar ID
- Your link: `http://localhost:3001/w/[your-slug]`

**Option B: From Webinar Detail Page**
1. Go to: `http://localhost:3001/dashboard/webinars`
2. Click on your webinar
3. Scroll to **"Registration Settings"** card
4. You'll see:
   - Current "Schedules to Show" count
   - Public Registration URL with **Copy button**

### Step 3: Share Your Link

Your registration page URL format:
```
http://localhost:3001/w/help-child-love-islam
```

Share this link via:
- ✅ Email campaigns
- ✅ Social media posts
- ✅ WhatsApp/Telegram groups
- ✅ Your website
- ✅ SMS messages

---

## Example: Complete Workflow

### Scenario: Weekly Mother's Class

**1. Create Webinar**
```
Title: "FREE CLASS FOR MOTHERS - Help Your Child Love Islam"
Slug: "mothers-class-love-islam" (auto-generated, or customize)
Description: "You've taught them. You've reminded them..."
Duration: 60 minutes
Max Schedules to Show: 3
```

**2. Add Recurring Schedule**
```
Type: Recurring
Interval: Weekly
Days: Monday
Time: 11:00 AM
Timezone: America/New_York
```

**3. Your Registration Page**
```
URL: http://localhost:3001/w/mothers-class-love-islam
```

**Users Will See:**
- Monday, Nov 4, 2025 at 11:00 AM
- Monday, Nov 11, 2025 at 11:00 AM
- Monday, Nov 18, 2025 at 11:00 AM

They select a time, fill the form, and register!

---

## Customization Options

### Controlling Schedule Visibility

From the webinar detail page:
1. Find "Registration Settings" card
2. Click "Edit" next to "Schedules to Show"
3. Enter new number (e.g., 5, 7, 10)
4. Click OK

**Examples:**
- `maxSchedulesToShow = 3`: Shows next 3 occurrences
- `maxSchedulesToShow = 5`: Shows next 5 occurrences
- `maxSchedulesToShow = 1`: Shows only next occurrence

### URL Slug Best Practices

✅ **Good Slugs:**
- `help-child-love-islam`
- `free-mothers-class`
- `emaan-power-webinar-2025`

❌ **Bad Slugs:**
- `My Webinar!` (capitals, spaces, special chars)
- `FREE CLASS` (capitals, space)
- `webinar_1` (underscores not recommended)

**Rules:**
- Lowercase only
- Use hyphens for spaces
- No special characters
- Keep it descriptive
- Keep it short (under 50 characters)

---

## Testing Your Registration Page

### Before Sharing:

1. **Visit your page**: `http://localhost:3001/w/[your-slug]`

2. **Check the design**:
   - ✅ Header with purple/teal gradient
   - ✅ Countdown timer (3 days)
   - ✅ Bonus gift section
   - ✅ "What You Will Learn" section
   - ✅ Author bio
   - ✅ CTA buttons

3. **Click "CLAIM MY FREE PLACE"**:
   - ✅ Modal opens
   - ✅ Shows correct number of schedule slots
   - ✅ Timezone auto-detects
   - ✅ Form fields work

4. **Test Registration**:
   - Fill in: Name, Email, Phone
   - Select a schedule
   - Accept privacy policy
   - (EU users see GDPR consent)
   - Click "Register"
   - ✅ See success confirmation

5. **Verify in Admin Dashboard**:
   - Go to: `http://localhost:3001/dashboard/attendees`
   - ✅ See your test registration
   - ✅ All fields populated correctly

---

## Common Issues & Solutions

### Issue: "Webinar not found"
**Solution**: 
- Make sure webinar status is "SCHEDULED" (not DRAFT)
- Verify the slug is correct (check for typos)

### Issue: No schedules showing
**Solution**:
- Add at least one schedule to the webinar
- Make sure schedule is set to "active"
- For specific dates, ensure they're in the future

### Issue: Registration page looks broken
**Solution**:
- Clear browser cache
- Check browser console for errors
- Verify the slug route exists: `/w/[slug]`

### Issue: Can't find the slug field
**Solution**:
- The slug field is now in the "Create Webinar" form
- It's right after the "Title" field
- It auto-generates from your title

---

## Production Deployment

When you deploy to production:

1. **Change the domain** in your slug display:
   ```
   OLD: http://localhost:3001/w/your-slug
   NEW: https://yourdomain.com/w/your-slug
   ```

2. **Update NEXTAUTH_URL** in `.env`:
   ```
   NEXTAUTH_URL="https://yourdomain.com"
   ```

3. **Set up custom domain** with your hosting provider

4. **Share the production URL** with your audience

---

## Advanced: Multiple Webinars

You can create multiple webinars with different slugs:

```
Webinar 1: /w/mothers-class-november
Webinar 2: /w/fathers-workshop-december
Webinar 3: /w/youth-program-2025
```

Each has its own:
- Registration page
- Schedule settings
- Attendee list

---

## Support Checklist

Before asking for help:
- [ ] Webinar status is "SCHEDULED"
- [ ] Slug is set and valid
- [ ] At least one active schedule exists
- [ ] Server is running (port 3000 or 3001)
- [ ] Browser cache cleared
- [ ] Tested in incognito mode

---

## Quick Reference

### Key URLs:
- **Dashboard**: `http://localhost:3001/dashboard`
- **Create Webinar**: `http://localhost:3001/dashboard/webinars/new`
- **All Webinars**: `http://localhost:3001/dashboard/webinars`
- **Attendees**: `http://localhost:3001/dashboard/attendees`
- **Registration Page**: `http://localhost:3001/w/[slug]`

### Key Fields:
- **slug**: Public URL identifier (required, unique)
- **maxSchedulesToShow**: How many schedule slots to display (default: 3)
- **status**: Must be "SCHEDULED" for public access

---

**Last Updated**: October 31, 2025
**Server Port**: 3001 (if 3000 is busy)
