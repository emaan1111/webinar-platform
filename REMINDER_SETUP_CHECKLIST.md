# Reminder System - Complete Setup Checklist

Use this checklist to set up and test the complete reminder system.

## 📋 Prerequisites Checklist

- [ ] Next.js project running
- [ ] PostgreSQL database connected (Railway)
- [ ] Prisma configured
- [ ] Authentication working (NextAuth)
- [ ] Microsoft 365 account for emails
- [ ] Environment variables set up

---

## 🗄️ Database Setup

### Step 1: Run Prisma Migration
```bash
npx prisma migrate dev --name add_reminder_system
```

**Expected Output:**
```
✔ Created migration: 20241114_add_reminder_system
✔ Applied migration: 20241114_add_reminder_system
✔ Generated Prisma Client
```

- [ ] Migration completed successfully
- [ ] No errors in console
- [ ] Tables created: `webinar_reminder_templates`, `webinar_reminders_sent`

### Step 2: Verify Database Tables
```bash
npx prisma studio
```

**Check for:**
- [ ] `webinar_reminder_templates` table exists
- [ ] `webinar_reminders_sent` table exists
- [ ] Both tables have correct columns

---

## 🔐 Environment Variables

### Step 3: Add Required Variables

Add to `.env` file:

```env
# Microsoft Graph API (for sending emails)
MICROSOFT_CLIENT_ID=cdfb9105-b4db-419c-b19f-8d1fb267e872
MICROSOFT_TENANT_ID=common
MICROSOFT_CLIENT_SECRET=your_client_secret_here

# Email Configuration
EMAIL_ADDRESS=support@emaanpower.com

# Cron Secret (for securing cron endpoint)
CRON_SECRET=your_random_secret_here_use_openssl_rand_base64_32
```

**To generate CRON_SECRET:**
```bash
openssl rand -base64 32
```

- [ ] MICROSOFT_CLIENT_ID added
- [ ] MICROSOFT_TENANT_ID added
- [ ] MICROSOFT_CLIENT_SECRET added (get from Azure Portal)
- [ ] EMAIL_ADDRESS added
- [ ] CRON_SECRET generated and added

### Step 4: Get Microsoft Client Secret

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to: App Registrations
3. Find your app (Client ID: cdfb9105-b4db-419c-b19f-8d1fb267e872)
4. Go to: Certificates & secrets
5. Click: New client secret
6. Copy the **Value** (not the ID)
7. Add to `.env` as `MICROSOFT_CLIENT_SECRET`

- [ ] Accessed Azure Portal
- [ ] Found app registration
- [ ] Created new client secret
- [ ] Copied secret value
- [ ] Added to `.env` file

---

## 💻 Code Integration

### Step 5: Uncomment Reminder Scheduling

**File:** `src/app/api/webinars/[id]/register/route.ts`

Find this line (around line 215):
```typescript
// scheduleRemindersForRegistration(registration.id).catch(error => {
//   console.error('⚠️ Failed to schedule reminders (non-blocking):', error)
// })
```

Uncomment it:
```typescript
scheduleRemindersForRegistration(registration.id).catch(error => {
  console.error('⚠️ Failed to schedule reminders (non-blocking):', error)
})
```

Also add the import at the top:
```typescript
import { scheduleRemindersForRegistration } from '@/lib/reminders'
```

- [ ] Import added
- [ ] Function call uncommented
- [ ] File saved

---

## 🧪 Testing

### Step 6: Start Development Server
```bash
npm run dev
```

- [ ] Server starts without errors
- [ ] No TypeScript errors in console
- [ ] Can access http://localhost:3000

### Step 7: Test UI Access

1. Navigate to: Dashboard → Webinars
2. Click on any webinar
3. Click "Reminders" button

**Expected:**
- [ ] Reminders page loads
- [ ] Shows empty state with "No reminders yet"
- [ ] "Add Reminder" button visible
- [ ] No console errors

### Step 8: Create Test Reminder

1. Click "Add Reminder"
2. Click "24 Hours Before" template
3. Click "Create Reminder"

**Expected:**
- [ ] Form submits successfully
- [ ] Form closes
- [ ] Reminder appears in list
- [ ] Shows "24 hours before" badge
- [ ] Shows "Active" status
- [ ] Subject and preview display correctly

### Step 9: Test Placeholder System

1. Click "Add Reminder"
2. Click "Show Placeholders"
3. Click the 📤 insert button for `{{name}}`

**Expected:**
- [ ] Placeholder helper expands
- [ ] Shows all 7 placeholders
- [ ] Click inserts `{{name}}` into email body
- [ ] Cursor positioned after placeholder

### Step 10: Test Edit Functionality

1. Click ✏️ (edit) icon on a reminder
2. Change the subject
3. Click "Update Reminder"

**Expected:**
- [ ] Form opens with existing data pre-filled
- [ ] Changes save successfully
- [ ] Updated reminder shows new subject
- [ ] No duplicate reminders created

### Step 11: Test Toggle Active/Inactive

1. Click 👁️ (eye) icon on a reminder

**Expected:**
- [ ] Status changes from "Active" to "Inactive"
- [ ] Badge color changes to gray
- [ ] Card becomes slightly transparent
- [ ] Click again toggles back to "Active"

### Step 12: Test Delete

1. Click 🗑️ (trash) icon
2. Click "OK" in confirmation dialog

**Expected:**
- [ ] Confirmation dialog appears
- [ ] Reminder is deleted
- [ ] Reminder disappears from list
- [ ] No errors in console

---

## 📧 Email Testing

### Step 13: Test Email Service

Create a test file: `test-email.js`
```javascript
const { sendEmail } = require('./src/lib/email')

async function testEmail() {
  const result = await sendEmail(
    'your-email@example.com',
    'Test Email from Reminder System',
    '<h1>Hello!</h1><p>This is a test email.</p>'
  )
  console.log('Email sent:', result)
}

testEmail()
```

Run:
```bash
node test-email.js
```

**Expected:**
- [ ] No errors
- [ ] Returns `true`
- [ ] Email arrives in inbox (check spam folder)

### Step 14: Test Registration + Reminder Scheduling

**Create a test webinar:**
1. Go to Dashboard → Create Webinar
2. Set webinar to start in 25 hours from now
3. Add reminder templates: 24hr, 2hr, 15min

**Register for the webinar:**
1. Go to the registration page
2. Fill out form and submit
3. Check server logs

**Expected in logs:**
```
📅 Scheduling reminders for registration: reg_abc123...
✅ Scheduled reminder: 24 hours before (scheduled for: ...)
⏭️  Skipped reminder: 2 hours before (time has passed)
⏭️  Skipped reminder: 15 minutes before (time has passed)
```

- [ ] Registration successful
- [ ] Reminders scheduled log appears
- [ ] Only 24hr reminder scheduled (others skipped)
- [ ] No errors in console

### Step 15: Check Database for Scheduled Reminders

```bash
npx prisma studio
```

1. Open `webinar_reminders_sent` table
2. Find your registration's reminders

**Expected:**
- [ ] One row with status: "PENDING"
- [ ] `scheduledFor` is 24 hours before webinar
- [ ] `registrationId` matches your registration
- [ ] `templateId` matches the 24hr template

---

## ⏰ Cron Job Setup

### Step 16: Test Manual Cron Execution

First, test locally:
```bash
curl -X POST http://localhost:3000/api/cron/process-reminders \
  -H "Authorization: Bearer your_cron_secret_here"
```

**Expected Response:**
```json
{
  "success": true,
  "stats": {
    "processed": 0,
    "sent": 0,
    "failed": 0,
    "skipped": 0
  },
  "timestamp": "2025-11-14T..."
}
```

- [ ] Endpoint responds
- [ ] Returns success
- [ ] Shows stats (may be 0 if no pending reminders)

### Step 17: Create Test Reminder with Short Time

To test the full flow:

1. Create a webinar starting in 5 minutes
2. Add reminder template: 2 minutes before
3. Register for the webinar
4. Wait 3 minutes (reminder should be "due")
5. Call cron endpoint manually
6. Check email

**Expected:**
- [ ] Cron processes the reminder
- [ ] Status changes to "SENT"
- [ ] Email arrives in inbox
- [ ] Placeholders are replaced with real data
- [ ] Countdown link works
- [ ] Referral link works

### Step 18: Set Up Automated Cron Job

Choose one option:

#### Option A: Railway Cron Jobs
1. Go to Railway project dashboard
2. Create new cron job
3. Schedule: `*/5 * * * *` (every 5 minutes)
4. Command:
   ```bash
   curl -X POST https://your-domain.com/api/cron/process-reminders \
     -H "Authorization: Bearer ${CRON_SECRET}"
   ```

#### Option B: External Cron Service (cron-job.org)
1. Sign up at https://cron-job.org
2. Create new cron job
3. URL: `https://your-domain.com/api/cron/process-reminders`
4. Method: POST
5. Headers: `Authorization: Bearer your_cron_secret`
6. Schedule: Every 5 minutes

#### Option C: Vercel Cron (if using Vercel)
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/process-reminders",
    "schedule": "*/5 * * * *"
  }]
}
```

- [ ] Cron job created
- [ ] Schedule set to 5-10 minutes
- [ ] Authorization header added
- [ ] Tested and working

---

## ✅ Final Verification

### Step 19: End-to-End Test

Create a complete test scenario:

1. **Create webinar** starting 30 minutes from now
2. **Add reminders:** 24hr (skip), 2hr (skip), 15min (send)
3. **Register** for webinar
4. **Wait 16 minutes** (so 15min reminder is due)
5. **Trigger cron** (manual or wait for automatic)
6. **Check email**
7. **Click countdown link** in email
8. **Check analytics** (optional)

**Expected Results:**
- [ ] Only 15min reminder scheduled (others skipped)
- [ ] Cron processes reminder at right time
- [ ] Email received with personalized content
- [ ] All placeholders replaced correctly
- [ ] Countdown link works
- [ ] Referral link works
- [ ] Database shows status: "SENT"

### Step 20: Production Checklist

Before going live:

**Security:**
- [ ] CRON_SECRET is strong (32+ characters)
- [ ] Environment variables not committed to git
- [ ] API endpoints require authentication
- [ ] Email templates sanitized

**Performance:**
- [ ] Cron job runs every 5-10 minutes
- [ ] Processes max 50 reminders per run
- [ ] Database has indexes on key columns
- [ ] No memory leaks

**Monitoring:**
- [ ] Server logs configured
- [ ] Error tracking set up (Sentry, etc.)
- [ ] Email delivery monitoring
- [ ] Failed reminder alerts

**Documentation:**
- [ ] Team knows how to create reminders
- [ ] Email template guidelines shared
- [ ] Troubleshooting guide available

---

## 🐛 Troubleshooting

### Issue: TypeScript Errors in reminders.ts
**Solution:**
```bash
npx prisma generate
```

### Issue: "Table doesn't exist" error
**Solution:**
```bash
npx prisma migrate dev
```

### Issue: Emails not sending
**Check:**
- [ ] MICROSOFT_CLIENT_SECRET is correct
- [ ] EMAIL_ADDRESS matches Azure app
- [ ] Microsoft Graph API permissions granted
- [ ] Check server logs for errors

### Issue: Reminders not being scheduled on registration
**Check:**
- [ ] Import added to register route
- [ ] Function call uncommented
- [ ] Reminder templates exist and are active
- [ ] Server logs show "📅 Scheduling reminders..."

### Issue: Cron job not processing reminders
**Check:**
- [ ] CRON_SECRET matches in .env and cron config
- [ ] Cron job is running (check service logs)
- [ ] scheduledFor time has passed
- [ ] Reminder status is "PENDING"
- [ ] Check cron endpoint logs

### Issue: Placeholders not replaced in emails
**Check:**
- [ ] Using double curly braces: `{{name}}` not `{name}`
- [ ] Exact spelling matches
- [ ] No extra spaces
- [ ] Check `replacePlaceholders` function

---

## 📊 Success Metrics

After setup is complete, you should see:

- [ ] **UI**: All reminder CRUD operations working
- [ ] **Registration**: Reminders auto-scheduled for new sign-ups
- [ ] **Cron**: Processing reminders every 5-10 minutes
- [ ] **Email**: Reminders sent with personalized content
- [ ] **Database**: Correct status tracking (PENDING → SENT/FAILED)
- [ ] **Links**: Countdown and referral links working
- [ ] **Performance**: No errors in production logs

---

## 🎉 Completion

Congratulations! Your reminder system is fully set up and operational.

**What you've accomplished:**
✅ Database schema created
✅ Email service configured
✅ UI for managing templates
✅ Auto-scheduling on registration
✅ Cron job processing reminders
✅ Personalized email delivery
✅ Complete tracking system

**Next steps:**
- Create default reminder templates for your webinars
- Monitor reminder performance
- Gather feedback from attendees
- Optimize reminder timing based on data

---

## 📚 Reference Documentation

- **Complete Guide**: `REMINDER_SYSTEM_COMPLETE.md`
- **UI Guide**: `REMINDER_UI_QUICK_START.md`
- **Visual Guide**: `REMINDER_UI_VISUAL_GUIDE.md`
- **Summary**: `REMINDER_MANAGEMENT_UI_SUMMARY.md`
- **Migration Safety**: `MIGRATION_SAFETY_GUIDE.md`

---

**Setup Date:** _________________
**Completed By:** _________________
**Production URL:** _________________
**Notes:** 
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
