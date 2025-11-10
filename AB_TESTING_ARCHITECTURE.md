# 🧪 Multi-Element A/B Testing Architecture

## Problem Statement

You want to A/B test multiple elements:
- ✅ **Registration Page** (different templates)
- ✅ **Schedule** (which times to show)
- ✅ **Offer CTA** (which offer to present)
- ✅ **Video** (which video to play)

**Constraint:** All ads use the **same URL** (e.g., `/w/masterclass`)

---

## 🎯 Proposed Solution: Visitor-Based Consistent Assignment

### Core Principle
**One visitor = One test group (A or B)**

Once assigned to group A or B, the visitor sees **consistent variants** across all tested elements throughout their journey.

---

## 🏗️ Architecture Overview

```
Visitor clicks ad → /w/masterclass
                         │
                         ▼
                  Check cookie?
                         │
        ┌────────────────┴────────────────┐
        │                                  │
        ▼                                  ▼
    No cookie                          Has cookie
    (New visitor)                      (Returning)
        │                                  │
        ▼                                  │
  Generate UUID                            │
  Hash → Assign A or B                     │
  Set cookie: test_group=A                 │
        │                                  │
        └────────────────┬─────────────────┘
                         │
                         ▼
              Load webinar config
                         │
                         ▼
         ┌───────────────┴───────────────┐
         │   For each element:           │
         │   - Registration page         │
         │   - Schedule                  │
         │   - Offer                     │
         │   - Video                     │
         │                               │
         │   If testing enabled:         │
         │   → Show variant A or B       │
         │   Else:                       │
         │   → Show default              │
         └───────────────────────────────┘
```

---

## 📊 Database Schema

### 1. Update Webinar Model

```prisma
model Webinar {
  id              String   @id @default(cuid())
  slug            String?  @unique
  title           String
  description     String   @db.Text
  
  // Default values (used when NOT testing)
  registrationTemplateId String?  // Default template
  vimeoVideoId          String?   // Default video
  
  // A/B Testing Configuration
  enableABTesting       Boolean   @default(false)  // Master toggle
  trafficSplitPercent   Int       @default(50)     // % to variant A
  
  // Registration Page Testing
  testRegistrationPage  Boolean   @default(false)
  regTemplateAId        String?   // Variant A template
  regTemplateBId        String?   // Variant B template
  
  // Schedule Testing
  testSchedule          Boolean   @default(false)
  scheduleAIds          String?   // Comma-separated schedule IDs for A
  scheduleBIds          String?   // Comma-separated schedule IDs for B
  
  // Offer Testing
  testOffer             Boolean   @default(false)
  offerAId              String?   // Variant A offer
  offerBId              String?   // Variant B offer
  
  // Video Testing
  testVideo             Boolean   @default(false)
  videoAId              String?   // Variant A video (Vimeo ID or URL)
  videoBId              String?   // Variant B video (Vimeo ID or URL)
  
  // Relations
  schedules      WebinarSchedule[]
  offers         Offer[]
  registrations  Registration[]
  testMetrics    ABTestMetric[]
}
```

### 2. Create ABTestMetric Model

```prisma
model ABTestMetric {
  id            String   @id @default(cuid())
  webinarId     String
  visitorId     String   // UUID from cookie
  testGroup     String   // "A" or "B"
  
  // What was tested
  element       String   // "registration" | "schedule" | "offer" | "video"
  variantShown  String   // Which variant they saw
  
  // Tracking
  pageView      DateTime @default(now())
  converted     Boolean  @default(false)
  registrationId String? // Link to Registration if converted
  
  // Analytics
  timeOnPage    Int?     // Seconds
  clicks        Int      @default(0)
  country       String?
  referrer      String?
  device        String?  // "mobile" | "desktop" | "tablet"
  
  createdAt     DateTime @default(now())
  
  webinar       Webinar?       @relation(fields: [webinarId], references: [id], onDelete: SetNull)
  registration  Registration?  @relation(fields: [registrationId], references: [id], onDelete: SetNull)
  
  @@index([webinarId, element, testGroup])
  @@index([visitorId])
  @@map("ab_test_metrics")
}
```

### 3. Update Registration Model

```prisma
model Registration {
  id            String   @id @default(cuid())
  // ... existing fields ...
  testGroup     String?  // "A" or "B" - captured at registration
  testMetrics   ABTestMetric[]
}
```

---

## 🎨 Admin UI: Webinar A/B Testing Section

```jsx
┌─────────────────────────────────────────────────────────────┐
│ A/B Testing Configuration                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ [✓] Enable A/B Testing                                      │
│                                                              │
│ Traffic Split:                                              │
│ ├─ 50% to Variant A ────────────●────────── 50% to Variant B│
│                                                              │
│ ┌─ Registration Page Testing ─────────────────────────────┐ │
│ │ [✓] Test registration page templates                    │ │
│ │                                                          │ │
│ │ Variant A: [▼ Islamic Mothers Template    ]            │ │
│ │ Variant B: [▼ Default Template            ]            │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ Schedule Testing ────────────────────────────────────────┐│
│ │ [✓] Test different schedules                            │ │
│ │                                                          │ │
│ │ Variant A (Show these schedules):                       │ │
│ │ [✓] Jan 15, 2025 at 2:00 PM EST                        │ │
│ │ [✓] Jan 16, 2025 at 7:00 PM EST                        │ │
│ │                                                          │ │
│ │ Variant B (Show these schedules):                       │ │
│ │ [✓] Jan 15, 2025 at 10:00 AM EST                       │ │
│ │ [✓] Jan 17, 2025 at 3:00 PM EST                        │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ Offer Testing ────────────────────────────────────────────┐│
│ │ [ ] Test different offers                               │ │
│ │                                                          │ │
│ │ Variant A: [▼ Select Offer ]  (disabled)               │ │
│ │ Variant B: [▼ Select Offer ]  (disabled)               │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ Video Testing ────────────────────────────────────────────┐│
│ │ [ ] Test different videos                               │ │
│ │                                                          │ │
│ │ Variant A: [____________]  Vimeo ID (disabled)          │ │
│ │ Variant B: [____________]  Vimeo ID (disabled)          │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ [View Test Results →]                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementation: Visitor Assignment Logic

### Cookie Management

```typescript
// /src/lib/abTesting.ts

import { cookies } from 'next/headers';
import crypto from 'crypto';

export interface VisitorTestGroup {
  visitorId: string;
  testGroup: 'A' | 'B';
}

/**
 * Get or create visitor test group
 */
export function getVisitorTestGroup(trafficSplit: number = 50): VisitorTestGroup {
  const cookieStore = cookies();
  const existingVisitorId = cookieStore.get('visitor_id')?.value;
  const existingTestGroup = cookieStore.get('test_group')?.value;
  
  // Returning visitor with existing assignment
  if (existingVisitorId && existingTestGroup) {
    return {
      visitorId: existingVisitorId,
      testGroup: existingTestGroup as 'A' | 'B'
    };
  }
  
  // New visitor - assign to group
  const visitorId = existingVisitorId || crypto.randomUUID();
  const testGroup = assignTestGroup(visitorId, trafficSplit);
  
  // Set cookies (30 days)
  const cookieOptions = {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
    httpOnly: false, // Need to read client-side for tracking
    sameSite: 'lax' as const
  };
  
  cookieStore.set('visitor_id', visitorId, cookieOptions);
  cookieStore.set('test_group', testGroup, cookieOptions);
  
  return { visitorId, testGroup };
}

/**
 * Consistent hash-based assignment
 * Same visitor ID always gets same group
 */
function assignTestGroup(visitorId: string, trafficSplit: number): 'A' | 'B' {
  // Hash the visitor ID to get consistent assignment
  const hash = crypto.createHash('md5').update(visitorId).digest('hex');
  const hashValue = parseInt(hash.substring(0, 8), 16);
  const percentage = (hashValue % 100) + 1; // 1-100
  
  return percentage <= trafficSplit ? 'A' : 'B';
}

/**
 * Get test configuration for webinar
 */
export async function getTestConfiguration(webinar: any, testGroup: 'A' | 'B') {
  const config = {
    registrationTemplate: webinar.registrationTemplateId, // default
    schedules: webinar.schedules, // default: all schedules
    offer: null, // default: first offer or null
    video: webinar.vimeoVideoId // default
  };
  
  if (!webinar.enableABTesting) {
    return config;
  }
  
  // Apply A/B test variants
  if (webinar.testRegistrationPage) {
    config.registrationTemplate = testGroup === 'A' 
      ? webinar.regTemplateAId 
      : webinar.regTemplateBId;
  }
  
  if (webinar.testSchedule) {
    const scheduleIds = testGroup === 'A'
      ? webinar.scheduleAIds?.split(',') || []
      : webinar.scheduleBIds?.split(',') || [];
    
    config.schedules = webinar.schedules.filter(s => 
      scheduleIds.includes(s.id)
    );
  }
  
  if (webinar.testOffer) {
    config.offer = testGroup === 'A'
      ? webinar.offerAId
      : webinar.offerBId;
  }
  
  if (webinar.testVideo) {
    config.video = testGroup === 'A'
      ? webinar.videoAId
      : webinar.videoBId;
  }
  
  return config;
}
```

---

## 📍 Registration Page Implementation

### Updated `/w/[slug]/page.tsx`

```typescript
import { getVisitorTestGroup, getTestConfiguration } from '@/lib/abTesting';
import { trackPageView } from '@/lib/abTracking';

export default async function RegistrationPage({ params }) {
  const { slug } = params;
  
  // 1. Load webinar
  const webinar = await prisma.webinar.findUnique({
    where: { slug },
    include: {
      schedules: true,
      offers: true
    }
  });
  
  // 2. Get visitor test group
  const { visitorId, testGroup } = getVisitorTestGroup(
    webinar.trafficSplitPercent
  );
  
  // 3. Get configuration based on test group
  const config = await getTestConfiguration(webinar, testGroup);
  
  // 4. Track page view
  if (webinar.enableABTesting) {
    await trackPageView({
      webinarId: webinar.id,
      visitorId,
      testGroup,
      elements: {
        registration: webinar.testRegistrationPage ? config.registrationTemplate : null,
        schedule: webinar.testSchedule ? config.schedules.map(s => s.id) : null,
        offer: webinar.testOffer ? config.offer : null,
        video: webinar.testVideo ? config.video : null
      }
    });
  }
  
  // 5. Load template HTML
  const template = await prisma.template.findUnique({
    where: { id: config.registrationTemplate }
  });
  
  // 6. Render with configuration
  return (
    <RegistrationPageRenderer
      webinar={webinar}
      template={template}
      schedules={config.schedules}
      offer={config.offer}
      video={config.video}
      visitorId={visitorId}
      testGroup={testGroup}
    />
  );
}
```

---

## 📊 Tracking & Analytics

### Track Page View

```typescript
// /src/lib/abTracking.ts

export async function trackPageView(data: {
  webinarId: string;
  visitorId: string;
  testGroup: 'A' | 'B';
  elements: {
    registration?: string | null;
    schedule?: string[] | null;
    offer?: string | null;
    video?: string | null;
  };
}) {
  const metrics = [];
  
  // Track each tested element
  if (data.elements.registration) {
    metrics.push({
      webinarId: data.webinarId,
      visitorId: data.visitorId,
      testGroup: data.testGroup,
      element: 'registration',
      variantShown: data.elements.registration
    });
  }
  
  if (data.elements.schedule) {
    metrics.push({
      webinarId: data.webinarId,
      visitorId: data.visitorId,
      testGroup: data.testGroup,
      element: 'schedule',
      variantShown: data.elements.schedule.join(',')
    });
  }
  
  if (data.elements.offer) {
    metrics.push({
      webinarId: data.webinarId,
      visitorId: data.visitorId,
      testGroup: data.testGroup,
      element: 'offer',
      variantShown: data.elements.offer
    });
  }
  
  if (data.elements.video) {
    metrics.push({
      webinarId: data.webinarId,
      visitorId: data.visitorId,
      testGroup: data.testGroup,
      element: 'video',
      variantShown: data.elements.video
    });
  }
  
  // Bulk insert
  await prisma.aBTestMetric.createMany({
    data: metrics
  });
}
```

### Track Conversion

```typescript
export async function trackConversion(
  visitorId: string,
  webinarId: string,
  registrationId: string
) {
  await prisma.aBTestMetric.updateMany({
    where: {
      visitorId,
      webinarId,
      converted: false
    },
    data: {
      converted: true,
      registrationId
    }
  });
}
```

---

## 📈 Results Dashboard

### API Endpoint: `/api/ab-test/results/[webinarId]`

```typescript
export async function GET(req, { params }) {
  const { webinarId } = params;
  
  // Get metrics grouped by element and test group
  const results = await prisma.aBTestMetric.groupBy({
    by: ['element', 'testGroup'],
    where: { webinarId },
    _count: {
      id: true
    },
    _sum: {
      converted: true
    }
  });
  
  // Calculate conversion rates
  const formatted = results.map(r => ({
    element: r.element,
    testGroup: r.testGroup,
    views: r._count.id,
    conversions: r._sum.converted || 0,
    conversionRate: ((r._sum.converted || 0) / r._count.id) * 100
  }));
  
  return NextResponse.json(formatted);
}
```

### Dashboard UI

```jsx
┌─────────────────────────────────────────────────────────────┐
│ A/B Test Results: Masterclass                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Registration Page Testing                                    │
│ ┌──────────────────────────────────────────────────────────┐│
│ │              Views    Registrations    Conv. Rate        ││
│ │ Variant A     1,234        156          12.6%    🏆      ││
│ │ Variant B     1,189        134          11.3%            ││
│ │                                                          ││
│ │ Winner: Islamic Mothers Template (+1.3% lift)           ││
│ │ [Make Winner Permanent]                                 ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ Schedule Testing                                             │
│ ┌──────────────────────────────────────────────────────────┐│
│ │              Views    Registrations    Conv. Rate        ││
│ │ Variant A       987        143          14.5%    🏆      ││
│ │ Variant B     1,012        128          12.6%            ││
│ │                                                          ││
│ │ Winner: Evening Schedules (+1.9% lift)                  ││
│ │ [Make Winner Permanent]                                 ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ Statistical Significance: 95% ✅                            │
│ Sample Size: 2,423 visitors                                 │
│ Test Duration: 7 days                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Complete User Flow Example

### Scenario: Testing Registration Page & Schedule

**Admin Setup:**
1. Creates webinar: "Masterclass"
2. Enables A/B testing
3. Checks "Test registration page"
   - Variant A: Islamic Mothers Template
   - Variant B: Default Template
4. Checks "Test schedule"
   - Variant A: Evening times (7 PM, 8 PM)
   - Variant B: Afternoon times (2 PM, 3 PM)
5. Sets traffic split: 50/50
6. Saves webinar

**Visitor Experience (Group A):**
```
1. Clicks ad → /w/masterclass
2. System assigns: visitorId=abc123, testGroup=A
3. Sets cookies
4. Shows:
   - Islamic Mothers Template (Registration variant A)
   - Evening schedules (Schedule variant A)
5. Visitor registers
6. System tracks:
   - Page view for "registration" element, variant A
   - Page view for "schedule" element, variant A
   - Conversion for both elements
```

**Visitor Experience (Group B):**
```
1. Clicks ad → /w/masterclass
2. System assigns: visitorId=xyz789, testGroup=B
3. Sets cookies
4. Shows:
   - Default Template (Registration variant B)
   - Afternoon schedules (Schedule variant B)
5. Visitor registers
6. System tracks:
   - Page view for "registration" element, variant B
   - Page view for "schedule" element, variant B
   - Conversion for both elements
```

**After 1 week:**
- Admin views results dashboard
- Sees: Islamic + Evening = 14.5% conversion
- Sees: Default + Afternoon = 11.3% conversion
- Clicks "Make Winner Permanent" for both elements
- All future visitors see winning combination

---

## ✅ Key Benefits

1. **Simple URL Management**
   - One URL in all ads
   - No manual URL parameters needed

2. **Consistent Visitor Experience**
   - Visitor always sees same variants
   - No confusing switches mid-journey

3. **Flexible Testing**
   - Test any combination of elements
   - Enable/disable individual tests independently
   - Easy to expand (add new elements)

4. **Powerful Analytics**
   - Track per element
   - Calculate lift per element
   - Identify winning combinations

5. **Easy for Admins**
   - Simple toggles and dropdowns
   - No coding required
   - Clear results visualization

---

## 🔄 Implementation Checklist

### Phase 1: Core Infrastructure (2-3 hours)
- [ ] Update Webinar schema (add A/B testing fields)
- [ ] Create ABTestMetric model
- [ ] Create `/src/lib/abTesting.ts` (visitor assignment)
- [ ] Create `/src/lib/abTracking.ts` (tracking functions)

### Phase 2: Registration Page (2 hours)
- [ ] Update `/w/[slug]/page.tsx` to use test configuration
- [ ] Track page views
- [ ] Track conversions on registration

### Phase 3: Admin UI (3-4 hours)
- [ ] Add A/B testing section to webinar form
- [ ] Template selection dropdowns
- [ ] Schedule multi-select
- [ ] Offer selection
- [ ] Video input fields
- [ ] Traffic split slider

### Phase 4: Results Dashboard (3-4 hours)
- [ ] Create `/api/ab-test/results/[webinarId]` endpoint
- [ ] Build results visualization page
- [ ] Calculate conversion rates
- [ ] Show statistical significance
- [ ] "Make Winner Permanent" button

### Phase 5: Testing & Polish (2 hours)
- [ ] Test visitor assignment
- [ ] Verify cookie persistence
- [ ] Test all element combinations
- [ ] Verify tracking accuracy
- [ ] Test results calculation

**Total Estimated Time: 12-15 hours**

---

## 🎯 Next Steps

Want me to:
1. ✅ Update the Prisma schema with A/B testing fields?
2. ✅ Create the visitor assignment library?
3. ✅ Build the admin UI for A/B test configuration?
4. ✅ Create the results dashboard?

Let me know and I'll start implementing! 🚀
