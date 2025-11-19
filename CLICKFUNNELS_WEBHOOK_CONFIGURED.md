# ClickFunnels Webhook Configuration - VERIFIED ✅

## Your Webhook Setup

**Webhook URL**: `https://webinar-platform-production.up.railway.app/api/integrations/clickfunnels/webhook`

**Status**: ✅ Configured in ClickFunnels

## What This Means

Your ClickFunnels account is now sending order data to your webinar platform! 🎉

### When an Order is Created

1. **ClickFunnels sends webhook** → Your Railway app
2. **Webhook handler receives** order data (amount, email, product, etc.)
3. **Database stores** the sale with actual amount
4. **Registration linked** if email matches a webinar registrant
5. **Reports updated** with real revenue numbers

## How to Verify It's Working

### Method 1: Check Database After Order

After someone makes a purchase in ClickFunnels:

1. Run this command to check for recent sales:
```bash
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.webinarSale.findMany({take:5,orderBy:{purchasedAt:'desc'}}).then(s=>console.log('Recent Sales:',JSON.stringify(s,null,2))).finally(()=>p.\$disconnect())"
```

2. Or check in your **Sales page**: https://webinar-platform-production.up.railway.app/dashboard/sales

### Method 2: Check Railway Logs

View real-time webhook activity:

```bash
railway logs
```

Look for:
- `📧 ClickFunnels webhook received`
- `✅ Sale created for order: [ORDER_ID]`
- `💰 Order amount: $[AMOUNT]`

### Method 3: Test Order

1. Create a test order in ClickFunnels
2. Check Railway logs immediately
3. Check Sales page for the new order
4. Verify amount matches

## What Gets Captured

From each ClickFunnels order:

✅ **Order ID** - Unique identifier  
✅ **Amount** - Actual sale amount (not hardcoded!)  
✅ **Currency** - USD, EUR, etc.  
✅ **Customer Email** - For matching to registrations  
✅ **Product Name** - What was purchased  
✅ **Purchase Date** - When order was created  
✅ **Order Status** - completed, pending, etc.

## Where to See Sales Data

### 1. Sales Page
**URL**: https://webinar-platform-production.up.railway.app/dashboard/sales

**Shows**:
- All sales (even without registration)
- Total revenue
- Average order value
- Filter by linked/unlinked
- Export to CSV

### 2. Reports Page
**URL**: https://webinar-platform-production.up.railway.app/dashboard/reports

**Shows**:
- Daily revenue (actual amounts)
- Revenue breakdown (live vs replay)
- Profit and ROI calculations
- Sales performance metrics

### 3. Attendees Page
**URL**: https://webinar-platform-production.up.railway.app/dashboard/attendees

**Shows**:
- Registrants with "Purchased" status
- Only shows if email matches

## Expected Behavior

### Scenario 1: Customer Registers THEN Purchases
1. Customer fills out webinar registration form
2. Registration created in database
3. Customer goes through ClickFunnels sales funnel
4. Makes purchase with **same email**
5. Webhook receives order
6. Sale linked to registration
7. Shows on Sales page as "Linked"
8. Registration shows "Has Purchased"

### Scenario 2: Customer Purchases WITHOUT Registering
1. Customer goes directly to sales funnel
2. Makes purchase (never registered for webinar)
3. Webhook receives order
4. Sale created but **not linked** to registration
5. Shows on Sales page as "Not Linked"
6. Revenue still counted in Reports

### Scenario 3: Different Email Used
1. Customer registers with email A
2. Customer purchases with email B
3. Webhook receives order
4. Sale created but not linked (email mismatch)
5. Shows as "Not Linked" on Sales page

## Troubleshooting

### Issue: No Sales Showing Up

**Check**:
1. Is webhook URL correct in ClickFunnels? ✅ (Yours is correct)
2. Is Railway app running? (Check `railway status`)
3. Have any orders been placed since webhook configured?
4. Check Railway logs for errors

**Test**:
- Place a test order in ClickFunnels
- Watch Railway logs in real-time
- Check Sales page immediately after

### Issue: Sales Show $0.00 Amount

**Possible Causes**:
- ClickFunnels not sending amount field
- Amount field is null in payload
- Currency formatting issue

**Solution**:
- Check Railway logs for payload structure
- Verify ClickFunnels sends `total_amount`, `total`, or `amount`
- Contact ClickFunnels support if field missing

### Issue: Sale Not Linked to Registration

**This is normal if**:
- Different email used for purchase vs registration
- Customer purchased without registering
- Timing: Purchased before completing registration form

**Not a problem**:
- Sale still counted in revenue
- Shows on Sales page
- Can manually verify customer later

## Revenue Calculations

### Before Webhook
❌ Revenue = Sales Count × $100 (hardcoded)  
❌ Inaccurate profit and ROI

### After Webhook (Now!)
✅ Revenue = Sum of actual sale amounts from database  
✅ Accurate profit = Revenue - Ad Spend  
✅ Accurate ROI = (Profit / Spend) × 100

**Example**:
- 5 sales at $297 each = $1,485 total
- Reports show: $1,485.00 (not $500!)
- Profit calculation uses real revenue
- Business decisions based on actual data

## ClickFunnels Events Supported

Currently handling:
- ✅ `order.created` - New order placed

Future support (if needed):
- `order.updated` - Order status changed
- `order.refunded` - Order refunded
- `subscription.created` - Recurring payment started

## Next Steps

### 1. Verify First Sale
- Wait for next order
- Check Sales page
- Verify amount is correct

### 2. Monitor Performance
- Review Reports page daily
- Check revenue numbers make sense
- Compare to ClickFunnels dashboard

### 3. Export for Accounting
- Use "Export CSV" on Sales page
- Download all transaction data
- Import to bookkeeping software

## Quick Commands

### Check Recent Sales
```bash
cd /Volumes/WD/CODE/Webinar\ Play\ 2
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.webinarSale.findMany({take:10,orderBy:{purchasedAt:'desc'}}).then(s=>{console.log('📊 Recent Sales:',s.length);s.forEach((sale,i)=>console.log(\`\${i+1}. \${sale.orderId}: $\${sale.amount} - \${sale.email}\`))}).finally(()=>p.\$disconnect())"
```

### View Railway Logs
```bash
railway logs -f
```

### Check Webhook Endpoint
```bash
curl -I https://webinar-platform-production.up.railway.app/api/integrations/clickfunnels/webhook
```

## Summary

✅ **Webhook Configured**: Pointing to your Railway app  
✅ **Endpoint Ready**: `/api/integrations/clickfunnels/webhook` exists  
✅ **Captures Amounts**: Real sale amounts, not hardcoded  
✅ **Links Registrations**: When email matches  
✅ **Shows All Sales**: Even without registration  
✅ **Accurate Revenue**: Reports use actual amounts  

**Status**: Ready to receive orders! 🚀

---

**Your webhook is live and ready. The next ClickFunnels order will automatically flow into your system!**
