# Referral System - Current Status

## ✅ COMPLETE - Backend Implementation

### 1. Database Schema ✅
- Added `referralCode` field (VARCHAR(6) UNIQUE) to Registration table
- Added `referredBy` field (VARCHAR(6)) to track who referred them
- Self-referential relation to link referrals
- **Status**: Database updated, Prisma client regenerated

### 2. Referral Utilities ✅
**File**: `/src/lib/referral.ts`
- `generateReferralCode()` - Creates random 6-char codes (e.g., "ABC123")
- `isValidReferralCode()` - Validates code format
- `buildReferralLink()` - Constructs shareable URLs
- `extractReferralCode()` - Extracts code from URL params
- **Status**: Complete and tested

### 3. Registration API ✅
**File**: `/src/app/api/webinars/[id]/register/route.ts`
- Accepts `referralCode` parameter (who referred them)
- Generates unique 6-char code for new registrant (with collision checking)
- Validates referrer exists in database
- Stores both codes: their code + who referred them
- Returns referralCode in API response
- **Status**: Fully implemented

## ✅ COMPLETE - Frontend Implementation (Default Template)

### 4. Registration Form - Default Template ✅
**File**: `/src/app/w/[slug]/templates/default.tsx`

**Changes Made**:
1. Added imports:
   ```tsx
   import { useSearchParams } from 'next/navigation'
   import { extractReferralCode } from '@/lib/referral'
   ```

2. Added state for referral tracking:
   ```tsx
   const searchParams = useSearchParams()
   const [referralCode, setReferralCode] = useState<string | null>(null)
   ```

3. Extract referral code from URL in useEffect:
   ```tsx
   const refCode = extractReferralCode(searchParams)
   if (refCode) {
     setReferralCode(refCode)
     console.log('🎁 Referral code detected:', refCode)
   }
   ```

4. Include referral code in registration API call:
   ```tsx
   body: JSON.stringify({
     // ... other fields ...
     referralCode: referralCode || undefined
   })
   ```

**Status**: ✅ Complete - Default template now captures and sends referral codes

## ✅ COMPLETE - Thank You Page Template Variables

### 5. Template Variables ✅
**File**: `/src/app/thank-you/[slug]/page.tsx`

**New Variables Added**:
1. `{{referralCode}}` - User's unique 6-character code (e.g., "ABC123")
2. `{{referralLink}}` - Full shareable URL with ref parameter
3. `{{whatsappReferralLink}}` - WhatsApp share link with pre-filled message

**Implementation**:
```tsx
// Extract referral code from registration
const referralCode = registration?.referralCode || ''
const referralLink = referralCode ? buildReferralLink(webinar.slug || '', referralCode) : ''

// Replace in template
processed = processed.replace(/\{\{referralCode\}\}/g, referralCode)
processed = processed.replace(/\{\{referralLink\}\}/g, referralLink)
processed = processed.replace(/\{\{whatsappReferralLink\}\}/g, whatsappShareLink)
```

**Template Editor Updated**:
- `/src/app/dashboard/templates/thank-you/page.tsx` now shows all 3 new variables
- Variables highlighted in green with "NEW - Referral System" label
- Help text explains what each variable does

**Status**: ✅ Complete - Variables are ready to use in templates!

## ⏳ TODO - Remaining Templates

### 6. Other Registration Templates (Not Yet Updated)
These templates still need the same referral code capture logic:
- [ ] `/src/app/w/[slug]/templates/minimal.tsx`
- [ ] `/src/app/w/[slug]/templates/custom.tsx`
- [ ] `/src/app/w/[slug]/templates/urgency.tsx`
- [ ] `/src/app/embed/[slug]/EmbedRegistrationForm.tsx`

**Next Steps**: Copy the same changes to these templates (LOW PRIORITY - default template handles most cases)

## ✅ COMPLETE - Documentation

### 7. Template Examples & Documentation ✅
**Files Created**:
- `REFERRAL_SYSTEM_COMPLETE.md` - Full implementation guide
- `REFERRAL_SYSTEM_STATUS.md` - Current status and progress
- `REFERRAL_TEMPLATE_EXAMPLES.md` - Copy-paste template examples

**Examples Include**:
1. Complete referral section with gradient design
2. Minimal referral section (simpler version)
3. Just display code (minimalist)
4. WhatsApp share button
5. Copy-to-clipboard functionality
6. Email share link
7. Twitter share link

**Status**: ✅ Complete - Full documentation ready

## ⏳ OPTIONAL - Analytics Dashboard

### 8. Referral Analytics (Optional Enhancement)
**Features to Build**:
- View how many people each user referred
- Referral leaderboard
- Track conversion rates of referrals
- Export referral data

**API Endpoint Needed**:
```
GET /api/registrations/[id]/referrals
Returns: List of all people this user referred
```

## How It Works (Current Implementation)

### Flow:
1. **User A Registers**:
   - Goes to: `https://yoursite.com/w/free-class`
   - Fills form, clicks register
   - API generates unique code: `ABC123`
   - API returns: `{ referralCode: "ABC123" }`
   - ✅ Database stores their referralCode

2. **User A Shares Link**:
   - On thank you page, gets link: `https://yoursite.com/w/free-class?ref=ABC123`
   - Shares via WhatsApp/email/social

3. **User B Clicks Link**:
   - Opens: `https://yoursite.com/w/free-class?ref=ABC123`
   - ✅ Page extracts `ref=ABC123` from URL
   - ✅ Stores in state: `setReferralCode("ABC123")`

4. **User B Registers**:
   - Fills form, clicks register
   - ✅ API call includes: `{ referralCode: "ABC123" }`
   - ✅ API validates "ABC123" exists (User A)
   - ✅ API generates User B's code: `XYZ789`
   - ✅ Database stores: `{ referralCode: "XYZ789", referredBy: "ABC123" }`

5. **Database State**:
   ```
   User A: { referralCode: "ABC123", referredBy: null }
   User B: { referralCode: "XYZ789", referredBy: "ABC123" } ← Linked!
   ```

## Testing

### Manual Test:
```bash
# 1. Register first user
curl -X POST http://localhost:3000/api/webinars/YOUR_WEBINAR_ID/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice",
    "email": "alice@test.com",
    "scheduleId": "SCHEDULE_ID",
    "timezone": "America/New_York",
    "privacyConsent": true
  }'

# Response will include: "referralCode": "ABC123"

# 2. Register second user WITH referral
curl -X POST http://localhost:3000/api/webinars/YOUR_WEBINAR_ID/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob",
    "email": "bob@test.com",
    "scheduleId": "SCHEDULE_ID",
    "timezone": "America/New_York",
    "privacyConsent": true,
    "referralCode": "ABC123"
  }'

# 3. Check database
psql -d YOUR_DB -c "SELECT name, \"referralCode\", \"referredBy\" FROM \"Registration\";"
```

### Browser Test:
1. Open: `http://localhost:3000/w/your-webinar-slug`
2. Register as User A → Note the referralCode in response
3. Open: `http://localhost:3000/w/your-webinar-slug?ref=ABC123`
4. Check console: Should see "🎁 Referral code detected: ABC123"
5. Register as User B
6. Check database to confirm User B's `referredBy` = "ABC123"

## Summary

### What's Working ✅:
- ✅ Database stores referral codes and relationships
- ✅ API generates unique codes (6 characters, alphanumeric)
- ✅ API validates and tracks referrals
- ✅ Default template captures `?ref=CODE` from URL
- ✅ Default template sends referral code to API
- ✅ Referral relationships stored in database
- ✅ **Thank you page template variables working**
- ✅ **{{referralCode}}, {{referralLink}}, {{whatsappReferralLink}} available**
- ✅ **Template editor shows new variables**
- ✅ **Full documentation and examples created**

### What's Next ⏳:
- [ ] **You can now add referral sections to your thank you page templates!**
- [ ] Use examples from `REFERRAL_TEMPLATE_EXAMPLES.md`
- [ ] Copy-paste the code into your templates
- [ ] Variables will automatically be replaced with real data
- [ ] (Optional) Update other registration templates (minimal, custom, urgency)
- [ ] (Optional) Build analytics dashboard to view referral stats

### Priority:
1. **READY TO USE**: Add referral section to your thank you page templates using the new variables
2. **MEDIUM**: Update other registration templates (if you use them)
3. **LOW**: Build analytics dashboard

**The referral system is now FULLY FUNCTIONAL!** 🎉

All you need to do is edit your thank you page template and add a referral section using the variables:
- `{{referralCode}}` - Shows the user's code
- `{{referralLink}}` - Shows the shareable link
- `{{whatsappReferralLink}}` - WhatsApp share button

Check `REFERRAL_TEMPLATE_EXAMPLES.md` for ready-to-use code you can copy and paste!
