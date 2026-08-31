/**
 * Migration: replay URLs for external webinars and Zoom sessions.
 *
 * A live-Zoom session has no replay link anywhere in this app — the only replay
 * URL that exists is the per-attendee room WebinarJam returns at registration,
 * and Zoom picks never touch that. There is no Zoom API client here either, so
 * nothing can fetch a recording: a host has to paste one in.
 *
 * Two fields because the unit genuinely differs. A per-session URL is right for
 * a webinar where each cohort should watch its own recording; the evergreen one
 * on the webinar is right when the same recording is reused every time.
 *
 * Run once against the database:  node run-replay-url-migration.js
 *
 * Idempotent (ADD COLUMN IF NOT EXISTS), so it is safe to run more than once.
 */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const statements = [
  `ALTER TABLE "zoom_sessions" ADD COLUMN IF NOT EXISTS "replayUrl" TEXT`,
  `ALTER TABLE "external_webinars" ADD COLUMN IF NOT EXISTS "replayUrl" TEXT`,
]

async function runMigration() {
  for (const sql of statements) {
    console.log(`> ${sql}`)
    await prisma.$executeRawUnsafe(sql)
  }
  console.log('Replay URL migration complete.')
}

runMigration()
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
