# Referral System Implementation - Complete Guide

## Overview
A referral system that tracks who refers new registrants and provides unique referral codes and links.

## Database Schema ✅

### Registration Model (Updated)
```prisma
model Registration {
  // ... existing fields ...
  
  // Referral System
  referralCode    String?  @unique // Unique code for this person to share (e.g., "ABC123")
  referredBy      String? // referralCode of the person who referred them
  referredByUser  Registration? @relation("Referrals", fields: [referredBy], references: [referralCode], onDelete: SetNull)
  referrals       Registration[] @relation("Referrals") // People this person referred
}
```

### Columns Added:
- `referralCode` - VARCHAR(6) UNIQUE - User's unique referral code
- `referredBy` - VARCHAR(6) - Code of who referred them

**Status**: ✅ Database updated

## API Changes

### 1. Registration Endpoint ✅
**File**: `/src/app/api/webinars/[id]/register/route.ts`

**Changes Made**:
1. Import referral utility: `import { generateReferralCode } from '@/lib/referral'`
2. Accept `referralCode` in request body (who referred them)
3. Generate unique referral code for new user
4. Validate and link referrer if code provided
5. Return user's new referral code in response

**Request Body (New Field)**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  ...
  "referralCode": "ABC123"  // Optional: Code of who referred them
}
```

**Response (New Field)**:
```json
{
  "registrationId": "...",
  "registration": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "referralCode": "XYZ789"  // Their new unique code
  }
}
```

## Utilities Created

### File: `/src/lib/referral.ts` ✅

```typescript
// Generate unique 6-character code
generateReferralCode(): string  // Returns: "ABC123"

// Validate code format
isValidReferralCode(code: string): boolean

// Build shareable link
buildReferralLink(webinarSlug: string, referralCode: string, baseUrl?: string): string
// Returns: "https://yourdomain.com/w/free-class?ref=ABC123"

// Extract code from URL
extractReferralCode(searchParams: URLSearchParams): string | null
```

## Frontend Integration Needed

### 1. Capture Referral Code from URL
**File**: `/src/app/w/[slug]/page-client.tsx`

```typescript
'use client'

import { useSearchParams } from 'next/navigation'
import { extractReferralCode } from '@/lib/referral'

export default function WebinarRegisterPage({ webinarData }: Props) {
  const searchParams = useSearchParams()
  const referralCode = extractReferralCode(searchParams) // Get ?ref=ABC123
  
  // Store in state
  const [formData, setFormData] = useState({
    // ... existing fields ...
    referralCode: referralCode || '' // Include in form
  })
  
  // Submit with referral code
  const handleSubmit = async () => {
    await fetch(`/api/webinars/${webinar.id}/register`, {
      method: 'POST',
      body: JSON.stringify({
        ...formData,
        referralCode: formData.referralCode // Send to API
      })
    })
  }
}
```

### 2. Display Referral Link on Thank You Page
**File**: Thank You Page Template (wherever thank you is rendered)

```tsx
interface ThankYouPageProps {
  registration: {
    id: string
    name: string
    referralCode: string  // ← Add this
  }
  webinar: {
    slug: string
    title: string
  }
}

export default function ThankYouPage({ registration, webinar }: ThankYouPageProps) {
  const referralLink = `${window.location.origin}/w/${webinar.slug}?ref=${registration.referralCode}`
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
    alert('Link copied!')
  }
  
  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(
      `I just registered for "${webinar.title}"! Join me: ${referralLink}`
    )
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }
  
  return (
    <div>
      {/* ... thank you content ... */}
      
      {/* Referral Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
        <h3 className="text-lg font-bold mb-2">🎁 Invite Friends</h3>
        <p className="text-sm text-gray-600 mb-4">
          Share this webinar with friends and family!
        </p>
        
        {/* Referral Link */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 px-3 py-2 border rounded-lg bg-white"
          />
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Copy
          </button>
        </div>
        
        {/* Share Buttons */}
        <div className="flex gap-2">
          <button
            onClick={shareViaWhatsApp}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
          >
            <span>📱</span> WhatsApp
          </button>
          {/* Add more share buttons */}
        </div>
        
        {/* Referral Code */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-500">
            Your referral code: <span className="font-mono font-bold">{registration.referralCode}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
```

### 3. Thank You Page Template Variables

Add these variables to thank you page templates:

```javascript
// Available variables in templates:
{
  registration: {
    name: "John Doe",
    email: "john@example.com",
    referralCode: "ABC123",  // ← New variable
    referralLink: "https://yourdomain.com/w/webinar-slug?ref=ABC123"  // ← New variable
  },
  webinar: {
    title: "Free Class",
    slug: "free-class"
  }
}
```

**Template Usage**:
```html
<p>Share your referral link:</p>
<input type="text" value="{{registration.referralLink}}" readonly />

<p>Your code: {{registration.referralCode}}</p>

<a href="https://wa.me/?text=Join%20me:%20{{registration.referralLink}}">
  Share on WhatsApp
</a>
```

## Admin Dashboard - View Referrals

### Endpoint: GET /api/registrations/[id]/referrals

```typescript
// Get all people this user referred
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const registration = await prisma.registration.findUnique({
    where: { id: params.id },
    include: {
      referrals: {  // All people they referred
        select: {
          id: true,
          name: true,
          email: true,
          registeredAt: true,
          attended: true
        }
      }
    }
  })
  
  return NextResponse.json({
    referralCode: registration.referralCode,
    totalReferrals: registration.referrals.length,
    referrals: registration.referrals
  })
}
```

### Dashboard UI
**File**: `/src/app/dashboard/attendees/[id]/referrals/page.tsx` (New)

```tsx
export default function ReferralsPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    fetch(`/api/registrations/${params.id}/referrals`)
      .then(res => res.json())
      .then(setData)
  }, [params.id])
  
  return (
    <div>
      <h1>Referrals</h1>
      <p>Referral Code: {data?.referralCode}</p>
      <p>Total Referrals: {data?.totalReferrals}</p>
      
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Registered</th>
            <th>Attended</th>
          </tr>
        </thead>
        <tbody>
          {data?.referrals.map(ref => (
            <tr key={ref.id}>
              <td>{ref.name}</td>
              <td>{ref.email}</td>
              <td>{new Date(ref.registeredAt).toLocaleString()}</td>
              <td>{ref.attended ? '✅' : '❌'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

## WhatsApp Integration

### Message Template with Referral Link

```typescript
// In email/WhatsApp message templates
const whatsappMessage = `
🎓 Hi {name}!

You're registered for "{webinarTitle}"!

🎁 Invite friends using your personal link:
{referralLink}

See you there!
`.trim()

// Send via WhatsApp API or generate link
const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`
```

## Analytics Queries

### Top Referrers
```sql
SELECT 
  r.name,
  r.email,
  r.referralCode,
  COUNT(ref.id) as total_referrals
FROM "Registration" r
LEFT JOIN "Registration" ref ON ref."referredBy" = r."referralCode"
WHERE r."webinarId" = 'xxx'
GROUP BY r.id
ORDER BY total_referrals DESC
LIMIT 10;
```

### Referral Conversion Rate
```sql
SELECT 
  COUNT(CASE WHEN "referredBy" IS NOT NULL THEN 1 END) as referred_count,
  COUNT(*) as total_count,
  (COUNT(CASE WHEN "referredBy" IS NOT NULL THEN 1 END)::float / COUNT(*) * 100) as referral_percentage
FROM "Registration"
WHERE "webinarId" = 'xxx';
```

## Implementation Checklist

### Backend ✅
- [x] Add database columns
- [x] Create referral utilities
- [x] Update registration API
- [x] Generate unique codes
- [x] Track referrer relationship

### Frontend ⏳ (To Do)
- [ ] Capture `?ref=CODE` from URL
- [ ] Include referral code in registration form
- [ ] Display referral link on thank you page
- [ ] Add copy/share buttons
- [ ] WhatsApp share integration

### Templates ⏳ (To Do)
- [ ] Add variables to thank you templates
- [ ] Add referral section HTML
- [ ] Test variable substitution

### Admin Dashboard ⏳ (Optional)
- [ ] Create referrals endpoint
- [ ] Build referrals UI page
- [ ] Show referral analytics
- [ ] Export referral data

## Testing

### Test Flow:
1. User A registers → Gets code `ABC123`
2. User A shares link: `https://site.com/w/webinar?ref=ABC123`
3. User B clicks link → URL has `?ref=ABC123`
4. User B registers → `referredBy` = `ABC123`
5. Check database:
   ```sql
   SELECT * FROM "Registration" WHERE "referredBy" = 'ABC123';
   ```
6. User A's referrals count should be 1

### Manual Test:
```bash
# 1. Register first user
curl -X POST http://localhost:3000/api/webinars/WEBINAR_ID/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@test.com","privacyConsent":true}'

# Response will include: "referralCode": "ABC123"

# 2. Register second user with referral
curl -X POST http://localhost:3000/api/webinars/WEBINAR_ID/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob","email":"bob@test.com","privacyConsent":true,"referralCode":"ABC123"}'

# 3. Check database
psql -d webinar_db -c "SELECT name, \"referralCode\", \"referredBy\" FROM \"Registration\";"
```

## Example Referral Links

```
Direct link:
https://yoursite.com/w/free-class-for-mothers

With referral:
https://yoursite.com/w/free-class-for-mothers?ref=ABC123

With UTM tracking:
https://yoursite.com/w/free-class-for-mothers?ref=ABC123&utm_source=referral&utm_medium=whatsapp
```

## Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | ✅ Complete | Columns added |
| Referral Utilities | ✅ Complete | `/src/lib/referral.ts` |
| Registration API | ✅ Complete | Generates & tracks codes |
| URL Capture | ⏳ Todo | Need to add to page-client.tsx |
| Thank You Display | ⏳ Todo | Need to add referral section |
| WhatsApp Share | ⏳ Todo | Add share button |
| Admin Dashboard | ⏳ Optional | View referral stats |

## Next Steps

1. **Update registration form** to capture `?ref` param from URL
2. **Update thank you page** to show referral link and share buttons
3. **Add template variables** for `{{registration.referralCode}}` and `{{registration.referralLink}}`
4. **Test** the full flow
5. **(Optional)** Build admin dashboard to view referral analytics

The backend is ready! Now we need frontend integration to capture and display the referral codes.
