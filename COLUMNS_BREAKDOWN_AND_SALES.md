# Reports Columns - Complete Breakdown & Sales Calculation

## 📊 Your Requested Columns - All Available!

### ✅ Currently Implemented & Working

All the metrics you requested are **already calculated by the API**. Here's what's available:

---

## 1. **Engaged Metrics** ✅

| Column | API Field | Description |
|--------|-----------|-------------|
| **Engaged (Total)** | `engagedTotal` | Everyone who watched ≥30 minutes (live OR replay) |
| **Engaged (Live)** | `engagedLive` | People who watched ≥30 min during LIVE session |
| **Engaged (Replay)** | `engagedReplay` | People who watched ≥30 min of REPLAY only |

**How it's calculated:**
```typescript
// For each registration:
const watchTimeMinutes = totalWatchTimeSeconds / 60;
const isEngaged = watchTimeMinutes >= 30; // 30 min threshold (configurable)

if (isEngaged) {
  engagedTotal++;
  
  if (reg.attended === true) {
    // They watched live
    engagedLive++;
  } else if (reg.sessions.length > 0) {
    // They only watched replay
    engagedReplay++;
  }
}
```

---

## 2. **Sales Metrics** ✅

| Column | API Field | Description |
|--------|-----------|-------------|
| **Sales (Total)** | `salesTotal` | All sales (live + replay) |
| **Sales (Live)** | `salesLive` | Sales from people who attended LIVE |
| **Sales (Replay)** | `salesReplay` | Sales from people who ONLY watched replay |

**How Sales Are Calculated:**
```typescript
// For each registration:
const hasSale = reg.sales && reg.sales.length > 0; // Check if purchase exists

if (hasSale) {
  salesTotal++;
  
  if (reg.attended === true) {
    // They attended live session = Live Sale
    salesLive++;
  } else if (reg.sessions.length > 0) {
    // They only watched replay = Replay Sale
    salesReplay++;
  }
}
```

**Important Notes:**
- Sales are tracked in the `sales` table (linked to `registration`)
- A sale is attributed to **Live** if `reg.attended = true` (they showed up live)
- A sale is attributed to **Replay** if `reg.attended = false` BUT `reg.sessions.length > 0` (they watched replay)
- If someone watched BOTH live and replay, the sale goes to **Live** (because they attended live)

---

## 3. **% Attendance** ✅

| Column | API Field | Description |
|--------|-----------|-------------|
| **% Attend (Total)** | `attendanceRate` | Total attendees / Total registrations × 100 |
| **% Attend (Live)** | `attendanceRateLive` | Live attendees / Total registrations × 100 |
| **% Attend (Replay)** | `attendanceRateReplay` | Replay attendees / Total registrations × 100 |

**Formula:**
```typescript
attendanceRate = (totalAttendees / registrations) × 100
attendanceRateLive = (liveAttendees / registrations) × 100
attendanceRateReplay = (replayAttendees / registrations) × 100
```

---

## 4. **% Engaged/Visitors** ✅

| Column | API Field | Description |
|--------|-----------|-------------|
| **% Eng/Vis (Total)** | `engagedPerVisitor` | Engaged / Visitors × 100 |
| **% Eng/Vis (Live)** | `engagedPerVisitorLive` | Engaged Live / Visitors × 100 |
| **% Eng/Vis (Replay)** | `engagedPerVisitorReplay` | Engaged Replay / Visitors × 100 |

**Formula:**
```typescript
engagedPerVisitor = (engagedTotal / visitors) × 100
engagedPerVisitorLive = (engagedLive / visitors) × 100
engagedPerVisitorReplay = (engagedReplay / visitors) × 100
```

---

## 5. **% Engaged/Registered** ✅

| Column | API Field | Description |
|--------|-----------|-------------|
| **% Eng/Reg (Total)** | `engagedPerRegistered` | Engaged / Registrations × 100 |
| **% Eng/Reg (Live)** | `engagedPerRegisteredLive` | Engaged Live / Registrations × 100 |
| **% Eng/Reg (Replay)** | `engagedPerRegisteredReplay` | Engaged Replay / Registrations × 100 |

**Formula:**
```typescript
engagedPerRegistered = (engagedTotal / registrations) × 100
engagedPerRegisteredLive = (engagedLive / registrations) × 100
engagedPerRegisteredReplay = (engagedReplay / registrations) × 100
```

---

## 6. **% Engaged/Attendees** ✅

| Column | API Field | Description |
|--------|-----------|-------------|
| **% Eng/Attendee (Total)** | `engagementRate` | Engaged / Total Attendees × 100 |
| **% Eng/Attendee (Live)** | `engagementRateLive` | Engaged Live / Live Attendees × 100 |
| **% Eng/Attendee (Replay)** | `engagementRateReplay` | Engaged Replay / Replay Attendees × 100 |

**Formula:**
```typescript
engagementRate = (engagedTotal / totalAttendees) × 100
engagementRateLive = (engagedLive / liveAttendees) × 100
engagementRateReplay = (engagedReplay / replayAttendees) × 100
```

---

## 7. **Cost per Registration** ✅

| Column | API Field | Description |
|--------|-----------|-------------|
| **Cost/Reg (Total)** | `costPerRegistration` | Ad Spend / Total Registrations |
| **Cost/Reg (Live)** | `costPerLiveAttendee` | Ad Spend / Live Attendees |
| **Cost/Reg (Replay)** | `costPerReplayAttendee` | Ad Spend / Replay Attendees |

**Formula:**
```typescript
costPerRegistration = spend / registrations
costPerLiveAttendee = spend / liveAttendees
costPerReplayAttendee = spend / replayAttendees
```

---

## 📋 Complete Column List - What's Currently Displayed

### Currently Showing in Table:
1. Date
2. Ad Spend
3. FB Clicks
4. Visitors
5. Registrations
6. Total Attendees (blue)
7. Live Attendees (green)
8. Replay Attendees (purple)
9. **Engaged Total** ✅
10. **Sales Total** ✅
11. % Registrations
12. % Attendance
13. % Engaged/Visitor
14. % Engaged/Registered
15. % Engagement Live
16. Cost/Reg

### Available But Not Displayed Yet:
17. **Engaged Live** (calculated, not showing)
18. **Engaged Replay** (calculated, not showing)
19. **Sales Live** (calculated, not showing)
20. **Sales Replay** (calculated, not showing)
21. **% Attend Live** (calculated, not showing)
22. **% Attend Replay** (calculated, not showing)
23. **% Eng/Vis Live** (calculated, not showing)
24. **% Eng/Vis Replay** (calculated, not showing)
25. **% Eng/Reg Live** (calculated, not showing)
26. **% Eng/Reg Replay** (calculated, not showing)
27. **% Eng/Attendee Total** (calculated, not showing)
28. **% Eng/Attendee Replay** (calculated, not showing)
29. **Cost/Reg Live** (calculated, not showing)
30. **Cost/Reg Replay** (calculated, not showing)

---

## 🎯 How to Add the Missing Columns

All data is already being calculated! You just need to add columns to the table.

### Example: Add Engaged Live & Replay Columns

**File**: `/src/app/dashboard/reports/page.tsx`

**Find line ~545** (in the table headers):
```tsx
<th>Engaged Total</th>
```

**Add after it:**
```tsx
<th className="px-6 py-3 text-left text-xs font-medium text-green-500 uppercase">
  Engaged Live
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-purple-500 uppercase">
  Engaged Replay
</th>
```

**Then find line ~605** (in the table cells):
```tsx
<td>{report.engagedTotal.toLocaleString()}</td>
```

**Add after it:**
```tsx
<td className="px-6 py-4 text-sm text-green-600">
  {report.engagedLive.toLocaleString()}
</td>
<td className="px-6 py-4 text-sm text-purple-600">
  {report.engagedReplay.toLocaleString()}
</td>
```

**And in totals row (line ~660):**
```tsx
<td>{totals.engagedTotal.toLocaleString()}</td>
```

**Add after it:**
```tsx
<td className="text-green-600">{totals.engagedLive.toLocaleString()}</td>
<td className="text-purple-600">{totals.engagedReplay.toLocaleString()}</td>
```

---

## 💰 Sales Calculation - Detailed Explanation

### Data Source
Sales are tracked in the `sales` table:
```sql
model Sale {
  id             String       @id @default(cuid())
  registrationId String
  registration   Registration @relation(fields: [registrationId], references: [id])
  amount         Float?
  productName    String?
  createdAt      DateTime     @default(now())
}
```

### How We Determine Live vs Replay Sales

```typescript
// Step 1: Check if registration has any sales
const hasSale = registration.sales.length > 0;

if (!hasSale) {
  // No sale, skip
  return;
}

// Step 2: Check how they watched
if (registration.attended === true) {
  // They attended LIVE session
  // Attribution: LIVE SALE
  salesLive++;
  salesTotal++;
  
} else if (registration.sessions.length > 0) {
  // They did NOT attend live (attended = false)
  // BUT they watched replay (sessions exist)
  // Attribution: REPLAY SALE
  salesReplay++;
  salesTotal++;
  
} else {
  // They registered but never watched anything
  // Still counts as total if they bought
  salesTotal++;
}
```

### Real Example

**Scenario 1: Live Attendee Who Bought**
```typescript
Registration {
  attended: true,           // ← Attended live
  sessions: [Session1],     // Maybe watched replay too
  sales: [Sale1]            // Made a purchase
}
// Result: salesLive++, salesTotal++
```

**Scenario 2: Replay-Only Viewer Who Bought**
```typescript
Registration {
  attended: false,          // ← Did NOT attend live
  sessions: [Session1],     // Watched replay
  sales: [Sale1]            // Made a purchase
}
// Result: salesReplay++, salesTotal++
```

**Scenario 3: No-Show Who Bought**
```typescript
Registration {
  attended: false,          // ← Did NOT attend live
  sessions: [],             // Never watched replay
  sales: [Sale1]            // Made a purchase (maybe from email)
}
// Result: salesTotal++ (not counted in live or replay)
```

---

## 🎨 Color Coding Guide

Use these colors in your table for clarity:

| Metric Type | Color | CSS Class |
|-------------|-------|-----------|
| **Total** | Blue | `text-blue-600` |
| **Live** | Green | `text-green-600` |
| **Replay** | Purple | `text-purple-600` |

---

## 📊 Example Data

Here's what a typical report row looks like:

```typescript
{
  date: "2025-11-19",
  visitors: 500,
  registrations: 300,
  
  // Attendance
  totalAttendees: 150,
  liveAttendees: 100,
  replayAttendees: 50,
  
  // Engagement (≥30 min)
  engagedTotal: 90,
  engagedLive: 60,
  engagedReplay: 30,
  
  // Sales
  salesTotal: 45,
  salesLive: 30,
  salesReplay: 15,
  
  // Percentages
  attendanceRate: 50.0,           // 150/300 × 100
  attendanceRateLive: 33.3,       // 100/300 × 100
  attendanceRateReplay: 16.7,     // 50/300 × 100
  
  engagedPerVisitor: 18.0,        // 90/500 × 100
  engagedPerRegistered: 30.0,     // 90/300 × 100
  
  engagementRate: 60.0,           // 90/150 × 100
  engagementRateLive: 60.0,       // 60/100 × 100
  engagementRateReplay: 60.0,     // 30/50 × 100
  
  costPerRegistration: 3.33,      // $1000/300
  costPerLiveAttendee: 10.00,     // $1000/100
  costPerReplayAttendee: 20.00    // $1000/50
}
```

---

## ✅ Summary

### All Your Requested Columns Are Available!

✅ **Engaged (Total, Live, Replay)** - Fully calculated  
✅ **Sales (Total, Live, Replay)** - Fully calculated  
✅ **% Attend (Total, Live, Replay)** - Fully calculated  
✅ **% Eng/Vis (Total, Live, Replay)** - Fully calculated  
✅ **% Eng/Reg (Total, Live, Replay)** - Fully calculated  
✅ **% Eng/Attendee (Total, Live, Replay)** - Fully calculated  
✅ **Cost/Reg (Total, Live, Replay)** - Fully calculated

### What You Need to Do

Just add the columns to the table display. The data is already there in the API response!

### Sales Calculation in Simple Terms

1. **Live Sale**: Person attended live session + made a purchase
2. **Replay Sale**: Person did NOT attend live + watched replay + made a purchase
3. **Total Sales**: All sales (live + replay + any other purchases)

The key field is `registration.attended`:
- `true` = They showed up live → Live sale
- `false` + has sessions → Only watched replay → Replay sale

---

Want me to add all these columns to your table right now? 🚀
