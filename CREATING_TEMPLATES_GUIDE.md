# How to Create Registration Page Templates

## Overview
Templates are separate React components that define different designs for your webinar registration pages. Each template receives the same data but presents it differently.

## Template Structure

### Basic Template Anatomy
```typescript
interface TemplateProps {
  webinar: any          // Webinar data (title, description, etc.)
  onRegister: Function  // Registration handler
  schedules: any[]      // Available schedules
  userTimezone: string  // User's detected timezone
  isEU: boolean        // Is user from EU (for GDPR)
}

export default function MyTemplate({ 
  webinar, 
  onRegister, 
  schedules, 
  userTimezone, 
  isEU 
}: TemplateProps) {
  // Your template JSX here
  return <div>...</div>
}
```

## Creating a New Template

### Step 1: Create Template File

Location: `/src/app/w/[slug]/templates/[name].tsx`

Example filenames:
- `minimal.tsx` ✅ (already created)
- `urgency.tsx`
- `video-first.tsx`
- `social-proof.tsx`
- `premium.tsx`

### Step 2: Define the Component

```typescript
'use client'

import { useState } from 'react'
import { Clock, CheckCircle } from 'lucide-react'

interface MyTemplateProps {
  webinar: any
  onRegister: (data: any) => Promise<void>
  schedules: any[]
  userTimezone: string
  isEU: boolean
}

export default function MyTemplate({ 
  webinar, 
  onRegister, 
  schedules,
  userTimezone,
  isEU 
}: MyTemplateProps) {
  // 1. State management
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gdprConsent: false,
    privacyConsent: false,
    marketingConsent: false
  })

  // 2. Form validation
  const validateForm = () => {
    // Validation logic
  }

  // 3. Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    
    await onRegister({
      ...formData,
      scheduleId: selectedSchedule.id,
    })
  }

  // 4. Return your custom design
  return (
    <div>
      {/* Your unique design here */}
    </div>
  )
}
```

### Step 3: Design Your Layout

Each template should include:

**Required Elements:**
- ✅ Webinar title
- ✅ Description
- ✅ CTA button(s)
- ✅ Registration form/modal
- ✅ Schedule display
- ✅ Privacy & GDPR consents

**Optional Elements:**
- Countdown timer
- Testimonials
- Video preview
- What you'll learn
- Bonus section
- Author bio
- Social proof
- Urgency indicators

## Template Examples

### 1. Minimal Template ✅ (Created)

**Design Philosophy:** Clean, professional, no distractions

**Key Features:**
- Simple blue gradient header
- Short description
- Single CTA above the fold
- Basic checklist
- Clean modal form

**Best For:**
- Professional/B2B audience
- Technical webinars
- Quick decision makers
- Mobile users

**Code:** `/src/app/w/[slug]/templates/minimal.tsx`

### 2. Urgency Template (To Create)

**Design Philosophy:** High pressure, time-sensitive

**Key Features:**
- Large countdown timer (prominent)
- Red/orange color scheme
- "Only X spots left" counter
- Multiple CTAs
- Scarcity messaging

**Layout:**
```jsx
<div>
  {/* Big Red Countdown */}
  <div className="bg-red-50">
    <h1>⏰ STARTS IN: {countdown}</h1>
    <p className="text-red-600">⚠️ Only 47 spots remaining!</p>
  </div>

  {/* Urgent CTA */}
  <button className="bg-red-600 animate-pulse">
    CLAIM YOUR SPOT NOW
  </button>

  {/* Benefits with urgency */}
  <div>
    <p>✓ Register in next 10 minutes → Get bonus</p>
    <p>✓ Limited to first 100 attendees</p>
  </div>
</div>
```

**Best For:**
- Launch events
- Limited-time offers
- High-value webinars
- Consumer products

### 3. Video-First Template (To Create)

**Design Philosophy:** Show, don't tell

**Key Features:**
- Large video preview/player
- Minimal text
- Video testimonials
- Visual proof
- Play button as CTA

**Layout:**
```jsx
<div>
  {/* Hero Video */}
  <div className="h-screen">
    <video 
      poster={webinar.thumbnail}
      className="w-full h-full object-cover"
    >
      {/* Preview video */}
    </video>
    <button className="absolute">▶ Watch Preview & Register</button>
  </div>

  {/* Video Testimonials */}
  <div className="grid grid-cols-3">
    {testimonials.map(video => (
      <VideoTestimonial />
    ))}
  </div>
</div>
```

**Best For:**
- Product demos
- Training webinars
- Visual content
- Storytelling

### 4. Social Proof Template (To Create)

**Design Philosophy:** Trust and credibility

**Key Features:**
- Testimonials above the fold
- Star ratings
- Company logos
- Attendee count
- Expert credentials

**Layout:**
```jsx
<div>
  {/* Social Proof Header */}
  <div className="bg-white py-4">
    <p>⭐⭐⭐⭐⭐ 4.9/5 from 2,847 attendees</p>
    <div className="flex justify-center gap-4">
      <img src="google-logo.png" />
      <img src="microsoft-logo.png" />
      <img src="amazon-logo.png" />
    </div>
  </div>

  {/* Testimonials Grid */}
  <div className="grid grid-cols-2">
    {testimonials.map(t => (
      <TestimonialCard {...t} />
    ))}
  </div>

  {/* Expert Bio */}
  <div className="flex items-center gap-4">
    <img src={host.photo} className="w-24 h-24 rounded-full" />
    <div>
      <h3>{host.name}</h3>
      <p>{host.credentials}</p>
      <p>Featured in: Forbes, TechCrunch, CNN</p>
    </div>
  </div>
</div>
```

**Best For:**
- New brands
- Building trust
- B2B webinars
- High-ticket items

### 5. Default Template (Current)

**Design Philosophy:** Comprehensive, visually appealing

**Key Features:**
- Gradient header
- Countdown timer
- Bonus section
- What you'll learn
- Multiple CTAs
- Author bio

**Location:** Currently at `/src/app/w/[slug]/page.tsx`

**Best For:**
- General purpose
- First-time visitors
- Educational content
- Informational webinars

## Step-by-Step: Creating Urgency Template

### 1. Create the file

```bash
touch src/app/w/[slug]/templates/urgency.tsx
```

### 2. Copy minimal template as base

```bash
cp src/app/w/[slug]/templates/minimal.tsx src/app/w/[slug]/templates/urgency.tsx
```

### 3. Modify the design

```typescript
export default function UrgencyTemplate({ webinar, onRegister, schedules, userTimezone, isEU }: Props) {
  const [countdown, setCountdown] = useState({ hours: 3, minutes: 47, seconds: 23 })
  const [spotsLeft] = useState(47)

  // Update countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      // Countdown logic
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="bg-red-50">
      {/* URGENT HEADER */}
      <header className="bg-gradient-to-r from-red-600 to-red-700 text-white py-12 text-center">
        <div className="mb-4 text-yellow-300 text-sm font-bold animate-pulse">
          ⚠️ LIMITED TIME OFFER ⚠️
        </div>
        <h1 className="text-5xl font-black mb-4">{webinar.title}</h1>
        
        {/* BIG COUNTDOWN */}
        <div className="flex justify-center gap-4 my-8">
          <div className="bg-white text-red-600 rounded-lg p-6 min-w-[100px]">
            <div className="text-4xl font-black">{countdown.hours}</div>
            <div className="text-sm">HOURS</div>
          </div>
          <div className="bg-white text-red-600 rounded-lg p-6 min-w-[100px]">
            <div className="text-4xl font-black">{countdown.minutes}</div>
            <div className="text-sm">MINUTES</div>
          </div>
          <div className="bg-white text-red-600 rounded-lg p-6 min-w-[100px]">
            <div className="text-4xl font-black">{countdown.seconds}</div>
            <div className="text-sm">SECONDS</div>
          </div>
        </div>

        {/* SCARCITY */}
        <div className="bg-yellow-400 text-red-900 py-3 px-6 rounded-full inline-block mb-6">
          <span className="font-bold">🔥 Only {spotsLeft} spots remaining!</span>
        </div>

        {/* CTA */}
        <button
          onClick={() => setShowModal(true)}
          className="bg-yellow-400 hover:bg-yellow-500 text-red-900 text-2xl font-black px-12 py-6 rounded-full shadow-2xl animate-pulse"
        >
          REGISTER NOW - IT'S FREE!
        </button>
      </header>

      {/* Rest of content with urgency messaging */}
      <main className="container mx-auto px-4 py-12">
        <div className="bg-white border-4 border-red-500 rounded-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-red-600 mb-4">
            ⚡ Act Fast - These Bonuses Expire in {countdown.hours} Hours!
          </h2>
          {/* Bonuses list */}
        </div>

        {/* What you'll learn with checkmarks */}
        {/* Registration form modal */}
      </main>
    </div>
  )
}
```

### 4. Add countdown logic

```typescript
useEffect(() => {
  // Set target time (e.g., 3 hours from now)
  const targetTime = new Date()
  targetTime.setHours(targetTime.getHours() + 3)

  const timer = setInterval(() => {
    const now = new Date()
    const difference = targetTime.getTime() - now.getTime()

    if (difference <= 0) {
      setCountdown({ hours: 0, minutes: 0, seconds: 0 })
      return
    }

    const hours = Math.floor(difference / (1000 * 60 * 60))
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((difference % (1000 * 60)) / 1000)

    setCountdown({ hours, minutes, seconds })
  }, 1000)

  return () => clearInterval(timer)
}, [])
```

## Template Checklist

When creating a new template, ensure it has:

### Required
- [ ] Component export with correct props interface
- [ ] Form state management (name, email, phone)
- [ ] Validation logic
- [ ] Registration handler that calls `onRegister()`
- [ ] Schedule selection UI
- [ ] Privacy consent checkbox
- [ ] GDPR consent checkbox (conditional on `isEU`)
- [ ] Error handling and display
- [ ] Loading states
- [ ] Mobile responsive design

### Recommended
- [ ] Clear CTA(s)
- [ ] Webinar description display
- [ ] Benefits/features list
- [ ] Visual hierarchy
- [ ] Brand colors
- [ ] Accessibility (ARIA labels)
- [ ] Success message after registration
- [ ] Modal/form closing mechanism

## Testing Your Template

### 1. Add to router (we'll do this next)

### 2. Test manually
```bash
# Set template in database
UPDATE webinars SET "registrationTemplate" = 'minimal' WHERE slug = 'test';

# Visit page
http://localhost:3003/w/test
```

### 3. Check all scenarios
- [ ] Desktop view
- [ ] Mobile view
- [ ] Form validation errors
- [ ] Successful registration
- [ ] Multiple schedules
- [ ] EU vs non-EU users
- [ ] Different browsers

## Design Tips

### Color Schemes by Template Type

**Minimal:**
- Blues (#3B82F6, #1E40AF)
- Grays (#6B7280, #111827)
- White backgrounds

**Urgency:**
- Reds (#DC2626, #EF4444)
- Oranges (#F97316)
- Yellows (#FCD34D)

**Social Proof:**
- Purples (#7C3AED, #6D28D9)
- Greens (#10B981)
- Trust colors

**Video-First:**
- Dark overlays
- Minimal text
- Focus on visuals

### Typography

**Minimal:** Clean sans-serif, moderate sizes
**Urgency:** Bold, large, uppercase, dramatic
**Social Proof:** Professional, readable, credential-focused
**Video-First:** Minimal text, large headlines

### Spacing

**Minimal:** Generous whitespace, breathing room
**Urgency:** Tight, packed, information-dense
**Social Proof:** Balanced, organized
**Video-First:** Minimal padding, full-bleed media

## Next Steps

1. ✅ Create minimal template (DONE)
2. Create template router in main page.tsx
3. Add template selector to admin form
4. Create urgency template
5. Create social proof template
6. Implement split testing
7. Build analytics dashboard

## Files Created So Far

- ✅ `/src/app/w/[slug]/templates/minimal.tsx` - Clean, professional template
- ✅ `/src/app/w/[slug]/templates/` - Templates directory
- ✅ `/src/app/w/[slug]/components/` - Shared components directory

## What's Next?

Would you like me to:
1. Create the template router (so minimal template actually works)
2. Create the urgency template
3. Add the template selector to admin form
4. Or something else?

Let me know and I'll implement it!
