# Offer Management "Failed to Fetch Data" - Troubleshooting Guide

## Issue
The Offer Management page (`/dashboard/offers`) is showing "Failed to fetch data" error.

## What I've Done

### 1. Improved Error Handling ✅
Updated `/src/app/dashboard/offers/page.tsx` to show:
- Detailed error messages
- Which API endpoint failed (webinars or offers)
- HTTP status codes
- Troubleshooting tips
- "Try Again" button

### 2. Added Console Logging ✅
The page now logs:
```javascript
console.log('Webinars response status:', webinarsRes.status)
console.log('Offers response status:', offersRes.status)
console.log('Webinars data:', webinarsData)
console.log('Offers data:', offersData)
```

## How to Diagnose the Issue

### Step 1: Check Browser Console
1. Open the page: `/dashboard/offers`
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Look for the error messages (red text)
5. Check what the status codes are

### Step 2: Check Network Tab
1. In Developer Tools, go to **Network** tab
2. Refresh the page
3. Look for these requests:
   - `/api/webinars` - Should return 200
   - `/api/offers` - Should return 200
4. Click on the failed request
5. Check the **Response** tab to see the error

### Step 3: Check Authentication
The error might be due to not being logged in:
- Make sure you're logged in to the dashboard
- Check if `/api/webinars` returns 401 (Unauthorized)
- Try logging out and logging back in

## Common Causes & Solutions

### 1. Not Logged In (Most Common)
**Symptoms:**
- API returns 401 Unauthorized
- Network tab shows red 401 errors

**Solution:**
```bash
# Go to login page and log in
/auth/signin
```

### 2. Database Not Connected
**Symptoms:**
- API returns 500 Internal Server Error
- Console shows Prisma errors

**Solution:**
```bash
cd /Volumes/WD/CODE/Webinar\ Play\ 2
npx prisma generate
npm run dev
```

### 3. Prisma Client Out of Date
**Symptoms:**
- API returns 500 error
- Server console shows "PrismaClient" errors

**Solution:**
```bash
cd /Volumes/WD/CODE/Webinar\ Play\ 2
npx prisma generate
npx prisma db push
```

### 4. Server Not Running
**Symptoms:**
- Network tab shows "Failed to fetch"
- No response at all

**Solution:**
```bash
cd /Volumes/WD/CODE/Webinar\ Play\ 2
npm run dev
```

### 5. Wrong DATABASE_URL
**Symptoms:**
- Server logs show "Can't reach database"
- 500 errors on all API calls

**Solution:**
Check your `.env` file:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/webinar_db"
```

## Updated Error Display

The page now shows a helpful error message with:
- ✅ Exact error message
- ✅ Troubleshooting tips
- ✅ "Try Again" button
- ✅ Browser console hint

## API Endpoints Being Called

### GET /api/webinars
- **Purpose**: Fetch list of webinars for dropdown
- **Auth**: Required (checks session)
- **Returns**: `{ webinars: [...] }`

### GET /api/offers
- **Purpose**: Fetch all offers for user's webinars
- **Auth**: Required (checks session)
- **Returns**: `{ offers: [...] }`

## Next Steps for You

1. **Open the page** (`/dashboard/offers`)
2. **Open browser console** (F12)
3. **Look for error messages** in red
4. **Check Network tab** for failed requests
5. **Share the error** you see in the console with me

## What to Look For

In the console, you should see one of these:

### If Authentication Issue:
```
Webinars response status: 401
Offers response status: 401
Failed to fetch webinars: Unauthorized
```

### If Database Issue:
```
Webinars response status: 500
Offers response status: 500
Failed to fetch offers: Internal Server Error
```

### If Server Not Running:
```
Failed to fetch
TypeError: Failed to fetch
```

## Quick Fixes to Try

### Fix 1: Restart Server
```bash
# Kill server
lsof -ti:3000 | xargs kill -9

# Restart
cd /Volumes/WD/CODE/Webinar\ Play\ 2
npm run dev
```

### Fix 2: Regenerate Prisma
```bash
cd /Volumes/WD/CODE/Webinar\ Play\ 2
npx prisma generate
npx prisma db push
npm run dev
```

### Fix 3: Re-login
1. Go to `/auth/signout`
2. Go to `/auth/signin`
3. Log in again
4. Try `/dashboard/offers` again

## Files Modified

- ✅ `/src/app/dashboard/offers/page.tsx` - Better error handling
- ✅ Added detailed console logging
- ✅ Added helpful error message UI
- ✅ Added "Try Again" button

## Status

**The code is updated** with better error messages. Now when you refresh the page, you should see:
- Exact error message (not just "Failed to fetch data")
- Which API call failed
- HTTP status code
- Troubleshooting tips

**Please check your browser console and let me know what error you see!**
