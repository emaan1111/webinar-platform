# Time-Synced Reactions System - Complete Guide

## Overview
The Time-Synced Reactions System allows you to script reactions (heart, clap, thumbsUp) that appear at exact video timestamps, creating authentic viewer engagement during simulated live webinars.

## Database Schema

```prisma
model Reaction {
  id             String   @id @default(cuid())
  webinarId      String
  webinar        Webinar  @relation(fields: [webinarId], references: [id], onDelete: Cascade)
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  type           String   // "heart", "clap", "thumbsUp"
  isScripted     Boolean  @default(false)
  videoTimestamp Int      // Timestamp in seconds
  isHidden       Boolean  @default(false)
  createdAt      DateTime @default(now())

  @@index([webinarId, videoTimestamp])
  @@map("reactions")
}
```

## Reaction Types

| Type | Description | Icon |
|------|-------------|------|
| `heart` | Love/like reaction | ❤️ |
| `clap` | Applause | 👏 |
| `thumbsUp` | Approval | 👍 |

## CSV Format

### File Structure
```csv
timestamp,username,type
0:45,Sarah,heart
1:12,Fatima,clap
2:20,Zainab,thumbsUp
```

### Column Specifications

1. **timestamp** - When the reaction appears
   - Format: `MM:SS`, `H:MM:SS`, or seconds (e.g., `90`)
   - Examples: `1:30`, `0:45`, `12:15`, `90`

2. **username** - Display name for the reaction
   - Any string value
   - Best practice: Use realistic, diverse names

3. **type** - Reaction type
   - Valid values: `heart`, `clap`, `thumbsUp`
   - Case-sensitive

### Column Name Variations
The import system recognizes these column names:
- **Timestamp**: `timestamp`, `time`, `second`
- **Username**: `username`, `user`, `name`
- **Type**: `type`, `reaction`, `emoji`

## API Endpoints

### Import Reactions from CSV
```http
POST /api/webinars/{webinarId}/reactions/import
Content-Type: application/json

{
  "csvData": "timestamp,username,type\n0:45,Sarah,heart\n1:12,Fatima,clap",
  "clearExisting": true
}
```

**Parameters:**
- `csvData` (required): CSV content as string
- `clearExisting` (optional): If true, deletes existing scripted reactions before import

**Response:**
```json
{
  "success": true,
  "imported": 52,
  "messages": "Successfully imported 52 reactions"
}
```

### Delete Individual Reaction
```http
DELETE /api/webinars/{webinarId}/reactions/{reactionId}
```

**Response:**
```json
{
  "success": true,
  "message": "Reaction deleted successfully"
}
```

### Update Reaction
```http
PATCH /api/webinars/{webinarId}/reactions/{reactionId}
Content-Type: application/json

{
  "isHidden": true,
  "videoTimestamp": 125,
  "type": "heart"
}
```

**Parameters (all optional):**
- `isHidden`: Boolean - Hide/show the reaction
- `videoTimestamp`: Number - Change when reaction appears
- `type`: String - Change reaction type

## Admin UI Integration

The reactions are managed through the same UI as chat messages:

**URL:** `http://localhost:3000/dashboard/webinars/{webinarId}/chat`

### Features:
- CSV bulk import with validation
- Real-time preview of imported reactions
- Sort by timestamp
- Delete individual reactions
- Toggle visibility
- View reaction statistics

## Sample Data

A complete sample file with 52+ realistic reactions is available:
```
sample-webinar-reactions.csv
```

### Sample Content:
- Spread throughout a 30-minute webinar
- Mix of all three reaction types (heart, clap, thumbsUp)
- Realistic timing and distribution
- Authentic Islamic/Arabic names matching webinar theme

## Usage in Webinar Room

Reactions automatically display at their specified timestamps during video playback.

### How It Works:
1. Video plays in the webinar room
2. When currentTime matches a reaction's videoTimestamp
3. Reaction appears on screen with username
4. Reaction animates and fades out
5. Pattern repeats for subsequent viewers

### Loading Reactions:
```typescript
// In server component (room/[slug]/page.tsx)
const reactions = await prisma.reaction.findMany({
  where: {
    webinarId: webinar.id,
    isHidden: false,
  },
  orderBy: {
    videoTimestamp: 'asc',
  },
  include: {
    user: {
      select: {
        name: true,
      },
    },
  },
});
```

## Best Practices

### Timing Strategy
- **First reactions**: 30-60 seconds after start
- **Frequency**: 1-3 reactions per minute
- **Clustering**: Group reactions during key moments
- **Variation**: Mix different types naturally

### Type Distribution
- **Hearts**: 60% (most common, general appreciation)
- **Claps**: 30% (applause for specific points)
- **Thumbs Up**: 10% (agreement/approval)

### Username Strategy
- Use diverse, realistic names
- Match your target audience demographic
- Avoid repetition (same name appearing too often)
- Cultural authenticity (e.g., Arabic names for Islamic content)

### Content Alignment
Align reactions with:
- Key teaching moments → clap
- Emotional stories → heart
- Practical tips → thumbsUp
- Q&A interactions → heart

## Testing Workflow

1. **Prepare CSV file** with reactions
2. **Access admin UI**: `/dashboard/webinars/{id}/chat`
3. **Import reactions**: Paste CSV, click import
4. **Verify import**: Check count and timestamps
5. **Test in room**: Visit `/room/{slug}`
6. **Observe timing**: Ensure reactions appear correctly
7. **Adjust if needed**: Update timestamps or delete/add reactions

## Common Issues

### Reactions Not Appearing
- ✅ Check `isHidden = false`
- ✅ Verify `videoTimestamp` is within video duration
- ✅ Ensure `isScripted = true` for imported reactions
- ✅ Confirm reactions are loaded in room component

### Import Failing
- ✅ Check CSV format (timestamp,username,type)
- ✅ Validate reaction types (heart, clap, thumbsUp)
- ✅ Ensure timestamps are valid (MM:SS or seconds)
- ✅ Remove empty lines from CSV

### Type Validation Error
- ✅ Use only: `heart`, `clap`, `thumbsUp`
- ✅ Check for typos (e.g., `thumbup` vs `thumbsUp`)
- ✅ Ensure lowercase for heart/clap, camelCase for thumbsUp

## Integration with Chat System

Reactions work alongside the time-synced chat system:
- Both use `videoTimestamp` for synchronization
- Both support CSV import
- Both managed from same admin UI
- Both create authentic "live" engagement

### Combined Experience:
```
Time    Chat Message                  Reaction
0:45    "So excited for this!"        ❤️ Sarah
1:12    "This is amazing!"            👏 Fatima
2:20    "Absolutely agree!"           👍 Zainab
```

## Files Modified

### Database
- `prisma/schema.prisma` - Added Reaction model

### API Endpoints
- `src/app/api/webinars/[id]/reactions/import/route.ts` - Bulk import
- `src/app/api/webinars/[id]/reactions/[reactionId]/route.ts` - CRUD operations

### Sample Data
- `sample-webinar-reactions.csv` - 52+ realistic reactions

### Documentation
- `TIME_SYNCED_REACTIONS_COMPLETE.md` - This file

## Next Steps

1. **Update Admin UI** to include reactions tab
2. **Update room component** to load reactions from database
3. **Test complete workflow** from import to display
4. **Create documentation** for end users

## Summary

The Time-Synced Reactions System provides:
✅ Database-driven reaction storage
✅ CSV bulk import capability
✅ Precise timestamp synchronization
✅ Three reaction types (heart, clap, thumbsUp)
✅ Admin management interface
✅ Seamless integration with chat system
✅ Authentic live webinar simulation

**Status**: Database schema and API endpoints complete. Admin UI and room integration pending.
