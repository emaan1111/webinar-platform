import { PrismaClient } from '@prisma/client'
import { pushRegistrationUpdatesToEmaan } from '../src/lib/emaan'
import { readEmaanSyncUrl } from '../src/lib/emaanSettings'

/**
 * Backfill existing external-webinar registrations into Emaan.
 *
 * Two jobs, both re-runnable and both safe to run more than once because the
 * Emaan side is an upsert keyed on (webinar, contact):
 *
 *   1. First cutover. Emaan only learns about a registrant when Webinar Play
 *      pushes them, so without this its stats report starts empty and its
 *      history begins on deploy day.
 *   2. Repair. The live push is fire-and-forget with an 8-second timeout and
 *      no retry, so if Emaan is slow or down during a registration that person
 *      silently never reaches it — no contact, no reminder, no stats row.
 *      Re-running this over the last few days is the only way back.
 *
 * Targets the sync URL from Settings → Emaan, which must be a tag-less,
 * list-less Emaan webhook endpoint. That matters: Emaan fires tag_applied on every post and its
 * workflow enrolment has no re-entry guard, so backfilling through the TAGGED
 * registration URL would enrol every historical registrant into the reminder
 * workflow and mail them all at once.
 *
 * Usage:
 *   npx tsx scripts/backfill-emaan-registrations.ts [days]
 *
 * `days` is how far back to go by session date; default 90. Pass `all` for
 * every registration ever.
 */

const prisma = new PrismaClient()

async function main(): Promise<void> {
  if (!(await readEmaanSyncUrl())) {
    console.error('No Emaan sync URL configured — nothing would be pushed.')
    console.error('Set it in Settings → Emaan. It must be an endpoint with NO tags and NO lists.')
    process.exit(1)
  }

  const arg = process.argv[2] ?? '90'
  const days = arg === 'all' ? null : Number(arg)
  if (days !== null && (!Number.isFinite(days) || days <= 0)) {
    console.error(`Invalid day count: ${arg}. Pass a positive number, or "all".`)
    process.exit(1)
  }

  const since = days === null ? null : new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  console.log(
    since
      ? `Backfilling registrations with a session on or after ${since.toISOString()}…`
      : 'Backfilling every registration…',
  )

  const rows = await prisma.externalWebinarRegistration.findMany({
    where: since ? { scheduledStartTime: { gte: since } } : {},
    select: {
      email: true,
      name: true,
      phone: true,
      timezone: true,
      liveRoomUrl: true,
      replayRoomUrl: true,
      registeredAt: true,
      scheduledStartTime: true,
      attended: true,
      watchTimeMinutes: true,
      externalWebinarId: true,
      externalWebinar: { select: { name: true, externalWebinarName: true } },
    },
    orderBy: { scheduledStartTime: 'asc' },
  })

  // Emaan refuses a registration with no session instant rather than guessing
  // one, so filtering here keeps the run's own counts honest.
  const pushable = rows.filter((r) => r.scheduledStartTime !== null)
  const skipped = rows.length - pushable.length
  console.log(
    `${rows.length} registration(s) found${skipped > 0 ? `, ${skipped} skipped (no session date)` : ''}.`,
  )
  if (pushable.length === 0) return

  const result = await pushRegistrationUpdatesToEmaan(
    pushable.map((r) => ({
      email: r.email,
      name: r.name,
      phone: r.phone,
      webinar: {
        externalWebinarId: r.externalWebinarId,
        webinarName: r.externalWebinar.externalWebinarName || r.externalWebinar.name,
        scheduledStartTime: r.scheduledStartTime,
        timezone: r.timezone,
        liveRoomUrl: r.liveRoomUrl,
        replayRoomUrl: r.replayRoomUrl,
        // A Zoom pick's stored room link is its Zoom URL; anything else came
        // back from WebinarJam. Only used as a label on the Emaan side.
        sessionType: /zoom\.us/i.test(r.liveRoomUrl ?? '') ? 'zoom' : 'everwebinar',
        registeredAt: r.registeredAt,
        // Past sessions carry real attendance; upcoming ones are all false/0,
        // which is correct — nobody has attended them yet.
        attended: r.attended,
        watchTimeMinutes: r.watchTimeMinutes,
      },
    })),
  )

  console.log(`Done: ${result.pushed} pushed, ${result.failed} failed.`)
  if (result.failed > 0) {
    console.log('Re-run to retry the failures — every push is an idempotent upsert.')
  }
}

main()
  .catch((err) => {
    console.error('Backfill failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
