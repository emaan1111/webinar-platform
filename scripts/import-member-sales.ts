/**
 * One-off: record the members CSV export as $297 sales and link each buyer to the
 * registration they came from.
 *
 * The CSV is a list export from the Emaan email app, so it carries no order id and
 * no transaction time — `added_to_list_at` stands in for the purchase date and the
 * order id is synthesised, the same way the manual-sale endpoints do it.
 *
 * Dry run by default. Pass --commit to write.
 */
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

const CSV = process.env.SALES_CSV || '/Volumes/WD/list-members-2026-07-27-to-2026-09-13.csv'
const AMOUNT = 297
const CURRENCY = 'USD'
const PRODUCT = 'Ultimate Mother'
const COMMIT = process.argv.includes('--commit')

/**
 * Rows the operator excluded after reviewing the match report.
 *
 * farheen_2@hotmail.com was in here: the CSV names it "test fggb" and the email
 * has genuinely been used for testing before. But its registration for the day
 * of the purchase is "Ifrah Mishaal", who attended live and watched 74 minutes,
 * so the sale is real and the CSV's name field is just stale. Trust the
 * registration over the CSV name when the two disagree.
 */
const SKIP_EMAILS = new Set<string>([])

/** Approved name matches: CSV email -> the external registration it belongs to. */
const NAME_MATCH_OVERRIDES: Record<string, string> = {
  'szramalval@gmail.com': 'cmtunee38031jn02iuwvu022d',
  'jeewajeez@methodistchurch.org.uk': 'cmtoywrwb0215me2i237ntt6y',
}

type Row = {
  email: string
  first_name: string
  last_name: string
  added_to_list_at: string
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let field = '', row: string[] = [], inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c !== '\r') field += c
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows.filter((r) => r.length > 1)
}

type Candidate = {
  kind: 'external' | 'internal'
  id: string
  webinarId: string
  webinar: string
  registeredAt: Date
}

/**
 * The registration a buyer most likely came from: the one nearest the purchase in
 * time, in either direction.
 *
 * Preferring "latest at or before the purchase" reads well but is wrong here,
 * because the CSV's timestamp is a list-add, not a transaction — it can land
 * minutes either side of the registration it belongs to. That rule picked a
 * registration three months earlier over one twenty-four minutes later.
 *
 * Internal and external candidates are ranked together; external breaks an exact
 * tie, since the paid funnel is where buyers come from.
 */
function pickRegistration(candidates: Candidate[], purchasedAt: Date): Candidate | null {
  if (!candidates.length) return null
  const distance = (c: Candidate) => Math.abs(c.registeredAt.getTime() - purchasedAt.getTime())
  const externalFirst = (a: Candidate, b: Candidate) =>
    a.kind === b.kind ? 0 : a.kind === 'external' ? -1 : 1

  return [...candidates].sort(
    (a, b) => distance(a) - distance(b) || externalFirst(a, b)
  )[0]
}

async function main() {
  const rows = parseCSV(fs.readFileSync(CSV, 'utf8'))
  const header = rows[0]
  const members = rows.slice(1).map(
    (r) => Object.fromEntries(header.map((h, i) => [h, r[i]])) as Row
  )

  console.log(`${COMMIT ? '🟢 COMMIT' : '🔵 DRY RUN'} — ${members.length} CSV rows, $${AMOUNT} each\n`)

  let written = 0, skipped = 0, unlinked = 0
  let revenue = 0

  for (const m of members) {
    const email = m.email.trim()
    const label = `${m.first_name} ${m.last_name}`.trim()

    if (SKIP_EMAILS.has(email.toLowerCase())) {
      console.log(`⏭  ${email} — excluded (test record)`)
      skipped++
      continue
    }

    const purchasedAt = new Date(m.added_to_list_at)

    const existing = await prisma.webinarSale.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    })
    if (existing) {
      console.log(`⏭  ${email} — already has a sale (${existing.orderId})`)
      skipped++
      continue
    }

    const internal = await prisma.registration.findMany({
      where: { email: { equals: email, mode: 'insensitive' } },
      include: { webinar: { select: { title: true } } },
    })
    let external = await prisma.externalWebinarRegistration.findMany({
      where: { email: { equals: email, mode: 'insensitive' } },
      include: { externalWebinar: { select: { name: true } } },
    })

    const overrideId = NAME_MATCH_OVERRIDES[email.toLowerCase()]
    if (!internal.length && !external.length && overrideId) {
      const approved = await prisma.externalWebinarRegistration.findUnique({
        where: { id: overrideId },
        include: { externalWebinar: { select: { name: true } } },
      })
      if (approved) external = [approved]
    }

    const candidates: Candidate[] = [
      ...external.map((e): Candidate => ({
        kind: 'external',
        id: e.id,
        webinarId: e.externalWebinarId,
        webinar: e.externalWebinar.name,
        registeredAt: e.registeredAt,
      })),
      ...internal.map((i): Candidate => ({
        kind: 'internal',
        id: i.id,
        webinarId: i.webinarId,
        webinar: i.webinar.title,
        registeredAt: i.registeredAt,
      })),
    ]

    const choice = pickRegistration(candidates, purchasedAt)

    if (!choice) {
      console.log(`❌ ${email} (${label}) — NO registration found, skipping`)
      unlinked++
      continue
    }

    const orderId = `emaan-list-${purchasedAt.toISOString().slice(0, 10)}-${email.toLowerCase()}`
    const via = overrideId ? ' [approved name match]' : ''
    console.log(
      `✅ ${email} (${label})${via}\n` +
      `     → ${choice.kind} · ${choice.webinar.slice(0, 55)} · registered ${choice.registeredAt.toISOString().slice(0, 10)}\n` +
      `     → $${AMOUNT} on ${purchasedAt.toISOString().slice(0, 10)} · ${orderId}`
    )

    if (COMMIT) {
      await prisma.$transaction(async (tx) => {
        await tx.webinarSale.create({
          data: {
            webinarId: choice!.kind === 'internal' ? choice!.webinarId : null,
            externalWebinarId: choice!.kind === 'external' ? choice!.webinarId : null,
            registrationId: choice!.kind === 'internal' ? choice!.id : null,
            externalRegistrationId: choice!.kind === 'external' ? choice!.id : null,
            email,
            orderId,
            productName: PRODUCT,
            amount: AMOUNT,
            currency: CURRENCY,
            status: 'paid',
            purchasedAt,
            rawPayload: {
              source: 'emaan_list_import',
              csv: CSV.split('/').pop(),
              csvName: label,
              matchedBy: overrideId ? 'name+phone (operator approved)' : 'email',
            },
          },
        })
        if (choice!.kind === 'internal') {
          await tx.registration.update({ where: { id: choice!.id }, data: { hasPurchased: true } })
        } else {
          await tx.externalWebinarRegistration.update({ where: { id: choice!.id }, data: { hasPurchased: true } })
        }
      })
    }

    written++
    revenue += AMOUNT
  }

  console.log(`\n===== ${COMMIT ? 'WRITTEN' : 'WOULD WRITE'} =====`)
  console.log(`sales:    ${written}`)
  console.log(`revenue:  $${revenue.toLocaleString()}`)
  console.log(`skipped:  ${skipped}`)
  console.log(`unlinked: ${unlinked}`)
  if (!COMMIT) console.log(`\nRe-run with --commit to write.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
