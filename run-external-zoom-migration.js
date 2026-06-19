/**
 * Migration: combined seamless picker for external (EverWebinar) webinars.
 * Adds live-Zoom + JIT + recurring-display columns to external_webinars.
 *
 * Run once against the database:  node run-external-zoom-migration.js
 *
 * Idempotent (ADD COLUMN IF NOT EXISTS), so it is safe to run more than once and
 * safe to run even if `prisma migrate deploy` already applied the matching migration.
 */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const statements = [
  `ALTER TABLE "external_webinars" ADD COLUMN IF NOT EXISTS "combineScheduleSources" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "external_webinars" ADD COLUMN IF NOT EXISTS "liveZoomEnabled" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "external_webinars" ADD COLUMN IF NOT EXISTS "liveZoomLink" TEXT`,
  `ALTER TABLE "external_webinars" ADD COLUMN IF NOT EXISTS "liveZoomAt" TIMESTAMP(3)`,
  `ALTER TABLE "external_webinars" ADD COLUMN IF NOT EXISTS "liveZoomTimezone" TEXT`,
  `ALTER TABLE "external_webinars" ADD COLUMN IF NOT EXISTS "showJustInTime" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "external_webinars" ADD COLUMN IF NOT EXISTS "jitLeadMinutes" INTEGER NOT NULL DEFAULT 15`,
  `ALTER TABLE "external_webinars" ADD COLUMN IF NOT EXISTS "recurringSlotsToShow" INTEGER`,
]

async function runMigration() {
  try {
    console.log('📊 Adding combined-picker columns to external_webinars...')
    for (const statement of statements) {
      await prisma.$executeRawUnsafe(statement)
      console.log('✅ Executed:', statement.substring(0, 70) + '...')
    }
    console.log('✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

runMigration()
