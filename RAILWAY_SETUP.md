# Railway Environment Variables Setup

## Required Environment Variables

Add these to your Railway project settings:

### Database URLs
```bash
# Public database URL (for migrations and build)
DATABASE_URL=postgresql://postgres:PGROlPewsCXdLjtvRxwAestaVJGldXmb@gondola.proxy.rlwy.net:24954/railway

# Direct connection URL (same as DATABASE_URL for Railway)
DATABASE_URL_DIRECT=postgresql://postgres:PGROlPewsCXdLjtvRxwAestaVJGldXmb@gondola.proxy.rlwy.net:24954/railway
```

### NextAuth
```bash
NEXTAUTH_URL=https://webinar-platform-production.up.railway.app
NEXTAUTH_SECRET=your-super-secret-key-change-in-production-min-32-chars
```

### App URL
```bash
NEXT_PUBLIC_APP_URL=https://webinar-platform-production.up.railway.app
```

### OpenAI
```bash
OPENAI_API_KEY=your-openai-api-key
```

### ClickFunnels 2.0 API
```bash
CLICKFUNNELS_API_KEY=6hxVZli_vcrWHJ7iMHirW0l7N6jtfy_JFhpH2jLi2aM
CLICKFUNNELS_WORKSPACE_ID=jxRdRe
CLICKFUNNELS_TEAM_ID=JNqzOe
```

### ClickFunnels Tag IDs
```bash
CLICKFUNNELS_TAG_REGISTERED=368586
CLICKFUNNELS_TAG_ATTENDED=368587
CLICKFUNNELS_TAG_MOSTLY_ATTENDED=368588
CLICKFUNNELS_TAG_PARTLY_ATTENDED=368589
CLICKFUNNELS_TAG_MISSED=368590
CLICKFUNNELS_TAG_REPLAY_ATTENDED=368591
CLICKFUNNELS_TAG_24HRREMINDER=372416
CLICKFUNNELS_TAG_2HRREMINDER=372417
CLICKFUNNELS_TAG_1HRREMINDER=372418
CLICKFUNNELS_TAG_15MINREMINDER=372436
CLICKFUNNELS_TAG_WESTARTED=372437
```

### Facebook Conversions API
```bash
FB_PIXEL_ID=1899876500044549
FB_ACCESS_TOKEN=EAAKgJZBnXzNABP1duyaV5HgGBFJxygHd4PGlN2YAMIqdqEvuzHgFroeLGZCasnHQe9d0RYh3tc30AZCFzkxSLOb88q48bct3m6RVaeSLmpBRjUoDTIJKecjR8imoS1rYy1j4yZCjZBMR53FCdiTFGYfXUm9ZCA9ZBDodLYeVysgk1uU5EGAQMGPLPUIdc9Q4gLDZAwZDZD
FB_TEST_EVENT_CODE=
```

### Cron Job Security
```bash
CRON_SECRET=F1viPR8MgoVQzDVnK/vy1bqeH35qQB/xFa0azaiiHEI=
```

## Important Notes

1. **DATABASE_URL**: Railway automatically provides this, but it uses the internal address (`postgres.railway.internal:5432`). We override it with the public address to ensure build-time access works.

2. **DATABASE_URL_DIRECT**: Prisma uses this for migrations and direct queries. Set it to the same value as DATABASE_URL.

3. **NEXTAUTH_URL**: Must match your Railway deployment URL exactly.

4. **NEXT_PUBLIC_APP_URL**: Must match your Railway deployment URL exactly (used for client-side redirects).

## How to Add Variables to Railway

1. Go to your Railway project dashboard
2. Click on your service
3. Go to the "Variables" tab
4. Click "New Variable"
5. Add each variable from above
6. Railway will automatically redeploy when you save

## Verification

After adding variables, verify they're set correctly:
- Check the "Variables" tab shows all variables
- Redeploy should trigger automatically
- Check build logs for any missing variable errors
