import { PrismaClient } from '@prisma/client'
import { pushRegistrationUpdatesToEmaan } from '../src/lib/emaan'
import { readEmaanSyncUrl } from '../src/lib/emaanSettings'

/**
 * Re-push ATTENDANCE for external-webinar registrants into Emaan.
 *
 * Until the sync was unified, the sync that actually ran (lib/webinarjamSync,
 * via process-reminders) never pushed attendance, and the one that pushed was
 * never scheduled. Emaan therefore holds every registrant but no attendance at
 * all: everyone reads as "missed" once their session is three hours old, and
 * the attended/replay tags never fired. This sends the live/replay split for
 * everyone who attended (live or replay) with a session in the last N days.
 *
 * Attendance ONLY — `webinar_time` is deliberately not sent. The stored
 * scheduledStartTime on these rows is not trustworthy (the sync has written
 * WebinarJam's wall-clock time as UTC on some of them) and Emaan overwrites its
 * session time with whatever arrives. When the field is absent Emaan keeps the
 * session time it already has, which came from the registration push and is
 * correct.
 *
 * Re-runnable: Emaan's side is an upsert keyed on (webinar, contact) that only
 * ever adds tags and only fires a trigger for a genuinely new one.
 *
 * Usage:
 *   railway run -s webinar-platform npx tsx scripts/backfill-emaan-attendance.ts [days]
 *
 * `days` is how far back to go (by session date or join time); default 14.
 */

const prisma = new PrismaClient()

async function main(): Promise<void> {
  if (!(await readEmaanSyncUrl())) {
    console.error('No Emaan sync URL configured — nothing would be pushed.')
    console.error('Set it in Settings → Emaan. It must be an endpoint with NO tags and NO lists.')
    process.exit(1)
  }

  const arg = process.argv[2] ?? '14'
  const days = Number(arg)
  if (!Number.isFinite(days) || days <= 0) {
    console.error(`Invalid day count: ${arg}. Pass a positive number.`)
    process.exit(1)
  }
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  console.log(`Re-pushing attendance for sessions/joins on or after ${since.toISOString()}…`)

  const rows = await prisma.externalWebinarRegistration.findMany({
    where: {
      AND: [
        { OR: [{ attended: true }, { attendedLive: true }, { attendedReplay: true }] },
        { OR: [{ scheduledStartTime: { gte: since } }, { joinedAt: { gte: since } }] },
      ],
    },
    select: {
      email: true,
      name: true,
      phone: true,
      timezone: true,
      liveRoomUrl: true,
      replayRoomUrl: true,
      registeredAt: true,
      attended: true,
      watchTimeMinutes: true,
      attendedLive: true,
      attendedReplay: true,
      replayWatchTimeMinutes: true,
      externalWebinarId: true,
      externalWebinar: { select: { name: true, externalWebinarName: true } },
    },
    orderBy: { joinedAt: 'asc' },
  })
  console.log(`${rows.length} attended registration(s) found.`)
  if (rows.length === 0) return

  const result = await pushRegistrationUpdatesToEmaan(
    rows.map((r) => {
      // Rows from before the split carry one merged flag and one summed watch
      // time; read them the way the reports do — as live, replay unknowable.
      const replayMinutes = r.replayWatchTimeMinutes ?? 0
      const attendedLive = r.attendedLive ?? r.attended
      const liveMinutes =
        r.attendedLive == null ? r.watchTimeMinutes : Math.max(0, r.watchTimeMinutes - replayMinutes)
      return {
        email: r.email,
        name: r.name,
        phone: r.phone,
        webinar: {
          externalWebinarId: r.externalWebinarId,
          webinarName: r.externalWebinar.externalWebinarName || r.externalWebinar.name,
          // Attendance only — see the header. Emaan keeps its own session time.
          scheduledStartTime: null,
          timezone: r.timezone,
          liveRoomUrl: r.liveRoomUrl,
          replayRoomUrl: r.replayRoomUrl,
          sessionType: 'everwebinar' as const,
          registeredAt: r.registeredAt,
          attended: attendedLive,
          watchTimeMinutes: liveMinutes,
          attendedReplay: r.attendedReplay ?? false,
          replayMinutes,
        },
      }
    }),
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
