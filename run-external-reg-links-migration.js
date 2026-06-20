/**
 * Migration: store join links on external webinar registrations (for the countdown page).
 * Run once:  node run-external-reg-links-migration.js   (idempotent / safe to re-run)
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const statements = [
  `ALTER TABLE "external_webinar_registrations" ADD COLUMN IF NOT EXISTS "liveRoomUrl" TEXT`,
  `ALTER TABLE "external_webinar_registrations" ADD COLUMN IF NOT EXISTS "replayRoomUrl" TEXT`,
]

async function runMigration() {
  try {
    console.log('📊 Adding room-link columns to external_webinar_registrations...')
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
