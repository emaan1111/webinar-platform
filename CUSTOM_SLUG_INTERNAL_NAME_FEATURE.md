# Custom Slug and Internal Name Feature

## Overview
Added the ability to customize webinar slugs and add internal names for better organization.

## New Features

### 1. Custom Slug
- **What**: Users can now customize the URL slug for their webinars
- **Auto-generation**: Still auto-generates from title, but fully editable
- **Validation**: Only allows lowercase letters, numbers, and hyphens
- **Public URL**: `yoursite.com/w/your-custom-slug`

### 2. Internal Name
- **What**: Private name field for internal organization
- **Purpose**: Help organize webinars internally without affecting public-facing content
- **Visibility**: Only shown in dashboard, never shown to attendees
- **Use Cases**: 
  - "Q4 2025 - Lead Gen Webinar #3"
  - "Test - Facebook Campaign"
  - "Archived - Old Product Launch"

## Database Changes

### Schema Update (`prisma/schema.prisma`)
```prisma
model Webinar {
  id            String   @id @default(cuid())
  slug          String?  @unique // User can customize
  internalName  String?  // Private internal name
  title         String   // Public title
  // ... other fields
}
```

### Migration
```sql
ALTER TABLE webinars ADD COLUMN IF NOT EXISTS "internalName" TEXT;
```

## UI Changes

### Webinar List Page (`/dashboard/webinars`)
- Shows internal name below the public title
- Format: "Internal: Your Internal Name"
- Only displays if internal name is set

### Create Webinar Form (`/dashboard/webinars/new`)
**New Fields**:
1. **Webinar Title (Public)** - Updated label for clarity
2. **Internal Name (Optional)** - NEW field with helper text
3. **Custom URL Slug** - Updated to be fully editable with real-time preview

**Field Order**:
- Title (Public)
- Internal Name (Optional)
- Custom Slug
- Description
- ...rest of form

### Edit Webinar Form (`/dashboard/webinars/[id]/edit`)
Same fields as create form, with ability to update both slug and internal name.

## API Updates

### POST `/api/webinars`
**New Accepted Fields**:
```typescript
{
  title: string
  slug?: string | null
  internalName?: string | null
  description: string
  // ... other fields
}
```

### PATCH `/api/webinars/[id]`
**Added to Allowed Fields**:
- `slug`
- `internalName`

### GET `/api/webinars` & `/api/webinars/[id]`
**Returns**:
```typescript
{
  id: string
  slug: string | null
  internalName: string | null
  title: string
  // ... other fields
}
```

## File Changes

### Modified Files
1. **prisma/schema.prisma** - Added `internalName` field
2. **src/app/dashboard/webinars/page.tsx** - Display internal name in list
3. **src/app/dashboard/webinars/new/page.tsx** - Added form fields
4. **src/app/dashboard/webinars/[id]/edit/page.tsx** - Added form fields
5. **src/app/api/webinars/route.ts** - Handle new fields in POST
6. **src/app/api/webinars/[id]/route.ts** - Handle new fields in PATCH

### Database Migration
- Direct SQL: `ALTER TABLE webinars ADD COLUMN "internalName" TEXT;`
- Prisma Client regenerated

## Features

### Auto-generation of Slug
- Slug is automatically generated from title
- Updates as you type the title
- Can be manually overridden at any time
- Validation removes invalid characters automatically

### Slug Validation
- Only lowercase letters, numbers, and hyphens allowed
- Invalid characters automatically converted to hyphens
- Real-time preview of final URL
- Must be unique across all webinars

### Internal Name Benefits
- Keep track of campaigns: "Facebook Ad Campaign Dec 2025"
- Version tracking: "V2 - Updated Content"
- Status indicators: "DRAFT - Needs Review"
- Client identification: "Acme Corp Webinar"
- Testing: "A/B Test Variant A"

## Usage Examples

### Example 1: Marketing Campaign
```
Title (Public): "Master Social Media Marketing in 2025"
Internal Name: "Q4 2025 - FB Lead Gen Campaign #3"
Slug: "social-media-masterclass-2025"
```

### Example 2: Client Webinar
```
Title (Public): "Exclusive Training Session"
Internal Name: "Acme Corp - Employee Training Dec 2025"
Slug: "acme-training-december"
```

### Example 3: A/B Testing
```
Title (Public): "Free Masterclass: Build Your Online Business"
Internal Name: "Variant A - Long Form Title"
Slug: "online-business-masterclass-a"
```

## User Interface

### Webinar List Card
```
┌─────────────────────────────────────────┐
│ Master Social Media Marketing in 2025  │
│ Internal: Q4 2025 - FB Lead Gen #3     │ <- NEW
│ Status: SCHEDULED                       │
│ Date: Dec 15, 2025                      │
└─────────────────────────────────────────┘
```

### Form Fields
```
Webinar Title (Public) *
[________________________]
This is the title shown to attendees

Internal Name (Optional)
[________________________]
Private name for your internal organization. Not shown to attendees.

Custom URL Slug *
/w/ [________________]
Auto-generated from title, but you can customize it. Your public URL:
yoursite.com/w/your-slug-here
Only lowercase letters, numbers, and hyphens allowed.
```

## Benefits

1. **Better Organization**: Easily identify webinars in your dashboard
2. **Clean URLs**: Create memorable, SEO-friendly URLs
3. **Campaign Tracking**: Associate webinars with campaigns internally
4. **Version Control**: Track different versions or tests
5. **Client Management**: Tag webinars for specific clients
6. **Internal Notes**: Add context without affecting public display

## Status

✅ **Database schema updated**  
✅ **Prisma client regenerated**  
✅ **API routes updated (POST & PATCH)**  
✅ **Create form updated**  
✅ **Edit form updated**  
✅ **Webinar list page updated**  
✅ **Validation implemented**  
✅ **Auto-generation working**  
✅ **Real-time preview added**  

## Ready to Use! 🎉
