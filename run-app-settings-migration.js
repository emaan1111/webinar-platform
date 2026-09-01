/**
 * Migration: the app_settings key/value table.
 *
 * Emaan integration settings (the update-webhook URL, the routing rules) used
 * to live in data/emaan-routes.json on the container's own disk. The Railway
 * volume is mounted at /data/uploads, not there, so every deploy erased the
 * file — and a blank sync URL just means "don't push", so attendance silently
 * stopped reaching Emaan with nothing reporting an error. They now live here.
 *
 * Run once against the database, BEFORE deploying the code that reads it:
 *   railway run -s webinar-platform node run-app-settings-migration.js
 *
 * Idempotent (CREATE TABLE IF NOT EXISTS), so it is safe to run more than once.
 */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const statements = [
  `CREATE TABLE IF NOT EXISTS "app_settings" (
     "key"       TEXT PRIMARY KEY,
     "value"     JSONB NOT NULL,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
   )`,
]

async function runMigration() {
  for (const sql of statements) {
    console.log(`> ${sql}`)
    await prisma.$executeRawUnsafe(sql)
  }
  console.log('app_settings migration complete.')
}

runMigration()
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
