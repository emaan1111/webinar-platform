# Sales Tracking Deployment Summary

## Date: November 18, 2025

## ✅ Changes Deployed

### 1. Database Schema Update
- **Added field**: `hasPurchased` (Boolean, default: false) to `Registration` model
- **Purpose**: Quick flag to identify registrants who made purchases
- **Migration**: Applied via `prisma db push`

### 2. ClickFunnels Webhook Enhancement
**File**: `/src/app/api/integrations/clickfunnels/webhook/route.ts`

**Changes**:
- Added logic to set `hasPurchased = true` when `order.created` event received
- Removed ClickFunnels contact tagging (lines 367-383) as requested
- Webhook still creates `WebinarSale` records and links to registrations

**Flow**:
```
ClickFunnels Order → Webhook → Create WebinarSale → Set hasPurchased=true
```

### 3. Backfill Script
**File**: `/backfill-has-purchased.js`
- Created script to update existing registrations with sales
- Ran successfully (0 records needed updating)

## 🚀 Deployment

### Railway Configuration
- **Project**: brilliant-charm
- **Service**: webinar-platform
- **Environment**: production
- **URL**: `https://webinar-platform-production.up.railway.app`

### Deployment Commands Used
```bash
# Committed changes
git add -A
git commit -m "Add hasPurchased field to Registration model"

# Pushed to GitHub (triggers Railway auto-deploy)
git push origin main

# Manual Railway deployment
railway up --detach
```

## 🔗 Webhook URL

Your ClickFunnels webhook endpoint:
```
https://webinar-platform-production.up.railway.app/api/integrations/clickfunnels/webhook
```

### Webhook Configuration

**Events to Subscribe**:
- ✅ `contact.created` - New registrations
- ✅ `contact.updated` - Updated contact info
- ✅ `order.created` - **Sales tracking (NEW)**

**Custom Fields Required** (in ClickFunnels forms):
```
webinar_id OR webinar_slug (required)
schedule_id (optional)
marketing_consent (optional)
```

## 📊 How It Works

### When Someone Purchases:
1. ClickFunnels sends `order.created` webhook event
2. Your webhook receives the payload with:
   - Customer email
   - Order ID
   - Product details
   - Amount paid
3. System automatically:
   - Creates/updates `WebinarSale` record
   - Finds the registration by email
   - Sets `registration.hasPurchased = true`
   - Updates `OfferAnalytics.converted = true`

### Query Examples:

**Find all registrants who purchased**:
```typescript
const buyers = await prisma.registration.findMany({
  where: { hasPurchased: true },
  include: { sales: true }
});
```

**Check if specific registrant purchased**:
```typescript
const registration = await prisma.registration.findUnique({
  where: { id: registrationId }
});

if (registration.hasPurchased) {
  console.log('This person made a purchase!');
}
```

## 🧪 Testing

1. **Test webhook is live**:
   ```bash
   curl https://webinar-platform-production.up.railway.app/api/integrations/clickfunnels/webhook
   ```
   
   Should return:
   ```json
   {
     "message": "ClickFunnels 2.0 Webhook Endpoint",
     "status": "active",
     "supported_events": ["contact.created", "contact.updated", "order.created"]
   }
   ```

2. **Test registration flow**:
   - Submit a ClickFunnels form with `webinar_id` or `webinar_slug`
   - Check Railway logs for webhook received
   - Verify registration created in database

3. **Test purchase flow**:
   - Complete a purchase in ClickFunnels order form
   - Check Railway logs for `order.created` event
   - Verify `hasPurchased` set to true in database

## 📝 Environment Variables

All required variables are configured in Railway:
- ✅ `DATABASE_URL`
- ✅ `NEXTAUTH_URL`
- ✅ `CLICKFUNNELS_API_KEY`
- ✅ `CLICKFUNNELS_WORKSPACE_ID`
- ✅ `CLICKFUNNELS_TEAM_ID`
- ✅ All ClickFunnels tag IDs

## 🔍 Monitoring

**Railway Dashboard**:
- Build logs: Check for deployment errors
- Runtime logs: Monitor webhook events
- Metrics: CPU, memory, network usage

**Check Logs**:
```bash
railway logs
```

**Common Log Messages**:
```
✅ ClickFunnels Webhook Received: { type: 'order.created', email: '...' }
✅ Sale recorded successfully
✅ Updated registration hasPurchased flag
```

## ⚠️ Important Notes

1. **No ClickFunnels Tagging**: The webhook NO LONGER tags contacts in ClickFunnels as "UM-Webinar-Purchased". It only marks in your database.

2. **Email Matching**: Sales are matched to registrations by email address. Ensure the email in ClickFunnels orders matches the registration email.

3. **Webinar Association**: Orders need `webinar_id` or `webinar_slug` in custom fields, OR the system will find the most recent registration for that email.

4. **Database Relation**: You can still access all sales via `registration.sales` relation for detailed purchase history.

## 🐛 Troubleshooting

**If webhook not receiving events**:
1. Check ClickFunnels webhook is configured correctly
2. Verify Railway deployment is running
3. Check Railway logs for errors
4. Test webhook URL with curl

**If hasPurchased not updating**:
1. Check email matches between order and registration
2. Verify registration exists before purchase
3. Check Railway logs for database errors
4. Run backfill script if needed

**If deployment failed**:
1. Check Railway build logs in dashboard
2. Verify all environment variables are set
3. Check for database connection issues
4. Try manual redeploy: `railway up --detach`

## 📚 Related Files

- `/src/app/api/integrations/clickfunnels/webhook/route.ts` - Webhook handler
- `/prisma/schema.prisma` - Database schema with `hasPurchased` field
- `/backfill-has-purchased.js` - Script to update existing records
- `/railway.json` - Railway deployment configuration

## ✅ Deployment Status

- [x] Code committed to GitHub
- [x] Code pushed to main branch  
- [x] Database schema updated
- [x] Railway deployment triggered
- [ ] Build logs reviewed (check Railway dashboard)
- [ ] Webhook tested in ClickFunnels
- [ ] Purchase flow tested

---

**Deployed by**: GitHub Copilot
**Date**: November 18, 2025
**Git Commit**: ec92d83 - "Add hasPurchased field to Registration model"
