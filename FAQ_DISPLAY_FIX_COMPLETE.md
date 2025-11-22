# FAQ Display Fix - Complete ✅

## Problem
FAQs were showing hardcoded default FAQs instead of the user-configured FAQs from the database.

## Root Cause
1. **FAQs not being loaded**: The `room/[slug]/page.tsx` server component was not loading FAQs from the database
2. **FAQs not being passed to client**: The `WebinarLiveClient` component wasn't receiving FAQs as a prop
3. **Hardcoded rendering**: The FAQ section was rendering `defaultFaqs` constant instead of database FAQs

## Solution Implemented

### 1. Database Loading (`src/app/room/[slug]/page.tsx`)
Added FAQs to the Prisma query:
```typescript
const webinar = await prisma.webinar.findUnique({
  where: { slug },
  include: {
    // ... other relations
    faqs: {
      orderBy: { sortOrder: 'asc' },
    },
  },
});
```

### 2. Data Transformation
Map FAQs to the expected format:
```typescript
const faqs = webinar.faqs.map((faq) => ({
  id: faq.id,
  question: faq.question,
  answer: faq.answer,
}));

console.log(`❓ [Room] Loaded ${faqs.length} FAQs for webinar ${webinar.id}`);
```

### 3. Props Update (`src/app/w/[slug]/live/page-client.tsx`)

**Added FAQ interface:**
```typescript
interface FAQ {
  id: string;
  question: string;
  answer: string;
}
```

**Updated props interface:**
```typescript
interface WebinarLiveClientProps {
  webinar: WebinarData;
  offers: LiveOffer[];
  faqs: FAQ[];  // ← New prop
  chatMessages: ChatMessage[];
  reactionEvents: ReactionEvent[];
  viewer: ViewerInfo | null;
  timing: TimingMeta;
  isReplayMode?: boolean;
}
```

**Updated component signature:**
```typescript
export default function WebinarLiveClient({
  webinar,
  offers,
  faqs,  // ← Added
  chatMessages,
  reactionEvents,
  viewer,
  timing,
  isReplayMode = false,
}: WebinarLiveClientProps)
```

### 4. FAQ Rendering Update
Changed from hardcoded to dynamic with fallback:
```typescript
{(faqs.length > 0 ? faqs : defaultFaqs).map((faq, index) => {
  const isOpen = openFaqs.has(index);
  return (
    <div key={faq.id || faq.question} className={styles.faqItem}>
      <div className={styles.faqQuestion} onClick={() => handleFaqToggle(index)}>
        <span>{faq.question}</span>
        <i className={`fas ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} />
      </div>
      {isOpen && <div className={styles.faqAnswer}>{faq.answer}</div>}
    </div>
  );
})}
```

### 5. Default FAQs Update
Added `id` property to defaultFaqs for consistent key handling:
```typescript
const defaultFaqs = [
  {
    id: 'default-1',
    question: 'What is included in the Motherhood Balance Program?',
    answer: '...',
  },
  // ... other default FAQs
];
```

## How It Works Now

1. **Server-side**: When a user visits a webinar room, the server loads FAQs from the `webinar_faqs` table
2. **Data flow**: FAQs are passed as a prop to the `WebinarLiveClient` component
3. **Client rendering**: 
   - If the webinar has configured FAQs (`faqs.length > 0`), they are displayed
   - If no FAQs are configured, the default FAQs are shown as fallback
4. **Database console log**: A log message shows how many FAQs were loaded: `❓ [Room] Loaded X FAQs for webinar Y`

## Testing

To verify the fix:

1. **Navigate to dashboard FAQ management**: `/dashboard/webinars/[webinarId]/faq`
2. **Add custom FAQs**: Create 2-3 questions and answers
3. **Visit the live webinar page**: `/room/[slug]` or `/w/[slug]`
4. **Click the FAQ tab** in the chat sidebar
5. **Verify**: Your custom FAQs should be displayed instead of the default ones

## Database Schema

FAQs are stored in the `webinar_faqs` table:
```prisma
model WebinarFaq {
  id         String   @id @default(cuid())
  webinarId  String
  webinar    Webinar  @relation(fields: [webinarId], references: [id], onDelete: Cascade)
  
  question   String   @db.Text
  answer     String   @db.Text
  sortOrder  Int      @default(0)
  
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("webinar_faqs")
}
```

## Files Modified

1. **src/app/room/[slug]/page.tsx**
   - Added `faqs` to Prisma include
   - Map FAQs to expected format
   - Pass FAQs to client component

2. **src/app/w/[slug]/live/page-client.tsx**
   - Added `FAQ` interface
   - Updated `WebinarLiveClientProps` with `faqs` prop
   - Updated component signature to accept `faqs`
   - Changed FAQ rendering to use `faqs` with fallback to `defaultFaqs`
   - Added `id` property to `defaultFaqs`

## Commit
- **Hash**: 5143906
- **Message**: Fix FAQ display: Load and show user-configured FAQs instead of default FAQs
- **Status**: ✅ Pushed to main branch

## Related Features

- **FAQ Management UI**: `/dashboard/webinars/[id]/faq`
- **FAQ API Endpoints**: 
  - `GET /api/webinars/[id]/faq` - List all FAQs
  - `POST /api/webinars/[id]/faq` - Create FAQ
  - `PUT /api/webinars/[id]/faq/[faqId]` - Update FAQ
  - `DELETE /api/webinars/[id]/faq/[faqId]` - Delete FAQ

## Benefits

1. **Customization**: Hosts can configure FAQs specific to their webinar content
2. **Flexibility**: FAQs can be updated without code changes
3. **Fallback**: Default FAQs ensure users always see something helpful
4. **Scalability**: Each webinar can have unique FAQs
5. **User Experience**: Relevant FAQs increase conversions and reduce support questions
