# Attendee Profile Troubleshooting Guide

## Issue: "Failed to load attendee profile"

This error can occur for several reasons. Follow these steps to diagnose and fix the issue.

---

## Step 1: Check Browser Console

1. Open the attendee profile page (e.g., `/dashboard/attendees/[some-id]`)
2. Open browser DevTools (F12)
3. Go to the **Console** tab
4. Look for log messages starting with `[Attendee Profile Page]` or `[Attendee Profile API]`

### What to look for:

```
[Attendee Profile Page] Fetching profile for ID: cm...
[Attendee Profile Page] Response status: 200
[Attendee Profile Page] Profile loaded successfully
```

If you see errors, note them down.

---

## Step 2: Check Server Logs

1. Open your terminal where `npm run dev` is running
2. Look for log messages when you load the attendee profile page

### Expected logs (successful):
```
[Attendee Profile API] Fetching profile for ID: cm...
[Attendee Profile API] Session user: user@example.com
[Attendee Profile API] Registration found: Yes
[Attendee Profile API] User role: ADMIN
[Attendee Profile API] Profile data prepared successfully
```

### Common error scenarios:

#### Error 1: Unauthorized (401)
```
[Attendee Profile API] Unauthorized - no session
```
**Solution:** Make sure you're logged in. Go to `/login` and sign in again.

---

#### Error 2: Forbidden (403)
```
[Attendee Profile API] Forbidden - user is not admin
[Attendee Profile API] User role: USER
```
**Solution:** Your account doesn't have admin permissions. Only admins can view attendee profiles.

**To fix:**
1. Go to your database (Railway Dashboard → PostgreSQL)
2. Run this query:
```sql
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'your-email@example.com';
```

---

#### Error 3: Attendee Not Found (404)
```
[Attendee Profile API] Registration not found for ID: cm...
```
**Solution:** The registration ID doesn't exist in the database.

**To check:**
1. Go to `/dashboard/attendees` 
2. Find the correct attendee
3. Click on their name to view their profile
4. Make sure the URL has a valid ID

---

#### Error 4: Database Connection Error
```
[Attendee Profile API] Error: Can't reach database server
```
**Solution:** Database connection issue.

**To fix:**
1. Check your `.env` file has `DATABASE_URL`
2. Make sure Railway PostgreSQL is running
3. Test connection:
```bash
npx prisma db push
```

---

#### Error 5: Missing Relations Error
```
[Attendee Profile API] Error: Unknown arg `sessions` in select.sessions
```
**Solution:** Database schema is out of sync.

**To fix:**
```bash
npx prisma generate
npx prisma db push
```

---

## Step 3: Verify Database Schema

The attendee profile requires these database tables:
- ✅ `Registration`
- ✅ `Session` (watch sessions)
- ✅ `ChatMessage`
- ✅ `Reaction`
- ✅ `Sale` (purchases)
- ✅ `PageVisit`
- ✅ `Reminder` (SMS/Email reminders)
- ✅ `ClickFunnelsReminderTag`

**Check if tables exist:**
```bash
npx prisma studio
```

This opens a GUI where you can browse your database tables.

---

## Step 4: Test API Directly

Test the API endpoint directly using curl or Postman:

```bash
# Get your session cookie from browser (F12 → Application → Cookies)
# Then test the API:

curl http://localhost:3000/api/attendees/YOUR_ATTENDEE_ID/profile \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Expected response (200):**
```json
{
  "profile": {
    "id": "cm...",
    "name": "John Doe",
    "email": "john@example.com",
    ...
  }
}
```

**Error response (401):**
```json
{
  "error": "Unauthorized"
}
```

**Error response (404):**
```json
{
  "error": "Attendee not found"
}
```

**Error response (500):**
```json
{
  "error": "Failed to fetch attendee profile",
  "details": "Detailed error message here"
}
```

---

## Step 5: Common Fixes

### Fix 1: Clear Next.js Cache
```bash
rm -rf .next
npm run dev
```

### Fix 2: Regenerate Prisma Client
```bash
npx prisma generate
```

### Fix 3: Reset Database (⚠️ Destroys all data)
```bash
npx prisma migrate reset
npx prisma db push
```

### Fix 4: Check Environment Variables
Make sure `.env` has:
```
DATABASE_URL="your-railway-postgres-url"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

### Fix 5: Restart Everything
```bash
# Kill all Node processes
pkill -f "next dev"

# Clear cache
rm -rf .next

# Restart
npm run dev
```

---

## Step 6: Enable More Logging

If you still can't find the issue, enable verbose logging:

**In `/src/app/api/attendees/[id]/profile/route.ts`**, add more logs:

```typescript
console.log('[DEBUG] Full request URL:', request.url)
console.log('[DEBUG] Registration data:', JSON.stringify(registration, null, 2))
console.log('[DEBUG] Sessions count:', registration.sessions.length)
```

---

## Step 7: Check for Specific Issues

### Issue: "Cannot read properties of undefined"

This usually means a database relation is missing.

**Check Prisma schema:**
```bash
cat prisma/schema.prisma | grep -A 20 "model Registration"
```

Make sure `Registration` model has these relations:
```prisma
model Registration {
  // ... other fields
  sessions           Session[]
  chatMessages       ChatMessage[]
  reactions          Reaction[]
  sales              Sale[]
  pageVisits         PageVisit[]
  reminders          Reminder[]
  clickFunnelsReminderTags ClickFunnelsReminderTag[]
}
```

---

## Step 8: Test with a Simple Registration

Create a test registration and check if it loads:

1. Go to your webinar registration page
2. Register for a webinar
3. Go to `/dashboard/attendees`
4. Find your test registration
5. Click to view profile

If the test registration works but others don't, the issue is with specific data in those registrations.

---

## Quick Diagnostics Checklist

- [ ] User is logged in
- [ ] User has ADMIN role
- [ ] Registration ID exists in database
- [ ] Database connection works
- [ ] Prisma client is generated (`npx prisma generate`)
- [ ] All required database tables exist
- [ ] `.env` file has correct DATABASE_URL
- [ ] Dev server is running without errors
- [ ] Browser console shows no network errors
- [ ] Server logs show no errors

---

## Still Not Working?

If none of the above steps work:

1. **Check the full error in console:**
   - Browser: F12 → Console
   - Server: Terminal where `npm run dev` is running

2. **Share the error:**
   - Copy the error message from `[Attendee Profile API]` logs
   - Copy the error message from `[Attendee Profile Page]` logs
   - Share in your team chat or create a GitHub issue

3. **Temporary workaround:**
   - Use the main `/dashboard/attendees` page
   - This shows a list of all attendees with basic info
   - Export data if needed

---

## Success!

When working correctly, you should see:
- ✅ Profile loads within 1-2 seconds
- ✅ All sections display (Contact Info, Metrics, Timeline, Sessions, etc.)
- ✅ No console errors
- ✅ Watch sessions show detailed data
- ✅ Purchases, reminders, and tags display if available

---

## Prevention

To avoid this issue in the future:

1. **Always run database migrations:**
   ```bash
   npx prisma migrate dev
   ```

2. **Keep Prisma client updated:**
   ```bash
   npx prisma generate
   ```

3. **Test after schema changes:**
   ```bash
   npm run build
   ```

4. **Monitor logs:**
   ```bash
   tail -f .next/server-logs.txt
   ```

---

## Related Documentation

- [Attendee Analytics Guide](./ATTENDEE_ANALYTICS_COMPLETE.md)
- [Attendee Tracking System](./ATTENDEE_TRACKING_SYSTEM.md)
- [API Documentation](./API_DOCUMENTATION.md)

---

**Last Updated:** November 21, 2025
