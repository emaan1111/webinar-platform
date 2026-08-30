/**
 * Migration: give external-webinar registrants their own email opt-out columns.
 *
 * External registrants could never actually unsubscribe — the footer link and
 * the new RFC 8058 one-click endpoint look the id up in `registrations` first,
 * and `external_webinar_registrations` had no opt-out flag at all.
 *
 * Run once against the database:  node run-external-unsubscribe-migration.js
 * (or, with the Railway service env:  railway run node run-external-unsubscribe-migration.js)
 *
 * MUST run BEFORE deploying the matching code: the email scheduler selects the
 * whole external-registration row, so the new columns have to exist first.
 *
 * Idempotent (ADD COLUMN IF NOT EXISTS) and additive — the currently-deployed
 * code never references these columns, so it is safe to run ahead of the deploy.
 */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const statements = [
  `ALTER TABLE "external_webinar_registrations" ADD COLUMN IF NOT EXISTS "emailUnsubscribed" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "external_webinar_registrations" ADD COLUMN IF NOT EXISTS "emailUnsubscribedAt" TIMESTAMP(3)`,
]

async function runMigration() {
  try {
    console.log('📭 Adding email opt-out columns to external_webinar_registrations...')
    for (const statement of statements) {
      await prisma.$executeRawUnsafe(statement)
      console.log('✅ Executed:', statement.substring(0, 80) + '...')
    }
    const [row] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE "emailUnsubscribed")::int AS unsubscribed
         FROM "external_webinar_registrations"`
    )
    console.log(`✅ Migration completed. ${row.total} external registrations, ${row.unsubscribed} unsubscribed.`)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exitCode = 1
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

runMigration()
