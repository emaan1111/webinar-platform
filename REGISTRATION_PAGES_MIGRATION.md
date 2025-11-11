# Registration Pages Migration - From Templates to Pages

## Overview
Migrating from the `Template` system to a dedicated `RegistrationPage` model for better control and consistency with the `CountdownPage` system.

## Changes Made

### 1. Database Schema Updates

#### New Model: `RegistrationPage`
```prisma
model RegistrationPage {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?  @db.Text
  htmlCode    String   @db.Text
  
  // Form Settings
  collectPhone    Boolean @default(false)
  collectCompany  Boolean @default(false)
  collectCustom1  Boolean @default(false)
  customField1Label String?
  collectCustom2  Boolean @default(false)
  customField2Label String?
  
  // Display Settings
  showHostInfo    Boolean @default(true)
  showBenefits    Boolean @default(true)
  showTestimonials Boolean @default(false)
  showCountdown   Boolean @default(true)
  showSocialProof Boolean @default(true)
  
  // Video Settings
  showVideo       Boolean @default(false)
  videoUrl        String?
  videoTitle      String?
  videoAutoplay   Boolean @default(false)
  
  // Testimonials
  testimonial1Text   String? @db.Text
  testimonial1Author String?
  testimonial1Image  String?
  testimonial2Text   String? @db.Text
  testimonial2Author String?
  testimonial2Image  String?
  testimonial3Text   String? @db.Text
  testimonial3Author String?
  testimonial3Image  String?
  
  // Benefits
  benefit1 String?
  benefit2 String?
  benefit3 String?
  benefit4 String?
  benefit5 String?
  
  // Branding
  logoUrl          String?
  primaryColor     String? @default("#4f46e5")
  secondaryColor   String? @default("#8b5cf6")
  backgroundColor  String? @default("#ffffff")
  textColor        String? @default("#1f2937")
  
  // CTA
  ctaButtonText    String? @default("Register Now")
  ctaButtonStyle   String? @default("solid")
  
  // Footer
  showFooter       Boolean @default(true)
  footerText       String? @db.Text
  privacyPolicyUrl String?
  termsOfServiceUrl String?
  
  // SEO
  thumbnail        String?
  metaDescription  String?
  
  // System
  isSystem    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("registration_pages")
}
```

#### Webinar Model Updates
**Before:**
```prisma
registrationTemplateId String?
regTemplateAId         String? // A/B test variant A
regTemplateBId         String? // A/B test variant B
```

**After:**
```prisma
registrationPageId     String? // Reference to RegistrationPage
regPageAId             String? // A/B test variant A  
regPageBId             String? // A/B test variant B
```

### 2. Code Changes Needed

#### Files to Update:
1. `/src/app/w/[slug]/page.tsx` - Server component
   - Change `registrationTemplate` to `registrationPage`
   - Update Prisma query from `template` to `registrationPage`
   - Update field names (`registrationTemplateId` → `registrationPageId`)
   
2. `/src/app/w/[slug]/page-client.tsx` - Client component
   - Update prop types
   - Change template processing to page processing
   
3. `/src/lib/abTesting.ts` - A/B testing logic
   - Update `getTestConfiguration` to use new field names
   - Change `regTemplateAId/regTemplateBId` to `regPageAId/regPageBId`
   
4. Dashboard/Admin Pages:
   - `/src/app/dashboard/webinars/create/page.tsx`
   - `/src/app/dashboard/webinars/[id]/edit/page.tsx`
   - `/src/app/dashboard/registration-pages/` (new section)

### 3. Migration Steps

```bash
# 1. Generate Prisma migration
npx prisma migrate dev --name add_registration_pages

# 2. Create default registration page
# Run seed script or manually create in Prisma Studio

# 3. Migrate existing data (if any)
# Convert Template records to RegistrationPage records
# Update Webinar.registrationTemplateId → Webinar.registrationPageId

# 4. Update application code (see files above)

# 5. Test thoroughly
# - Registration flow
# - A/B testing with registration pages
# - Page editing in dashboard
```

### 4. Benefits of This Change

✅ **Consistency** - RegistrationPage matches CountdownPage structure
✅ **Type Safety** - Dedicated model with specific fields for registration
✅ **Flexibility** - More configuration options than generic templates
✅ **Clarity** - Clear separation between registration pages and other page types
✅ **Future-Proof** - Easier to add registration-specific features

### 5. Backwards Compatibility

The `Template` model is still in the schema for:
- Thank you page templates (until we create ThankYouPage model)
- Other potential template uses
- Historical data preservation

**Note:** After full migration, the `Template` model can be deprecated or repurposed.

### 6. Default Registration Pages to Create

1. **Default** - Clean, professional design
2. **Bold** - High-contrast, attention-grabbing
3. **Minimal** - Simple, distraction-free
4. **Video Hero** - Full-width video with overlay registration
5. **Testimonial-Heavy** - Multiple testimonials, social proof
6. **Benefits Focus** - Large benefits list, feature-rich

### 7. Variable Replacement in HTML

Registration page `htmlCode` should support these variables:
```
{{webinarTitle}}
{{webinarDescription}}
{{hostName}}
{{hostEmail}}
{{hostImage}}
{{registrationForm}} - Placeholder for form injection
{{schedulesList}} - Placeholder for schedules
{{videoEmbed}} - If showVideo is true
{{testimonials}} - If showTestimonials is true
{{benefits}} - If showBenefits is true
{{primaryColor}}
{{secondaryColor}}
{{backgroundColor}}
{{textColor}}
{{ctaButtonText}}
```

## Next Steps

1. ✅ Schema updated
2. ⏳ Run Prisma migration
3. ⏳ Create seed data for default registration pages
4. ⏳ Update `/src/app/w/[slug]/page.tsx`
5. ⏳ Update `/src/app/w/[slug]/page-client.tsx`
6. ⏳ Update A/B testing logic
7. ⏳ Create admin UI for managing registration pages
8. ⏳ Test thoroughly

## Current Status

- Schema changes: ✅ Complete
- Migration pending: Yes
- Code updates: Pending
- Testing: Pending
