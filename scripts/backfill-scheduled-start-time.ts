import { PrismaClient } from '@prisma/client'
import { fromZonedTime } from 'date-fns-tz'
import { writeFileSync } from 'fs'

/**
 * Repair external-webinar registrations whose scheduledStartTime the sync
 * overwrote with WebinarJam's wall-clock `event` string read as UTC.
 *
 * Until fix/sync-keeps-picker-start-time, every attendance update replaced the
 * instant the picker had booked with parseApiDate(registrant.event, guessed
 * zone). For registrants we created (lead page / manual) the API returns no
 * country, the guess is null, and the wall clock was stored as UTC — so an
 * 11 AM Sydney session (01:00Z) became 11:00Z. The reports then filed a
 * finished session under "yet to run" and dropped its live attendee.
 *
 * For each registrant the API returns, this
 *   1. treats a row as damaged only if its stored value equals the API's
 *      `event` wall clock read as UTC (to the minute) — a picker-booked value
 *      never looks like that unless the zone IS UTC, in which case nothing
 *      changes;
 *   2. works out which zone the API renders THIS registrant's dates in by
 *      matching its `signup_date` against our own registeredAt (exact, set by
 *      our server) — the row's timezone or America/New_York;
 *   3. rewrites scheduledStartTime as `event` in that zone.
 *
 * api_sync rows are left alone: their registeredAt came from the same parse,
 * so there is nothing exact to match against.
 *
 * Dry run by default; pass --apply to write. Every change is appended to a
 * JSON backup ({id, email, before, after}) named by --backup, default
 * ./scheduled-start-backfill-<timestamp>.json.
 *
 * Usage:
 *   railway run -s webinar-platform npx tsx scripts/backfill-scheduled-start-time.ts [--apply] [--backup path]
 */

const prisma = new PrismaClient()
const apiKey = process.env.WEBINARJAM_API_KEY
const APPLY = process.argv.includes('--apply')
const backupArg = process.argv.indexOf('--backup')
const BACKUP =
  backupArg >= 0 ? process.argv[backupArg + 1] : `./scheduled-start-backfill-${Date.now()}.json`

const MONTHS: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
}

/** "Tue, 1 Sep 2026, 11:00 AM" -> "2026-09-01T11:00:00" (no zone), or null. */
function wallClock(s: string | null | undefined): string | null {
  if (!s) return null
  const m = /^\w{3}, (\d{1,2}) (\w{3}) (\d{4}), (\d{1,2}):(\d{2}) (AM|PM)$/.exec(s.trim())
  if (!m) return null
  const [, d, mon, y, hh, mm, ap] = m
  const month = MONTHS[mon]
  if (!month) return null
  let h = Number(hh) % 12
  if (ap === 'PM') h += 12
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${y}-${pad(month)}-${pad(Number(d))}T${pad(h)}:${mm}:00`
}

const asUtc = (wall: string) => new Date(`${wall}Z`)
const inZone = (wall: string, zone: string): Date | null => {
  try {
    const d = fromZonedTime(wall, zone)
    return Number.isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}
const minutesApart = (a: Date, b: Date) => Math.abs(a.getTime() - b.getTime()) / 60000

type Row = {
  id: string
  email: string
  timezone: string | null
  registrationSource: string
  registeredAt: Date
  scheduledStartTime: Date | null
  joinedAt: Date | null
}

type ApiRegistrant = {
  email?: string
  event?: string
  signup_date?: string
}

async function fetchPage(platform: string, webinarId: string, page: number): Promise<ApiRegistrant[]> {
  const base = platform === 'everwebinar' ? 'everwebinar' : 'webinarjam'
  const res = await fetch(`https://api.webinarjam.com/${base}/registrants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ api_key: apiKey!, webinar_id: webinarId, date_range: '0', page: String(page) }),
  })
  if (!res.ok) throw new Error(`WebinarJam API ${res.status} for webinar ${webinarId} page ${page}`)
  const data = await res.json()
  if (data.status !== 'success') throw new Error(`WebinarJam API error for webinar ${webinarId}: ${JSON.stringify(data).slice(0, 200)}`)
  const r = data.registrants
  return Array.isArray(r) ? r : (r?.data ?? [])
}

async function main(): Promise<void> {
  if (!apiKey) {
    console.error('WEBINARJAM_API_KEY is not set')
    process.exit(1)
  }
  console.log(APPLY ? '*** APPLY MODE: writing changes ***' : 'Dry run (pass --apply to write)')

  const webinars = (
    await prisma.externalWebinar.findMany({
      select: { id: true, name: true, platform: true, externalWebinarId: true },
    })
  ).filter((w) => w.externalWebinarId)

  const totals = { seen: 0, matched: 0, apiSync: 0, intact: 0, unparsable: 0, zoneUnknown: 0, noop: 0, implausible: 0, fixed: 0 }
  const changes: Array<{ id: string; email: string; webinar: string; zone: string; before: string; after: string }> = []
  const zoneUnknownSamples: string[] = []

  for (const w of webinars) {
    const rows: Row[] = await prisma.$queryRawUnsafe(
      `select id, email, timezone, "registrationSource", "registeredAt", "scheduledStartTime", "joinedAt"
         from external_webinar_registrations where "externalWebinarId" = $1`,
      w.id
    )
    const byEmail = new Map(rows.map((r) => [r.email.toLowerCase(), r]))
    const per = { seen: 0, matched: 0, fixed: 0, zoneUnknown: 0 }

    for (let page = 1; page <= 400; page++) {
      const list = await fetchPage(w.platform, w.externalWebinarId, page)
      if (list.length === 0) break
      for (const reg of list) {
        per.seen++
        totals.seen++
        const row = byEmail.get((reg.email || '').toLowerCase())
        if (!row) continue
        per.matched++
        totals.matched++
        if (row.registrationSource === 'api_sync') { totals.apiSync++; continue }
        if (!row.scheduledStartTime) continue

        const eventWall = wallClock(reg.event)
        const signupWall = wallClock(reg.signup_date)
        if (!eventWall || !signupWall) { totals.unparsable++; continue }

        // 1. Damaged only if the stored value is the wall clock read as UTC.
        if (minutesApart(row.scheduledStartTime, asUtc(eventWall)) > 1) { totals.intact++; continue }

        // 2. Which zone does the API render this registrant's dates in?
        const candidates = Array.from(new Set([row.timezone, 'America/New_York'].filter(Boolean))) as string[]
        const zone = candidates.find((z) => {
          const signupAt = inZone(signupWall, z)
          return signupAt !== null && minutesApart(signupAt, row.registeredAt) <= 15
        })
        if (!zone) {
          totals.zoneUnknown++
          per.zoneUnknown++
          if (zoneUnknownSamples.length < 8) {
            zoneUnknownSamples.push(`${w.name}: ${row.email} tz=${row.timezone} registeredAt=${row.registeredAt.toISOString()} signup="${reg.signup_date}" stored=${row.scheduledStartTime.toISOString()}`)
          }
          continue
        }

        // 3. The corrected instant.
        const correct = inZone(eventWall, zone)
        if (!correct) { totals.unparsable++; continue }
        if (minutesApart(correct, row.scheduledStartTime) < 1) { totals.noop++; continue }
        if (row.joinedAt && correct.getTime() > row.joinedAt.getTime() + 15 * 60000) {
          totals.implausible++
          console.warn(`  ! skip ${row.email} (${w.name}): corrected start ${correct.toISOString()} is after joinedAt ${row.joinedAt.toISOString()}`)
          continue
        }

        changes.push({ id: row.id, email: row.email, webinar: w.name, zone, before: row.scheduledStartTime.toISOString(), after: correct.toISOString() })
        per.fixed++
        totals.fixed++
        if (APPLY) {
          await prisma.externalWebinarRegistration.update({ where: { id: row.id }, data: { scheduledStartTime: correct } })
        }
      }
    }
    console.log(`${w.name} (${w.externalWebinarId}): api=${per.seen} matched=${per.matched} ${APPLY ? 'fixed' : 'would fix'}=${per.fixed} zoneUnknown=${per.zoneUnknown}`)
  }

  writeFileSync(BACKUP, JSON.stringify({ applied: APPLY, at: new Date().toISOString(), changes }, null, 2))
  console.log('\nTotals:', JSON.stringify(totals))
  if (zoneUnknownSamples.length) console.log('Zone unknown (left alone), samples:\n  ' + zoneUnknownSamples.join('\n  '))
  const byZone: Record<string, number> = {}
  for (const c of changes) byZone[c.zone] = (byZone[c.zone] || 0) + 1
  console.log('Changes by zone:', JSON.stringify(byZone))
  console.log('Sample changes:')
  for (const c of changes.slice(0, 12)) console.log(`  ${c.webinar} | ${c.email} | ${c.zone} | ${c.before} -> ${c.after}`)
  console.log(`${APPLY ? 'Backup' : 'Plan'} written to ${BACKUP}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
