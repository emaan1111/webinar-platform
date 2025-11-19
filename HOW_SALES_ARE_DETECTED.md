# How the System Knows If There's a Sale for a Registration

## 🎯 Quick Answer

The system checks the **`sales` relation** on the Registration model. If a registration has any records in the `WebinarSale` table linked to it, it has a sale.

```typescript
// In the reports API:
if (reg.sales.length > 0) {
  // This registration has a sale!
  salesTotal += reg.sales.length; // Count how many sales
}
```

---

## 📊 Database Structure

### 1. Registration Table
```typescript
model Registration {
  id         String   @id @default(cuid())
  name       String
  email      String
  attended   Boolean  @default(false)
  
  // Relations
  sales      WebinarSale[]  // ← Links to sales
  sessions   AttendeeSession[]
  // ... other fields
}
```

### 2. WebinarSale Table
```typescript
model WebinarSale {
  id             String   @id @default(cuid())
  webinarId      String
  registrationId String?  // ← Links back to registration
  email          String
  
  // Order details
  orderId        String   @unique
  orderFormId    String?
  productName    String?
  status         String?
  amount         Float?
  currency       String?  @default("USD")
  purchasedAt    DateTime?
  
  // Relations
  registration   Registration? @relation(fields: [registrationId], references: [id])
  webinar        Webinar       @relation(fields: [webinarId], references: [id])
}
```

---

## 🔍 How Sales Are Detected

### Step 1: Fetch Registrations with Sales
In the reports API, registrations are fetched **with their related sales**:

```typescript
const registrations = await prisma.registration.findMany({
  where: {
    registeredAt: {
      gte: currentDate,
      lt: nextDate
    }
  },
  include: {
    sessions: true,  // For replay tracking
    sales: true      // ← Include all related sales!
  }
});
```

### Step 2: Check If Sales Exist
For each registration:

```typescript
for (const reg of registrations) {
  // Check if this registration has any sales
  if (reg.sales.length > 0) {
    // YES! They have a sale
    const saleCount = reg.sales.length;
    salesTotal += saleCount;
    
    // Determine if it's a Live or Replay sale
    if (reg.attended === true) {
      salesLive += saleCount;
    } else if (reg.sessions.length > 0) {
      salesReplay += saleCount;
    }
  }
}
```

---

## 💡 Real Example

### Scenario: John Registers and Buys

#### 1. John Registers
```sql
INSERT INTO registrations (
  id, name, email, attended, registeredAt
) VALUES (
  'reg_123', 'John Doe', 'john@example.com', false, '2025-11-19'
);
```

#### 2. John Attends Live
```sql
UPDATE registrations 
SET attended = true, joinedAt = '2025-11-19 14:00:00'
WHERE id = 'reg_123';
```

#### 3. John Makes a Purchase
When John clicks "Buy Now" and completes the order, a WebinarSale record is created:

```sql
INSERT INTO webinar_sales (
  id, webinarId, registrationId, email, orderId, amount, purchasedAt
) VALUES (
  'sale_456', 'webinar_789', 'reg_123', 'john@example.com', 'ORDER_001', 97.00, '2025-11-19 14:30:00'
);
```

#### 4. Reports Query Detects the Sale
```typescript
// When reports run, they fetch:
const registrations = await prisma.registration.findMany({
  include: { sales: true }
});

// For John's registration:
{
  id: 'reg_123',
  name: 'John Doe',
  email: 'john@example.com',
  attended: true,  // ← He attended live
  sales: [         // ← He has sales!
    {
      id: 'sale_456',
      orderId: 'ORDER_001',
      amount: 97.00,
      purchasedAt: '2025-11-19T14:30:00Z'
    }
  ]
}

// The check:
if (reg.sales.length > 0) {  // TRUE! length = 1
  salesTotal++;              // Increment total
  if (reg.attended) {        // TRUE!
    salesLive++;             // This is a LIVE sale
  }
}
```

---

## 🔗 How Sales Are Created

### Method 1: Webhook from Payment Processor
Most common method - when someone buys:

```typescript
// API endpoint: /api/webhooks/payment
export async function POST(request: NextRequest) {
  const data = await request.json();
  
  // Create sale record
  await prisma.webinarSale.create({
    data: {
      webinarId: data.webinarId,
      registrationId: data.registrationId, // Link to registration!
      email: data.email,
      orderId: data.orderId,
      amount: data.amount,
      status: 'completed',
      purchasedAt: new Date()
    }
  });
  
  // Also update registration
  await prisma.registration.update({
    where: { id: data.registrationId },
    data: { hasPurchased: true }  // Set flag
  });
}
```

### Method 2: Manual Entry
Admin can manually add a sale:

```typescript
await prisma.webinarSale.create({
  data: {
    webinarId: 'webinar_123',
    registrationId: 'reg_456',  // Link it!
    email: 'customer@example.com',
    orderId: 'MANUAL_001',
    amount: 97.00,
    status: 'completed'
  }
});
```

### Method 3: Import from External System
Bulk import sales from Stripe, PayPal, etc:

```typescript
const sales = [
  { email: 'john@example.com', orderId: 'stripe_123', amount: 97.00 },
  { email: 'jane@example.com', orderId: 'stripe_124', amount: 97.00 }
];

for (const sale of sales) {
  // Find matching registration by email
  const reg = await prisma.registration.findFirst({
    where: { email: sale.email, webinarId: webinarId }
  });
  
  if (reg) {
    // Create sale and link it
    await prisma.webinarSale.create({
      data: {
        webinarId: webinarId,
        registrationId: reg.id,  // Link!
        email: sale.email,
        orderId: sale.orderId,
        amount: sale.amount
      }
    });
  }
}
```

---

## 🎨 Visual Flow

```
┌─────────────────────────────────────────────────────────┐
│  1. User Registers for Webinar                         │
│     → Creates Registration record                       │
│     → registration.sales = []  (empty array)            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  2. User Attends Live/Replay                            │
│     → registration.attended = true (if live)            │
│     → registration.sessions = [...] (if replay)         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  3. User Makes Purchase                                 │
│     → Payment processor sends webhook                   │
│     → Creates WebinarSale record                        │
│     → webinarSale.registrationId = registration.id      │
│     → registration.sales = [webinarSale]  ✅            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  4. Reports Check for Sales                             │
│     → SELECT * FROM registrations                       │
│       INCLUDE sales                                     │
│     → if (reg.sales.length > 0) → HAS SALE! ✅          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 Checking for Sales: The Code

### In Reports API (`/api/reports/route.ts`)

```typescript
// Line 153-163: Fetch with sales included
const registrations = await prisma.registration.findMany({
  where: { registeredAt: { gte: currentDate, lt: nextDate } },
  include: {
    sessions: true,  // For replay tracking
    sales: true      // ← Include related sales
  }
});

// Line 224-236: Check for sales
for (const reg of registrations) {
  // Check if this registration has any sales
  if (reg.sales.length > 0) {
    // They have a sale!
    const saleCount = reg.sales.length;
    salesTotal += saleCount;
    
    // Determine type based on attendance
    if (reg.attended === true) {
      // They attended live → Live Sale
      salesLive += saleCount;
    } else if (reg.sessions.length > 0) {
      // They only watched replay → Replay Sale
      salesReplay += saleCount;
    }
  }
}
```

---

## 📝 Key Points

### 1. Relationship Is Key
- **One Registration** can have **Many Sales**
- `Registration.sales` is an array of `WebinarSale` records
- The link is made through `WebinarSale.registrationId`

### 2. Sales Detection
```typescript
// Simple check:
const hasSale = registration.sales.length > 0;

// Count sales:
const numberOfSales = registration.sales.length;

// Get sale details:
const totalAmount = registration.sales.reduce((sum, sale) => sum + sale.amount, 0);
```

### 3. Multiple Sales Possible
One registration can have multiple sales:
```typescript
{
  id: 'reg_123',
  name: 'John',
  sales: [
    { orderId: 'ORDER_001', amount: 97.00, productName: 'Basic' },
    { orderId: 'ORDER_002', amount: 197.00, productName: 'Premium' }
  ]
}
// Total: 2 sales, $294.00
```

### 4. Sale Attribution Logic
```typescript
if (sales.length > 0) {
  salesTotal += sales.length;
  
  if (attended === true) {
    // Attended live session
    salesLive += sales.length;
  } else if (sessions.length > 0) {
    // Only watched replay
    salesReplay += sales.length;
  }
  // If neither: counts in total but not live/replay
}
```

---

## 🧪 How to Test

### Check if a Registration Has Sales

```typescript
// In Prisma Studio or console:
const reg = await prisma.registration.findUnique({
  where: { id: 'reg_123' },
  include: { sales: true }
});

console.log('Has sale?', reg.sales.length > 0);
console.log('Number of sales:', reg.sales.length);
console.log('Sales:', reg.sales);
```

### Check All Sales for a Webinar

```typescript
const sales = await prisma.webinarSale.findMany({
  where: { webinarId: 'webinar_123' },
  include: { registration: true }
});

console.log('Total sales:', sales.length);
sales.forEach(sale => {
  console.log(`${sale.registration?.name}: $${sale.amount}`);
});
```

---

## 🎯 Summary

**Question**: How will you know if there is a sale for registration?

**Answer**: 
1. The `Registration` model has a `sales` relation
2. When fetching registrations, we include `{ sales: true }`
3. We check `if (registration.sales.length > 0)`
4. If true, the registration has sales!
5. We then count them and categorize as Live/Replay based on `registration.attended`

**The Magic Line**:
```typescript
const hasSale = registration.sales.length > 0;
```

That's it! Simple, reliable, and built into the database relationships. 🎉
