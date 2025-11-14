# Prisma Migration Safety Guide - Reminder System

## Why Do We Need to Run the Migration?

### Current Situation
1. **Schema Updated** ✅ - We added reminder models to `prisma/schema.prisma`:
   - `WebinarReminderTemplate` model (stores reminder templates)
   - `WebinarReminderSent` model (tracks individual reminders)
   - Added relations to `Webinar` and `Registration` models

2. **Database NOT Updated** ❌ - Your PostgreSQL database on Railway does NOT have these tables yet
   - The tables `webinar_reminder_templates` and `webinar_reminders_sent` don't exist
   - The relationships between tables aren't created
   
3. **Code Can't Run** ❌ - The reminder system code has TypeScript errors because:
   - Prisma Client types aren't generated yet
   - When you try to use `prisma.webinarReminderTemplate`, TypeScript says "doesn't exist"
   - The code was written based on the schema, but types don't exist until migration runs

### What the Migration Does

The migration will:
1. **Create 2 new tables** in your database:
   - `webinar_reminder_templates`
   - `webinar_reminders_sent`

2. **Add indexes** for performance:
   - Index on `webinarId` for fast lookups
   - Index on `scheduledFor` and `status` for cron job queries

3. **Generate TypeScript types** so your code can compile

### What the Migration DOESN'T Do (Safe!)

✅ **No existing data will be modified**
✅ **No existing tables will be changed**
✅ **No data will be deleted**
✅ **Completely non-destructive** - only adding new tables

This is a **LOW RISK** migration because:
- We're only ADDING tables, not modifying existing ones
- No foreign key constraints that could break existing data
- Relations use `onDelete: Cascade` which only affects new data
- Existing webinars, registrations, users remain untouched

## Backup Strategy

### Automatic Backups (Railway)
Railway automatically backs up your database:
- **Point-in-time recovery** available
- Can restore to any point in the last 7 days (free tier) or 30 days (pro)
- Access via Railway Dashboard → Database → Backups

### Manual Backup (Optional Extra Safety)

If you want an extra backup before migration:

```bash
# Option 1: Using Railway CLI
railway db dump > backup_before_reminder_migration.sql

# Option 2: Using Prisma (exports data)
npx prisma db pull
```

### Quick Rollback (If Needed)

If something goes wrong (very unlikely):

```bash
# 1. Rollback the migration
npx prisma migrate rollback

# 2. Or restore from Railway backup
# Go to Railway Dashboard → Database → Backups → Restore
```

## Migration Preview

Before running, you can preview what will happen:

```bash
# Create migration without applying it
npx prisma migrate dev --create-only --name add_reminder_system

# Check the generated SQL in: prisma/migrations/{timestamp}_add_reminder_system/migration.sql
```

## Safe Migration Process

### Step 1: Verify Current State
```bash
# Check what's in your database now
npx prisma migrate status
```

### Step 2: Run Migration
```bash
# This creates the tables and generates types
npx prisma migrate dev --name add_reminder_system
```

You'll see output like:
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "railway"...

Applying migration `20241114000000_add_reminder_system`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20241114000000_add_reminder_system/
    └─ migration.sql

✔ Generated Prisma Client
```

### Step 3: Verify Success
```bash
# Check tables were created
npx prisma studio
# Look for: webinar_reminder_templates, webinar_reminders_sent
```

### Step 4: Test Code
```bash
# Start dev server - TypeScript errors should be gone
npm run dev
```

## What If Something Goes Wrong?

### Scenario 1: Migration Fails
- Usually means database connection issue
- Check Railway is running
- Check DATABASE_URL is correct
- Migration is transactional - either fully applies or fully rolls back

### Scenario 2: TypeScript Errors Remain
```bash
# Regenerate Prisma Client
npx prisma generate
```

### Scenario 3: Need to Undo
```bash
# Delete the migration folder
rm -rf prisma/migrations/20241114000000_add_reminder_system

# Reset database to previous state
npx prisma migrate reset
# WARNING: This will delete ALL data! Use Railway backup restore instead
```

## Risk Assessment

| Risk Factor | Level | Mitigation |
|-------------|-------|------------|
| Data Loss | **Very Low** | Only adding tables, not touching existing data |
| Downtime | **None** | Migration takes <1 second |
| Breaking Changes | **Very Low** | Existing code unaffected |
| Rollback Difficulty | **Very Low** | Can delete tables or restore Railway backup |

## Recommended Approach

### For Maximum Safety:
1. ✅ Verify Railway has recent automatic backup
2. ✅ Run migration during low traffic time (if you have users)
3. ✅ Keep this terminal window open to monitor
4. ✅ Test one registration after migration to verify reminders schedule

### For Speed:
Just run it - this is a safe migration! Your existing data won't be touched.

```bash
npx prisma migrate dev --name add_reminder_system
```

## After Migration Checklist

- [ ] Check TypeScript errors are gone in `src/lib/reminders.ts`
- [ ] Verify tables exist in database (via Prisma Studio or Railway dashboard)
- [ ] Test registration flow - check reminders are scheduled
- [ ] Monitor server logs for any errors
- [ ] Set up cron job to process reminders

## Questions?

**Q: Will this affect my live webinars?**
A: No, existing webinars continue working exactly as before.

**Q: Will existing registrations get reminders?**
A: No, only NEW registrations after migration will get reminders scheduled.

**Q: Can I add reminders to existing registrations later?**
A: Yes! You can create a script to backfill reminders for existing registrations if needed.

**Q: What if I don't want reminders for certain webinars?**
A: Simply don't create reminder templates for those webinars. Each webinar can have its own reminder schedule.

## Ready to Proceed?

When you're ready, just run:

```bash
npx prisma migrate dev --name add_reminder_system
```

This is a safe operation! 🎉
