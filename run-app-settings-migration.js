/**
 * Migration: a key/value settings table that survives deploys.
 *
 * Settings under `data/` are written to process.cwd()/data — the container's
 * own filesystem, not the Railway volume (which is mounted at /data/uploads).
 * They are therefore erased on every deploy and restart. That silently wiped
 * the Emaan integration config, and because a blank URL just means "don't
 * push", nothing reported an error: registrations kept working while updates
 * quietly stopped.
 *
 * Run once against the database:  node run-app-settings-migration.js
 *
 * Idempotent (CREATE TABLE IF NOT EXISTS), so it is safe to run more than once.
 */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const statements = [
  `CREATE TABLE IF NOT EXISTS "app_settings" (
     "key" TEXT NOT NULL,
     "value" JSONB NOT NULL,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
   )`,
]

async function runMigration() {
  for (const sql of statements) {
    console.log(`> ${sql.split('\n')[0]}…`)
    await prisma.$executeRawUnsafe(sql)
  }
  console.log('App settings migration complete.')
}

runMigration()
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
