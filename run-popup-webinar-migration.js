/**
 * Migration: link popups to external webinars (webinar registration popups).
 * Run once:  node run-popup-webinar-migration.js   (idempotent)
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function runMigration() {
  try {
    console.log('📊 Adding externalWebinarId column to popups...')
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "popups" ADD COLUMN IF NOT EXISTS "externalWebinarId" TEXT`
    )
    console.log('✅ Done!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

runMigration()
