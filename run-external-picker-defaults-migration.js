/**
 * Migration: make the combined picker the default for external webinars, and backfill
 * existing ones onto it. Run once:  node run-external-picker-defaults-migration.js
 * Idempotent / safe to re-run (WHERE clauses only touch rows on the old defaults).
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const statements = [
  `ALTER TABLE "external_webinars" ALTER COLUMN "combineScheduleSources" SET DEFAULT true`,
  `ALTER TABLE "external_webinars" ALTER COLUMN "showJustInTime" SET DEFAULT true`,
  `ALTER TABLE "external_webinars" ALTER COLUMN "recurringSlotsToShow" SET DEFAULT 2`,
  `UPDATE "external_webinars" SET "combineScheduleSources" = true WHERE "combineScheduleSources" = false`,
  `UPDATE "external_webinars" SET "showJustInTime" = true WHERE "showJustInTime" = false`,
  `UPDATE "external_webinars" SET "recurringSlotsToShow" = 2 WHERE "recurringSlotsToShow" IS NULL`,
]

async function runMigration() {
  try {
    console.log('📊 Applying combined-picker defaults to external webinars...')
    for (const statement of statements) {
      const r = await prisma.$executeRawUnsafe(statement)
      console.log('✅', statement.substring(0, 64) + '…', typeof r === 'number' ? `(${r} rows)` : '')
    }
    console.log('✅ Done!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

runMigration()
