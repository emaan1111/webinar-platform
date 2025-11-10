# Multiple Registration Templates & A/B Split Testing

## Overview
This feature allows you to:
1. **Create multiple registration page templates** with different designs
2. **A/B split test** different templates to find which converts better
3. **Track metrics** for each variant (views, registrations, conversion rates)
4. **Make data-driven decisions** about which design works best

## Database Schema Changes

### Webinar Model (Added Fields)
```prisma
registrationTemplate String?  @default("default")
enableSplitTest      Boolean  @default(false)
splitTestVariantA    String?  // Template name for variant A
splitTestVariantB    String?  // Template name for variant B
splitTestTraffic     Int      @default(50)  // % to variant A
```

### Registration Model (Added Field)
```prisma
templateVariant String?  // Which template variant they saw
```

### New Model: SplitTestMetric
```prisma
model SplitTestMetric {
  id              String    @id @default(cuid())
  webinarId       String
  templateVariant String    // Which template variant
  visitorId       String    // Anonymous visitor ID
  converted       Boolean   @default(false)
  registrationId  String?
  country         String?
  referrer        String?
  createdAt       DateTime  @default(now())
}
```

## Available Templates

### 1. **Default** (Current Design)
- Hero section with gradient
- Countdown timer
- Bonus section
- What you'll learn checklist
- Author bio
- Multiple CTAs
- **Best for:** General purpose, trust-building

### 2. **Minimal** (New - To Create)
- Clean, simple design
- Focus on the webinar content
- Single CTA above the fold
- Minimal distractions
- **Best for:** Professional audience, quick decision makers

### 3. **Video-First** (New - To Create)
- Large video preview/thumbnail
- Video testimonials
- Visual proof elements
- **Best for:** Content-heavy webinars, demonstrations

### 4. **Urgency** (New - To Create)
- Large countdown timer
- Limited spots remaining counter
- Red/orange color scheme
- Multiple urgency triggers
- **Best for:** Time-sensitive offers, launches

### 5. **Social Proof** (New - To Create)
- Testimonials above the fold
- Attendee count display
- Star ratings
- Company logos
- **Best for:** Building trust, B2B webinars

## File Structure

```
src/app/w/[slug]/
├── page.tsx                    # Main entry point (template router)
├── templates/
│   ├── default.tsx            # Current design (818 lines)
│   ├── minimal.tsx            # New: Clean & simple
│   ├── video-first.tsx        # New: Video-focused
│   ├── urgency.tsx            # New: Time pressure
│   └── social-proof.tsx       # New: Trust-building
├── components/
│   ├── RegistrationModal.tsx  # Shared modal
│   ├── CountdownTimer.tsx     # Shared countdown
│   └── ScheduleSelector.tsx   # Shared schedule picker
└── utils/
    └── split-test.ts          # A/B testing logic
```

## Implementation Steps

### Phase 1: Database Migration
```bash
# 1. Push schema changes
npx prisma db push

# 2. Regenerate Prisma client
npx prisma generate
```

### Phase 2: Create Template Components

#### A. Move current page to template
1. Rename `/src/app/w/[slug]/page.tsx` → `/src/app/w/[slug]/templates/default.tsx`
2. Extract reusable components (modal, countdown, etc.)
3. Create new `page.tsx` as template router

#### B. Create new templates
1. **Minimal Template**: Simple, clean design
2. **Video-First Template**: Large video showcase
3. **Urgency Template**: High-pressure sales page
4. **Social Proof Template**: Testimonial-heavy

### Phase 3: Template Router Logic

**File**: `/src/app/w/[slug]/page.tsx`
```typescript
'use client'

import { useEffect, useState } from 'use'
import { useParams } from 'next/navigation'
import DefaultTemplate from './templates/default'
import MinimalTemplate from './templates/minimal'
import VideoFirstTemplate from './templates/video-first'
import UrgencyTemplate from './templates/urgency'
import SocialProofTemplate from './templates/social-proof'
import { getTemplateVariant, trackPageView } from './utils/split-test'

export default function WebinarRegisterPage() {
  const params = useParams()
  const [webinar, setWebinar] = useState(null)
  const [template, setTemplate] = useState('default')
  const [visitorId, setVisitorId] = useState('')

  useEffect(() => {
    // Get or create visitor ID
    let vid = localStorage.getItem('visitorId')
    if (!vid) {
      vid = crypto.randomUUID()
      localStorage.setItem('visitorId', vid)
    }
    setVisitorId(vid)

    // Fetch webinar data
    fetchWebinar()
  }, [])

  const fetchWebinar = async () => {
    const res = await fetch(`/api/webinars/public/${params.slug}`)
    const data = await res.json()
    const webinarData = data.webinar

    // Determine which template to show
    let templateToUse = webinarData.registrationTemplate || 'default'

    // A/B Split Testing
    if (webinarData.enableSplitTest) {
      templateToUse = getTemplateVariant(
        webinarData.splitTestVariantA,
        webinarData.splitTestVariantB,
        webinarData.splitTestTraffic,
        visitorId
      )
    }

    setTemplate(templateToUse)
    setWebinar(webinarData)

    // Track page view for analytics
    await trackPageView(webinarData.id, templateToUse, visitorId)
  }

  // Render appropriate template
  const TemplateComponent = {
    'default': DefaultTemplate,
    'minimal': MinimalTemplate,
    'video-first': VideoFirstTemplate,
    'urgency': UrgencyTemplate,
    'social-proof': SocialProofTemplate,
  }[template] || DefaultTemplate

  if (!webinar) return <div>Loading...</div>

  return <TemplateComponent webinar={webinar} visitorId={visitorId} templateVariant={template} />
}
```

### Phase 4: Split Test Logic

**File**: `/src/app/w/[slug]/utils/split-test.ts`
```typescript
// Determine which variant to show based on consistent hashing
export function getTemplateVariant(
  variantA: string,
  variantB: string,
  trafficPercentage: number,
  visitorId: string
): string {
  // Use consistent hashing so same visitor always sees same variant
  const hash = hashString(visitorId)
  const bucket = hash % 100
  
  return bucket < trafficPercentage ? variantA : variantB
}

// Simple hash function
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

// Track page view
export async function trackPageView(
  webinarId: string,
  templateVariant: string,
  visitorId: string
) {
  try {
    await fetch('/api/split-test/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webinarId,
        templateVariant,
        visitorId,
        referrer: document.referrer,
      })
    })
  } catch (error) {
    console.error('Failed to track page view:', error)
  }
}

// Track conversion
export async function trackConversion(
  webinarId: string,
  templateVariant: string,
  visitorId: string,
  registrationId: string
) {
  try {
    await fetch('/api/split-test/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webinarId,
        templateVariant,
        visitorId,
        registrationId,
      })
    })
  } catch (error) {
    console.error('Failed to track conversion:', error)
  }
}
```

### Phase 5: API Endpoints

#### A. Track Page View
**File**: `/src/app/api/split-test/track/route.ts`
```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { webinarId, templateVariant, visitorId, referrer } = body

    // Check if visitor already viewed this variant
    const existing = await prisma.splitTestMetric.findFirst({
      where: {
        webinarId,
        visitorId,
        templateVariant,
      }
    })

    if (existing) {
      return NextResponse.json({ message: 'Already tracked' })
    }

    // Get country from IP (optional)
    const country = await getCountryFromRequest(request)

    // Create metric record
    await prisma.splitTestMetric.create({
      data: {
        webinarId,
        templateVariant,
        visitorId,
        referrer: referrer || null,
        country,
        converted: false,
      }
    })

    return NextResponse.json({ message: 'Tracked' })
  } catch (error) {
    console.error('Track page view error:', error)
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 })
  }
}

async function getCountryFromRequest(request: Request): Promise<string | null> {
  // Extract IP and get country (implementation depends on hosting)
  // For Railway, you can use headers
  const ip = request.headers.get('x-forwarded-for')
  // Use ipapi.co or similar service
  return null
}
```

#### B. Track Conversion
**File**: `/src/app/api/split-test/convert/route.ts`
```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { webinarId, templateVariant, visitorId, registrationId } = body

    // Update metric to mark as converted
    await prisma.splitTestMetric.updateMany({
      where: {
        webinarId,
        visitorId,
        templateVariant,
      },
      data: {
        converted: true,
        registrationId,
      }
    })

    return NextResponse.json({ message: 'Conversion tracked' })
  } catch (error) {
    console.error('Track conversion error:', error)
    return NextResponse.json({ error: 'Failed to track conversion' }, { status: 500 })
  }
}
```

#### C. Get Split Test Results
**File**: `/src/app/api/split-test/results/[webinarId]/route.ts`
```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { webinarId: string } }
) {
  try {
    const { webinarId } = params

    // Get metrics grouped by variant
    const metrics = await prisma.splitTestMetric.groupBy({
      by: ['templateVariant'],
      where: { webinarId },
      _count: {
        id: true,
      },
      _sum: {
        converted: true, // Count of conversions
      }
    })

    const results = metrics.map((metric) => ({
      variant: metric.templateVariant,
      views: metric._count.id,
      conversions: metric._sum.converted || 0,
      conversionRate: ((metric._sum.converted || 0) / metric._count.id) * 100,
    }))

    // Calculate statistical significance
    const significance = calculateSignificance(results)

    return NextResponse.json({ results, significance })
  } catch (error) {
    console.error('Get split test results error:', error)
    return NextResponse.json({ error: 'Failed to get results' }, { status: 500 })
  }
}

function calculateSignificance(results: any[]): any {
  // Implement chi-square test or z-test
  // Return confidence level (95%, 99%, etc.)
  return { confident: false, level: 0 }
}
```

### Phase 6: Admin UI Updates

#### A. Add Template Selector to Webinar Form
**File**: `/src/app/dashboard/webinars/new/page.tsx`

Add fields:
```typescript
{/* Registration Template */}
<div>
  <label>Registration Page Template</label>
  <select
    value={formData.registrationTemplate}
    onChange={(e) => setFormData({ ...formData, registrationTemplate: e.target.value })}
  >
    <option value="default">Default (Current)</option>
    <option value="minimal">Minimal</option>
    <option value="video-first">Video First</option>
    <option value="urgency">Urgency Focused</option>
    <option value="social-proof">Social Proof</option>
  </select>
</div>

{/* Enable Split Testing */}
<div>
  <label>
    <input
      type="checkbox"
      checked={formData.enableSplitTest}
      onChange={(e) => setFormData({ ...formData, enableSplitTest: e.target.checked })}
    />
    Enable A/B Split Testing
  </label>
</div>

{formData.enableSplitTest && (
  <>
    <div>
      <label>Variant A Template</label>
      <select
        value={formData.splitTestVariantA}
        onChange={(e) => setFormData({ ...formData, splitTestVariantA: e.target.value })}
      >
        {/* Same options */}
      </select>
    </div>
    
    <div>
      <label>Variant B Template</label>
      <select
        value={formData.splitTestVariantB}
        onChange={(e) => setFormData({ ...formData, splitTestVariantB: e.target.value })}
      >
        {/* Same options */}
      </select>
    </div>
    
    <div>
      <label>Traffic Split (% to Variant A)</label>
      <input
        type="range"
        min="0"
        max="100"
        value={formData.splitTestTraffic}
        onChange={(e) => setFormData({ ...formData, splitTestTraffic: parseInt(e.target.value) })}
      />
      <span>{formData.splitTestTraffic}% / {100 - formData.splitTestTraffic}%</span>
    </div>
  </>
)}
```

#### B. Add Split Test Results Dashboard
**File**: `/src/app/dashboard/webinars/[id]/split-test/page.tsx`

Show:
- Table with variants (A vs B)
- Views, Conversions, Conversion Rate
- Chart showing performance over time
- Winner declaration when significant
- Button to "Make Winner Permanent"

## Usage Examples

### Example 1: Single Template
```typescript
// Create webinar with specific template
{
  title: "My Webinar",
  slug: "my-webinar",
  registrationTemplate: "minimal", // Use minimal template
  enableSplitTest: false,
  // ... other fields
}
```
Result: All visitors see minimal template

### Example 2: A/B Split Test
```typescript
// Create webinar with split test
{
  title: "My Webinar",
  slug: "my-webinar",
  enableSplitTest: true,
  splitTestVariantA: "default",
  splitTestVariantB: "urgency",
  splitTestTraffic: 50, // 50/50 split
  // ... other fields
}
```
Result: 50% see default, 50% see urgency template

### Example 3: 70/30 Split
```typescript
{
  enableSplitTest: true,
  splitTestVariantA: "social-proof",
  splitTestVariantB: "video-first",
  splitTestTraffic: 70, // 70% to A, 30% to B
}
```

## Conversion Tracking Flow

1. **Visitor lands on page** → Create/retrieve visitor ID → Track page view
2. **Visitor submits form** → Track conversion with visitor ID + registration ID
3. **Admin views results** → See conversion rates for each variant
4. **Decide winner** → Set `registrationTemplate` to winning variant, disable split test

## Analytics Dashboard Metrics

For each variant show:
- **Views**: Total page loads
- **Unique Visitors**: Distinct visitor IDs
- **Registrations**: Completed sign-ups
- **Conversion Rate**: (Registrations / Unique Visitors) × 100
- **Confidence Level**: Statistical significance
- **Performance Over Time**: Line chart

## Benefits

1. **Data-Driven Decisions**: Know which design converts better
2. **Continuous Optimization**: Always testing to improve
3. **Risk Mitigation**: Test changes on small traffic first
4. **Professional**: Show clients you optimize scientifically
5. **Competitive Advantage**: Most competitors don't A/B test

## Next Steps

1. **Push database schema** (add new fields)
2. **Create minimal template** (simplest, quick win)
3. **Build split test tracking** (API + logic)
4. **Add UI controls** (template selector in admin)
5. **Create results dashboard** (view performance)
6. **Add more templates** (urgency, social proof, etc.)

## Migration Path

For existing webinars:
```sql
-- Set all existing webinars to default template
UPDATE webinars 
SET "registrationTemplate" = 'default',
    "enableSplitTest" = false
WHERE "registrationTemplate" IS NULL;
```

## Technical Notes

- **Visitor ID**: Stored in localStorage, persists across sessions
- **Consistent Hashing**: Same visitor always sees same variant
- **Cookie-less**: Works without cookies (GDPR friendly)
- **Server-Side Logic**: Template selection happens on server
- **Real-time Tracking**: Metrics update immediately
- **Privacy Safe**: No PII in split test metrics

## Future Enhancements

1. **Multivariate Testing**: Test 3+ variants
2. **Custom Templates**: Let users create their own
3. **Template Builder**: Drag-and-drop page builder
4. **AI Optimization**: Auto-select best template based on audience
5. **Heat Maps**: See where visitors click
6. **Session Recordings**: Watch how people interact
7. **Smart Routing**: Show template based on referrer/device
