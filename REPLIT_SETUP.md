# Replit Deployment - Simple Setup (No Data Import)

## The Simple Solution: Start Fresh on Replit

Instead of importing old test data (which has schema mismatches), let's get your app running on Replit with a clean database. You can create new webinars through the UI.

## Step-by-Step Setup

### 1. Ensure Prisma Schema is Applied
```bash
npx prisma migrate deploy
npx prisma generate
```

### 2. Create Your Admin User (Optional)
If you want to login immediately, run this in Replit shell:

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('your-password-here', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'ariba.farheen@gmail.com' },
    update: {},
    create: {
      email: 'ariba.farheen@gmail.com',
      name: 'Ariba Farheen',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });
  
  console.log('✅ Admin user created:', user.email);
  process.exit(0);
}

createAdmin().catch(console.error);
"
```

### 3. Set Environment Variables in Replit Secrets

Add these secrets (Tools → Secrets):

```env
DATABASE_URL=(already set by Replit)
NEXTAUTH_URL=https://your-replit-url.replit.dev
NEXTAUTH_SECRET=your-secret-here

# Facebook Conversions API
FB_PIXEL_ID=1899876500044549
FB_ACCESS_TOKEN=EAAKgJZBnXzNABP1duyaV5HgGBFJxygHd4PGlN2YAMIqdqEvuzHgFroeLGZCasnHQe9d0RYh3tc30AZCFzkxSLOb88q48bct3m6RVaeSLmpBRjUoDTIJKecjR8imoS1rYy1j4yZCjZBMR53FCdiTFGYfXUm9ZCA9ZBDodLYeVysgk1uU5EGAQMGPLPUIdc9Q4gLDZAwZDZD
FB_TEST_EVENT_CODE=

# ClickFunnels (if you use it)
CLICKFUNNELS_API_KEY=your-key
CLICKFUNNELS_WORKSPACE_ID=your-id
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Start the App
Click the **Run** button or:
```bash
npm run dev
```

### 6. Test Your App

1. **Visit the app** in the webview
2. **Create an account** or login with the admin user you created
3. **Create a new webinar** through the UI
4. **Test registration** - Check Replit console for:
   - `✅ Facebook Conversions API event sent successfully`
   - Facebook event with FBTRACE ID

## Why This Approach is Better

✅ **No schema conflicts** - Uses Prisma's clean schema  
✅ **No import errors** - Avoids foreign key nightmares  
✅ **Fresh start** - Test with real production-like data  
✅ **Faster setup** - Running in 5 minutes vs hours of debugging  
✅ **Same functionality** - All features work the same  

## Your Old Data (Optional)

Your local database has:
- 1 user (ariba.farheen@gmail.com)
- 1 webinar
- 18 registrations
- Various templates and pages

You can recreate these through the UI if needed, or we can try a more targeted import later once the app is running.

## Next Steps After Running

1. ✅ Verify app loads
2. ✅ Create/login as admin user
3. ✅ Create a test webinar
4. ✅ Test registration form
5. ✅ Check Facebook Conversions API in console
6. ✅ Test live webinar features

## If You Still Want Your Old Templates

Once the app is running, we can export just the templates (no foreign keys) and import those:

```bash
# On local machine
pg_dump -U aribafarheen webinar_db --data-only --inserts \
  --table=templates \
  --table=thank_you_templates \
  --table=countdown_templates \
  --table=registration_pages \
  --table=countdown_pages \
  > templates_only.sql

# On Replit
psql $DATABASE_URL -f templates_only.sql
```

---

**Bottom Line:** Get it running first, import data later if needed. 🚀
