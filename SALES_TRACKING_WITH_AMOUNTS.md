# How Sales Are Tracked with Amounts - Complete Guide

## 🎯 Quick Answer

**Q: How does the system know when a sale is made?**
**A:** Sales are tracked via webhook integrations from payment processors (Stripe, PayPal, ClickFunnels, etc.) or manual entry. Each sale creates a `WebinarSale` record with full order details.

**Q: How do we know how much the sale was for?**
**A:** Every `WebinarSale` record stores the **amount** field with the exact sale price, along with currency, order ID, product name, and timestamp.

---

## 📊 Database Schema for Sales

### WebinarSale Model
```prisma
model WebinarSale {
  id             String    @id @default(cuid())
  webinarId      String
  registrationId String?   // Links to the registration
  
  // Order Information
  orderId        String    @unique  // Unique order ID from payment processor
  orderFormId    String?             // If using order forms
  productName    String?             // What they bought
  status         String?             // completed, refunded, pending, etc.
  
  // Payment Details
  amount         Float?              // 💰 THE SALE AMOUNT!
  currency       String?   @default("USD")
  purchasedAt    DateTime?          // When the sale happened
  
  // Customer Info
  email          String
  contactId      String?
  
  // Relations
  registration   Registration? @relation(fields: [registrationId], references: [id])
  webinar        Webinar       @relation(fields: [webinarId], references: [id])
  
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```

**Key Fields:**
- **`amount`**: The dollar amount of the sale (e.g., 97.00, 297.00, 1997.00)
- **`currency`**: USD, EUR, GBP, etc.
- **`orderId`**: Unique identifier from payment processor
- **`purchasedAt`**: Exact timestamp of purchase
- **`status`**: Track if completed, refunded, pending

---

## 🔔 How Sales Are Captured

### Method 1: Payment Processor Webhooks (Most Common)

When someone buys, the payment processor sends a webhook to your system:

```typescript
// API Route: /api/webhooks/stripe (example)
export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')
  const body = await request.text()
  
  // Verify webhook is from Stripe
  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    
    // Extract sale data
    const saleData = {
      orderId: session.id,                    // Stripe checkout session ID
      email: session.customer_email,
      amount: session.amount_total / 100,     // 💰 Amount in dollars
      currency: session.currency.toUpperCase(),
      productName: session.line_items?.[0]?.description,
      status: 'completed',
      purchasedAt: new Date(session.created * 1000)
    }
    
    // Find the registration by email
    const registration = await prisma.registration.findFirst({
      where: {
        email: saleData.email,
        webinarId: session.metadata.webinarId
      }
    })
    
    // Create the sale record
    await prisma.webinarSale.create({
      data: {
        webinarId: session.metadata.webinarId,
        registrationId: registration?.id,  // Link to registration
        orderId: saleData.orderId,
        email: saleData.email,
        amount: saleData.amount,           // 💰 Store the amount!
        currency: saleData.currency,
        productName: saleData.productName,
        status: saleData.status,
        purchasedAt: saleData.purchasedAt
      }
    })
    
    // Also update the registration's hasPurchased flag
    if (registration) {
      await prisma.registration.update({
        where: { id: registration.id },
        data: { hasPurchased: true }
      })
    }
  }
  
  return NextResponse.json({ received: true })
}
```

### Method 2: ClickFunnels Webhook

```typescript
// API Route: /api/webhooks/clickfunnels
export async function POST(request: NextRequest) {
  const data = await request.json()
  
  // ClickFunnels sends purchase data
  if (data.event_id === 'purchase') {
    await prisma.webinarSale.create({
      data: {
        webinarId: data.webinar_id,
        registrationId: data.registration_id,
        orderId: data.order_id,
        orderFormId: data.order_form_id,
        email: data.contact.email,
        amount: parseFloat(data.order_total),  // 💰 Amount from CF
        currency: 'USD',
        productName: data.product_name,
        status: 'completed',
        purchasedAt: new Date(data.purchased_at),
        contactId: data.contact.id
      }
    })
  }
  
  return NextResponse.json({ success: true })
}
```

### Method 3: PayPal Webhook

```typescript
// API Route: /api/webhooks/paypal
export async function POST(request: NextRequest) {
  const event = await request.json()
  
  if (event.event_type === 'PAYMENT.SALE.COMPLETED') {
    const sale = event.resource
    
    await prisma.webinarSale.create({
      data: {
        webinarId: sale.custom,  // Pass webinar ID in custom field
        email: sale.payer.email_address,
        orderId: sale.id,
        amount: parseFloat(sale.amount.total),  // 💰 PayPal amount
        currency: sale.amount.currency,
        status: 'completed',
        purchasedAt: new Date(sale.create_time)
      }
    })
  }
  
  return NextResponse.json({ success: true })
}
```

### Method 4: Manual Entry (Admin Dashboard)

```typescript
// Admin can manually add sales
const handleManualSale = async () => {
  await fetch('/api/sales', {
    method: 'POST',
    body: JSON.stringify({
      webinarId: 'webinar_123',
      email: 'customer@example.com',
      orderId: 'MANUAL_' + Date.now(),
      amount: 97.00,              // 💰 Manually entered amount
      currency: 'USD',
      productName: 'Coaching Program',
      status: 'completed',
      purchasedAt: new Date()
    })
  })
}
```

---

## 💰 Calculating Total Revenue

### In Reports API

```typescript
// src/app/api/reports/route.ts

const registrations = await prisma.registration.findMany({
  where: { registeredAt: { gte: startDate, lt: endDate } },
  include: {
    sales: true  // Include all sales for each registration
  }
})

let totalRevenue = 0
let liveSalesRevenue = 0
let replaySalesRevenue = 0

for (const reg of registrations) {
  if (reg.sales.length > 0) {
    // Calculate revenue for this registration
    const regRevenue = reg.sales.reduce((sum, sale) => {
      return sum + (sale.amount || 0)  // 💰 Sum all sale amounts
    }, 0)
    
    totalRevenue += regRevenue
    
    // Attribute to Live or Replay
    if (reg.attended) {
      liveSalesRevenue += regRevenue
    } else if (reg.sessions.length > 0) {
      replaySalesRevenue += regRevenue
    }
  }
}

return {
  revenue: totalRevenue,
  liveSalesRevenue,
  replaySalesRevenue,
  averageOrderValue: salesTotal > 0 ? totalRevenue / salesTotal : 0
}
```

---

## 📈 Revenue Metrics Available

### 1. Total Revenue
```typescript
revenue: registrations.reduce((sum, reg) => 
  sum + reg.sales.reduce((s, sale) => s + (sale.amount || 0), 0), 0
)
```

### 2. Average Order Value (AOV)
```typescript
averageOrderValue: totalSales > 0 ? totalRevenue / totalSales : 0
```

### 3. Revenue by Source
```typescript
{
  liveRevenue: 2940.00,    // Sales from live attendees
  replayRevenue: 1485.00,  // Sales from replay watchers
  totalRevenue: 4425.00
}
```

### 4. Revenue Per Registration
```typescript
revenuePerReg: totalRegistrations > 0 ? totalRevenue / totalRegistrations : 0
```

### 5. ROI (Return on Investment)
```typescript
roi: adSpend > 0 ? ((totalRevenue - adSpend) / adSpend) * 100 : 0
// Example: Spent $500, made $2000 = 300% ROI
```

### 6. Profit
```typescript
profit: totalRevenue - totalAdSpend
```

---

## 🔍 Example: Complete Sale Tracking Flow

### Step 1: User Registers
```sql
INSERT INTO registrations (id, email, webinarId, registeredAt)
VALUES ('reg_123', 'john@example.com', 'webinar_456', NOW());
```

### Step 2: User Attends Live
```sql
UPDATE registrations 
SET attended = true, joinedAt = NOW()
WHERE id = 'reg_123';
```

### Step 3: User Makes Purchase ($297)
Stripe webhook fires → Creates sale record:

```sql
INSERT INTO webinar_sales (
  id, webinarId, registrationId, email, 
  orderId, amount, currency, status, purchasedAt
) VALUES (
  'sale_789',
  'webinar_456',
  'reg_123',
  'john@example.com',
  'ch_3O4KAB2eZvKYlo2C0YaGHQWY',  -- Stripe charge ID
  297.00,                           -- 💰 SALE AMOUNT
  'USD',
  'completed',
  NOW()
);
```

### Step 4: Reports Calculate Revenue
```typescript
const john = await prisma.registration.findUnique({
  where: { id: 'reg_123' },
  include: { sales: true }
})

console.log('John purchased:', john.sales.length, 'items')
console.log('Total spent:', john.sales.reduce((sum, s) => sum + s.amount, 0))
// Output: Total spent: 297
```

---

## 💡 Real Data Examples

### Example 1: Single Product Sale
```json
{
  "id": "sale_001",
  "orderId": "stripe_ch_123abc",
  "email": "customer@example.com",
  "amount": 97.00,
  "currency": "USD",
  "productName": "Coaching Program",
  "status": "completed",
  "purchasedAt": "2025-11-19T14:30:00Z"
}
```
**Revenue from this sale:** $97.00

### Example 2: Multiple Sales from One Registration
```json
{
  "registration": {
    "id": "reg_456",
    "email": "vip@example.com",
    "sales": [
      {
        "orderId": "order_001",
        "amount": 97.00,
        "productName": "Basic Package"
      },
      {
        "orderId": "order_002",
        "amount": 297.00,
        "productName": "Premium Upgrade"
      }
    ]
  }
}
```
**Total revenue from this registration:** $394.00 ($97 + $297)

### Example 3: Day's Revenue Report
```json
{
  "date": "2025-11-19",
  "totalSales": 15,
  "revenue": 4455.00,
  "breakdown": {
    "liveSales": 10,
    "liveRevenue": 2970.00,
    "replaySales": 5,
    "replayRevenue": 1485.00
  },
  "products": {
    "Basic ($97)": { "count": 8, "revenue": 776.00 },
    "Premium ($297)": { "count": 5, "revenue": 1485.00 },
    "VIP ($997)": { "count": 2, "revenue": 1994.00 }
  }
}
```

---

## 🛠️ Testing Sales Tracking

### Test Script: Create Sample Sales
```typescript
// test-sales.ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function testSales() {
  // Find a registration
  const reg = await prisma.registration.findFirst()
  
  if (reg) {
    // Create a test sale
    const sale = await prisma.webinarSale.create({
      data: {
        webinarId: reg.webinarId,
        registrationId: reg.id,
        email: reg.email,
        orderId: `TEST_${Date.now()}`,
        amount: 97.00,  // 💰 Test amount
        currency: 'USD',
        productName: 'Test Product',
        status: 'completed',
        purchasedAt: new Date()
      }
    })
    
    console.log('✅ Created test sale:', sale)
    console.log('💰 Amount:', sale.amount)
  }
}

testSales()
```

### Query All Sales with Amounts
```sql
SELECT 
  ws.id,
  ws.orderId,
  ws.email,
  ws.amount,        -- 💰 Sale amount
  ws.currency,
  ws.productName,
  ws.status,
  ws.purchasedAt,
  r.name AS customer_name,
  r.attended AS attended_live
FROM webinar_sales ws
LEFT JOIN registrations r ON ws.registrationId = r.id
WHERE ws.webinarId = 'webinar_123'
ORDER BY ws.purchasedAt DESC;
```

---

## 📊 Adding Revenue Columns to Reports

The reports already calculate revenue. To display it:

### Current Revenue Metrics in API Response:
```typescript
{
  revenue: 4425.00,              // Total revenue
  profit: 3925.00,               // Revenue - ad spend
  roi: 785.00,                   // ROI percentage
  costPerSale: 33.33,            // Ad spend / total sales
  averageOrderValue: 295.00      // Total revenue / total sales
}
```

### To Display in Table:
Simply select these columns in your view:
- **Revenue** → Total money earned
- **Profit** → Revenue minus ad spend
- **ROI %** → Return on investment
- **Cost/Sale** → How much spent to get each sale
- **Avg Order Value** → Average sale amount

---

## 🔐 Security & Validation

### Webhook Signature Verification
```typescript
// Always verify webhooks are legitimate
const isValid = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
)

if (!isValid) {
  return new Response('Invalid signature', { status: 401 })
}
```

### Prevent Duplicate Sales
```typescript
// Use unique orderId to prevent duplicates
const existing = await prisma.webinarSale.findUnique({
  where: { orderId: orderData.orderId }
})

if (existing) {
  console.log('Sale already recorded')
  return
}
```

### Handle Refunds
```typescript
// Update sale status on refund
await prisma.webinarSale.update({
  where: { orderId: refundData.orderId },
  data: { 
    status: 'refunded',
    refundedAt: new Date()
  }
})
```

---

## 📝 Summary

### How System Knows About Sales:
1. **Webhooks** from payment processors (Stripe, PayPal, ClickFunnels)
2. **Manual entry** by admins
3. **API integrations** from other platforms

### How System Knows Sale Amount:
1. **`amount` field** in `WebinarSale` model stores exact dollar amount
2. **Currency field** tracks which currency
3. **All calculations** sum the `amount` field for revenue totals

### What Data Is Stored:
- ✅ Exact sale amount ($97.00, $297.00, etc.)
- ✅ Currency (USD, EUR, etc.)
- ✅ Order ID (unique identifier)
- ✅ Product name
- ✅ Purchase timestamp
- ✅ Customer email
- ✅ Link to registration
- ✅ Sale status (completed, refunded, etc.)

### Key Queries:
```typescript
// Get all sales for a registration
registration.sales.forEach(sale => {
  console.log(`${sale.productName}: $${sale.amount}`)
})

// Calculate total revenue
const totalRevenue = registration.sales.reduce(
  (sum, sale) => sum + (sale.amount || 0), 
  0
)
```

**The system knows EXACTLY how much each sale was for** because it's stored in the database when the webhook fires! 🎉
