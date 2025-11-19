# ClickFunnels Webhook Verification Guide ✅

## Current Status

### ✅ Webhook Implementation EXISTS
- **Endpoint**: `/api/integrations/clickfunnels/webhook`
- **Method**: POST
- **Handler**: `src/app/api/integrations/clickfunnels/webhook/route.ts`
- **Status**: ✅ Fully implemented and ready

### ❌ No Sales Data Yet
- **Database Check**: 0 sales in `WebinarSale` table
- **This means**: Webhook hasn't received any real orders yet

## Why No Sales?

There are 3 possible reasons:

1. **No Real Orders Yet** - No one has actually purchased through ClickFunnels
2. **Webhook Not Configured in ClickFunnels** - The webhook URL hasn't been added to your ClickFunnels account
3. **Webhook URL Incorrect** - The webhook might be pointing to wrong URL or old deployment

## How to Verify Webhook is Working

### Method 1: Check ClickFunnels Dashboard

1. Log into your ClickFunnels account
2. Go to **Settings** → **Integrations** → **Webhooks**
3. Check if webhook is configured:
   - **Event**: `order.created`
   - **URL**: `https://your-production-domain.com/api/integrations/clickfunnels/webhook`
   - **Status**: Should be "Active"

### Method 2: Test with Production URL

Once your app is deployed to Railway, test the webhook:

```bash
curl -X POST https://your-domain.railway.app/api/integrations/clickfunnels/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "order.created",
    "order": {
      "id": "TEST_001",
      "total_amount": 297.00,
      "amount": 297.00,
      "currency": "USD",
      "products": [{
        "name": "Test Product"
      }],
      "customer": {
        "email": "test@example.com",
        "first_name": "Test",
        "last_name": "User"
      }
    }
  }'
```

Expected response: `{"success": true, "message": "..."}` or similar

### Method 3: Check Railway Logs

If webhook is configured, check Railway deployment logs:

```bash
railway logs
```

Look for:
- `📧 ClickFunnels webhook received`
- `✅ Sale created for order: TEST_001`
- Any error messages

### Method 4: Verify Database After Real Purchase

After a real purchase happens:

```sql
SELECT 
  orderId,
  amount,
  currency,
  email,
  productName,
  purchasedAt,
  status
FROM "WebinarSale"
ORDER BY purchasedAt DESC
LIMIT 5;
```

Should show the new sale with correct amount.

## What the Webhook Does

When it receives an `order.created` event:

1. ✅ **Extracts Order Data**:
   - Order ID (unique identifier)
   - Amount (from `total_amount`, `total`, or `amount` field)
   - Currency
   - Customer email
   - Product name
   - Purchase timestamp

2. ✅ **Finds or Creates Webinar**:
   - Looks for active webinar
   - Creates default webinar if none exists

3. ✅ **Finds Registration** (optional):
   - Matches customer email to existing registration
   - Links sale to registration if found

4. ✅ **Creates Sale Record**:
   - Stores in `WebinarSale` table
   - Records actual amount (not hardcoded)
   - Sets `hasPurchased = true` on registration

5. ✅ **Updates Reports**:
   - Reports API queries actual amounts
   - Revenue = sum of all `sale.amount`
   - Profit = revenue - ad spend
   - ROI = (profit / spend) × 100

## How to Configure ClickFunnels Webhook

### Step 1: Get Your Webhook URL

**Production URL** (recommended):
```
https://your-domain.railway.app/api/integrations/clickfunnels/webhook
```

**Local Testing** (for development only):
```
http://localhost:3003/api/integrations/clickfunnels/webhook
```

*Note: ClickFunnels can't reach localhost. Use production URL or ngrok.*

### Step 2: Add to ClickFunnels

1. Log into ClickFunnels
2. Go to **Settings** → **Integrations**
3. Click **Webhooks** or **Add Webhook**
4. Configure:
   - **Name**: "Webinar Platform Order Webhook"
   - **URL**: Your production webhook URL
   - **Event**: Select `order.created`
   - **Method**: POST
   - **Active**: Yes

### Step 3: Test the Webhook

ClickFunnels usually has a "Test Webhook" button:
1. Click "Test Webhook"
2. It sends a sample payload
3. Check your Railway logs
4. Check database for test sale

### Step 4: Verify with Real Order

1. Create a test order in ClickFunnels
2. Complete the purchase
3. Check database immediately:
   ```sql
   SELECT * FROM "WebinarSale" ORDER BY purchasedAt DESC LIMIT 1;
   ```
4. Check reports page - revenue should update

## Troubleshooting

### Issue: Webhook Returns 404

**Problem**: Endpoint not found

**Solutions**:
- Verify URL is exactly: `/api/integrations/clickfunnels/webhook`
- Check app is deployed and running
- Test URL in browser (should return 405 Method Not Allowed for GET)

### Issue: Webhook Returns 500

**Problem**: Server error processing webhook

**Solutions**:
- Check Railway logs for error details
- Verify database connection working
- Check Prisma schema includes WebinarSale model
- Verify environment variables set (DATABASE_URL)

### Issue: Webhook Succeeds But No Sale in Database

**Problem**: Webhook processes but doesn't create record

**Solutions**:
- Check payload format matches expected structure
- Verify `order.id` is unique (duplicates are rejected)
- Check logs for "Sale already exists" message
- Verify amount field is present in payload

### Issue: Sale Created But Amount is NULL

**Problem**: Amount not being extracted from payload

**Solutions**:
- Check payload has `total_amount`, `total`, or `amount` field
- Verify amount is numeric, not string
- Check currency formatting (should be 297.00, not "$297.00")
- Review `parseCurrencyAmount` function logs

## Expected Payload Format

ClickFunnels should send something like this:

```json
{
  "event_type": "order.created",
  "order": {
    "id": "ord_abc123",
    "created_at": "2025-11-19T12:00:00Z",
    "status": "completed",
    "total_amount": 297.00,  // ← This is captured
    "currency": "USD",
    "products": [{
      "name": "Webinar Masterclass",
      "price": 297.00
    }],
    "customer": {
      "email": "customer@example.com",
      "first_name": "John",
      "last_name": "Doe"
    }
  }
}
```

## Testing Locally with ngrok

If you need to test locally before deployment:

1. Install ngrok: `brew install ngrok`
2. Start your dev server: `npm run dev`
3. Create tunnel: `ngrok http 3003`
4. Use ngrok URL in ClickFunnels: `https://abc123.ngrok.io/api/integrations/clickfunnels/webhook`
5. Send test webhook from ClickFunnels
6. Check terminal for webhook logs

## Verification Checklist

- [ ] Webhook endpoint exists in code ✅ (Already verified)
- [ ] App deployed to production
- [ ] Webhook URL configured in ClickFunnels
- [ ] Test webhook sent successfully
- [ ] Database shows test sale record
- [ ] Real order placed
- [ ] Real sale appears in database with correct amount
- [ ] Reports page shows updated revenue
- [ ] Revenue calculations use actual amounts (not $100 hardcoded) ✅ (Already fixed)

## Next Steps

1. **Deploy to Production**:
   ```bash
   git add -A
   git commit -m "fix: Revenue calculation uses actual sale amounts"
   git push origin main
   railway up
   ```

2. **Configure ClickFunnels**:
   - Add webhook URL to ClickFunnels settings
   - Test with their webhook tester

3. **Verify Everything Works**:
   - Place test order
   - Check database for sale record
   - View reports page
   - Verify revenue is accurate

## Summary

✅ **Webhook Implementation**: Complete and ready
❌ **Current Sales**: 0 (webhook not receiving data yet)
📋 **Action Required**: Configure webhook URL in ClickFunnels account
🎯 **Expected Result**: Sales automatically tracked with actual amounts

Once configured, every ClickFunnels order will:
1. Send webhook to your app
2. Create WebinarSale record with real amount
3. Update reports with accurate revenue
4. Calculate profit and ROI correctly

---

**Your webhook is ready and waiting for ClickFunnels to send it data! 🚀**
