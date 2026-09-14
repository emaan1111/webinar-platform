/**
 * Migration: version control for webinar settings (internal + external).
 * Creates the webinar_settings_versions table read by the Settings History
 * panel on both webinar settings screens.
 *
 * Run once against the database:  node run-webinar-settings-versions-migration.js
 *
 * Idempotent (IF NOT EXISTS everywhere), so it is safe to run more than once.
 *
 * Use this rather than `prisma db push`: this database has columns that
 * prisma/schema.prisma does not (the SMS reminder columns), and a push would
 * drop them. This script only ever adds.
 *
 * Mirrors add-webinar-settings-versions.sql. The statements live here as an
 * array because Postgres refuses multiple commands in one prepared statement,
 * which is how Prisma sends raw SQL — the same shape as the other run-*.js
 * migrations in this repo.
 */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const statements = [
  `CREATE TABLE IF NOT EXISTS "webinar_settings_versions" (
      "id" TEXT NOT NULL,
      "webinarType" TEXT NOT NULL,
      "webinarId" TEXT,
      "externalWebinarId" TEXT,
      "comment" TEXT,
      "source" TEXT NOT NULL DEFAULT 'manual',
      "changedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
      "settings" JSONB NOT NULL,
      "createdById" TEXT,
      "createdByEmail" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "webinar_settings_versions_pkey" PRIMARY KEY ("id")
   )`,

  `CREATE INDEX IF NOT EXISTS "webinar_settings_versions_webinarId_createdAt_idx"
      ON "webinar_settings_versions"("webinarId", "createdAt")`,

  `CREATE INDEX IF NOT EXISTS "webinar_settings_versions_externalWebinarId_createdAt_idx"
      ON "webinar_settings_versions"("externalWebinarId", "createdAt")`,

  // History dies with the webinar it describes, but survives the deletion of the
  // user who made the change.
  `DO $$
   BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'webinar_settings_versions_webinarId_fkey') THEN
           ALTER TABLE "webinar_settings_versions"
               ADD CONSTRAINT "webinar_settings_versions_webinarId_fkey"
               FOREIGN KEY ("webinarId") REFERENCES "webinars"("id")
               ON DELETE CASCADE ON UPDATE CASCADE;
       END IF;
       IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'webinar_settings_versions_externalWebinarId_fkey') THEN
           ALTER TABLE "webinar_settings_versions"
               ADD CONSTRAINT "webinar_settings_versions_externalWebinarId_fkey"
               FOREIGN KEY ("externalWebinarId") REFERENCES "external_webinars"("id")
               ON DELETE CASCADE ON UPDATE CASCADE;
       END IF;
       IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'webinar_settings_versions_createdById_fkey') THEN
           ALTER TABLE "webinar_settings_versions"
               ADD CONSTRAINT "webinar_settings_versions_createdById_fkey"
               FOREIGN KEY ("createdById") REFERENCES "users"("id")
               ON DELETE SET NULL ON UPDATE CASCADE;
       END IF;
   END
   $$`,

  `COMMENT ON TABLE "webinar_settings_versions" IS 'Settings history for internal webinars (webinarId) and external ones (externalWebinarId); settings holds the full post-change state.'`,

  `COMMENT ON COLUMN "webinar_settings_versions"."comment" IS 'The host''s note about why this change was made.'`,

  `COMMENT ON COLUMN "webinar_settings_versions"."source" IS 'manual | checkpoint | restore'`,
]

async function runMigration() {
  try {
    console.log('📊 Creating webinar_settings_versions table...')
    for (const statement of statements) {
      await prisma.$executeRawUnsafe(statement)
      console.log('✅ Executed:', statement.trim().split('\n')[0].slice(0, 70) + '...')
    }

    const [{ count }] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS count FROM "webinar_settings_versions"`
    )
    console.log(`✅ Migration completed. webinar_settings_versions has ${count} row(s).`)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

runMigration().catch(() => process.exit(1))
