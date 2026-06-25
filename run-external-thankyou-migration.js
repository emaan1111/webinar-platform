/**
 * Migration: store the post-registration thank-you URL on external webinars.
 * Run once:  node run-external-thankyou-migration.js   (idempotent)
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function runMigration() {
  try {
    console.log('📊 Adding thankYouUrl column to external_webinars...')
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "external_webinars" ADD COLUMN IF NOT EXISTS "thankYouUrl" TEXT`
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
