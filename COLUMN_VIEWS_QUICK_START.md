# Column Views & Sales Tracking - Quick Reference

## 🎯 New Features Added

### 1. **Column View Management** ✅
- Save custom column views
- Load predefined views (Essential, Sales Focus, Engagement, etc.)
- Set default view
- Persist views in localStorage

### 2. **Drag-and-Drop Column Reordering** ✅
- Reorder columns by dragging
- Date column stays first (locked)
- Visual feedback while dragging
- Order persists in saved views

### 3. **6 Pre-defined Views**
- **Essential**: Key metrics only (10 columns)
- **Sales Focus**: Revenue & sales metrics
- **Engagement Analysis**: Detailed engagement
- **Live vs Replay**: Compare live/replay performance
- **Facebook Ads**: Ad campaign metrics
- **Full Analytics**: All available columns (50+)

---

## 💰 How Sales Are Tracked

### Quick Answer
**Q: How does the system know when a sale is made?**
- Payment processor webhooks (Stripe, PayPal, ClickFunnels)
- Manual entry by admins
- API integrations

**Q: How much was the sale for?**
- Every sale has an `amount` field in database
- Stored in `WebinarSale` model
- Example: `amount: 97.00`, `currency: "USD"`

### What's Stored Per Sale
```json
{
  "orderId": "stripe_ch_ABC123",
  "email": "customer@example.com",
  "amount": 297.00,              // 💰 SALE AMOUNT
  "currency": "USD",
  "productName": "Coaching Program",
  "status": "completed",
  "purchasedAt": "2025-11-19T14:30:00Z",
  "registrationId": "reg_456"    // Links to registration
}
```

### Revenue Calculations
```typescript
// Total revenue for a day
const totalRevenue = registrations.reduce((sum, reg) => 
  sum + reg.sales.reduce((s, sale) => s + (sale.amount || 0), 0), 
  0
)

// Average order value
const aov = totalSales > 0 ? totalRevenue / totalSales : 0

// ROI
const roi = adSpend > 0 ? ((revenue - adSpend) / adSpend) * 100 : 0
```

---

## 🎨 How to Use Column Views

### Step 1: Open View Manager
Click **"Manage Views"** button in reports page

### Step 2: Choose a View
- Click any predefined view (Essential, Sales Focus, etc.)
- Or create custom view by selecting columns
- View applies immediately

### Step 3: Reorder Columns
- Drag selected columns to reorder
- Date column always stays first
- New order applies to table instantly

### Step 4: Save Custom View
1. Select your desired columns
2. Reorder them as needed
3. Enter a name (e.g., "My Sales View")
4. Click "Save View"
5. View saved to localStorage

### Step 5: Set Default View
- Hover over any view card
- Click ⭐ star icon
- This view loads automatically on page load

### Step 6: Update Existing View
1. Load the view you want to update
2. Make changes to columns/order
3. Click "Update [ViewName]" button
4. Changes saved

### Step 7: Delete Custom View
- Hover over custom view card
- Click 🗑️ trash icon
- Confirm deletion

---

## 📊 Available Revenue Columns

Add these to your custom view to track sales:

### Sales Count
- **Sales (Total)** - All sales
- **Sales (Live)** - From live attendees
- **Sales (Replay)** - From replay watchers

### Revenue Amount
- **Revenue** - Total $ earned
- **Profit** - Revenue minus ad spend
- **ROI %** - Return on investment

### Cost Metrics
- **Cost/Sale** - Ad spend per sale
- **Cost/Reg** - Ad spend per registration
- **Cost/Attendee** - Ad spend per attendee

### Performance
- **Avg Order Value** - Revenue / sales
- **Revenue/Reg** - Revenue per registration
- **Conversion Value** - How much each visitor is worth

---

## 🔧 Technical Details

### Database Schema
```prisma
model WebinarSale {
  id             String    @id
  orderId        String    @unique
  registrationId String?
  amount         Float?     // 💰 Sale amount
  currency       String?
  email          String
  status         String?
  purchasedAt    DateTime?
  
  registration   Registration?
}
```

### Webhook Integration
```typescript
// When Stripe payment completes
POST /api/webhooks/stripe
{
  "amount_total": 29700,  // Cents
  "customer_email": "user@example.com",
  "metadata": { "webinarId": "webinar_123" }
}

// System creates:
WebinarSale {
  amount: 297.00,  // Converted to dollars
  email: "user@example.com",
  registrationId: "reg_456"
}
```

### Revenue Query
```typescript
const registrations = await prisma.registration.findMany({
  include: { 
    sales: true  // ← Includes all sale records with amounts
  }
})

// Calculate revenue
const revenue = registrations
  .flatMap(r => r.sales)
  .reduce((sum, sale) => sum + (sale.amount || 0), 0)
```

---

## 🎯 Common Use Cases

### Use Case 1: Track Daily Sales
**View**: Sales Focus
**Columns**: Date, Registrations, Sales Total, Revenue, ROI %
**Goal**: See which days are most profitable

### Use Case 2: Compare Live vs Replay
**View**: Live vs Replay
**Columns**: Date, Sales Live, Sales Replay, Live Revenue, Replay Revenue
**Goal**: Understand where sales come from

### Use Case 3: Facebook Ad Performance
**View**: Facebook Ads
**Columns**: FB Spend, Clicks, Registrations, Sales, ROI %, Cost/Sale
**Goal**: Optimize ad campaigns

### Use Case 4: Engagement to Sales
**View**: Engagement Analysis
**Columns**: Engaged Total, Sales Total, Engagement Rate, Conversion Rate
**Goal**: See if engagement leads to sales

---

## 📚 Documentation Files

1. **`HOW_SALES_ARE_DETECTED.md`** - How system detects sales
2. **`SALES_TRACKING_WITH_AMOUNTS.md`** - Complete guide with amounts
3. **`COLUMNS_BREAKDOWN_AND_SALES.md`** - All available metrics
4. **This file** - Quick reference

---

## ✅ Feature Checklist

- ✅ 6 predefined views (Essential, Sales Focus, etc.)
- ✅ Custom view creation
- ✅ Save/Load views (localStorage)
- ✅ Set default view
- ✅ Update existing views
- ✅ Delete custom views
- ✅ Drag-and-drop column reordering
- ✅ Column selection (50+ columns available)
- ✅ Select all / Deselect all
- ✅ Dynamic table rendering
- ✅ Visual column position (#1, #2, #3...)
- ✅ Color coding (Live=green, Replay=purple, Total=blue)
- ✅ Sales tracking with amounts
- ✅ Revenue calculations
- ✅ Webhook integrations
- ✅ Refund handling
- ✅ Multi-currency support

---

## 🚀 What's Next?

### Potential Enhancements:
1. **Export views** - Share views with team members
2. **Column grouping** - Group related columns visually
3. **Conditional formatting** - Highlight cells based on thresholds
4. **Column sorting** - Click headers to sort
5. **Column filtering** - Filter by value ranges
6. **Column search** - Quick find specific columns
7. **View templates** - Industry-specific view templates
8. **Mobile responsiveness** - Horizontal scroll on mobile
9. **Print-friendly view** - Optimized for printing
10. **CSV export** - Respect selected columns in export

---

## 💡 Pro Tips

1. **Start with Essential view** - Then customize
2. **Use Sales Focus** - For revenue tracking
3. **Drag columns** - Put most important first
4. **Save multiple views** - For different analyses
5. **Set a default** - Loads automatically
6. **Update regularly** - As your needs change
7. **Color coding** - Green=Live, Purple=Replay, Blue=Total
8. **Date is locked** - Always first column for reference

---

## 🎉 Success!

You now have:
- ✅ Full control over which columns display
- ✅ Ability to reorder columns by dragging
- ✅ Save unlimited custom views
- ✅ Complete sales tracking with amounts
- ✅ Revenue calculations in reports
- ✅ All data persists across sessions

**Start by clicking "Manage Views" and explore!** 🚀
